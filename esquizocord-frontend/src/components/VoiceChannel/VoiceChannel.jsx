// src/components/VoiceChannel/VoiceChannel.jsx
import React, { useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useVoiceChannel } from "../../hooks/useVoiceChannel"; // <-- IMPORTA O NOVO HOOK
import {
  VoiceChannelContainer,
  VoiceUserList,
  VoiceUser,
  AvatarContainer,
  VoiceControls,
  ControlButton,
} from "./styles";

// O componente de áudio permanece igual
const Audio = ({ peer, onAudioActivity }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!peer) return;

    let animationFrameId;
    let audioContext;
    let source;

    const handleTrack = (event) => {
      if (audioRef.current && event.streams && event.streams[0]) {
        audioRef.current.srcObject = event.streams[0];

        if (audioContext && audioContext.state !== "closed") {
          audioContext.close();
        }
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        source = audioContext.createMediaStreamSource(event.streams[0]);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const analyze = () => {
          analyser.getByteFrequencyData(dataArray);
          const average =
            dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          onAudioActivity(average > 10);
          animationFrameId = requestAnimationFrame(analyze);
        };
        analyze();
      }
    };

    peer.addEventListener("track", handleTrack);

    return () => {
      peer.removeEventListener("track", handleTrack);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (source) source.disconnect();
      if (audioContext && audioContext.state !== "closed") audioContext.close();
    };
  }, [peer, onAudioActivity]);

  return <audio ref={audioRef} autoPlay playsInline />;
};

// O componente principal agora é muito mais simples
const VoiceChannel = ({ channelId, onDisconnect }) => {
  const { user: currentUser } = useAuth();
  const {
    usersToRender,
    peers,
    isMuted,
    speaking,
    toggleMute,
    handleAudioActivity,
  } = useVoiceChannel(channelId, onDisconnect); // <-- USA O HOOK AQUI

  return (
    <VoiceChannelContainer>
      <VoiceUserList>
        {usersToRender.map(
          (member) =>
            member && (
              <VoiceUser key={member.socketId || member.id_usuario}>
                <AvatarContainer
                  $isSpeaking={
                    speaking[member.id_usuario] || speaking[member.socketId]
                  }
                >
                  <img
                    src={member.foto_perfil || "/images/logo.png"}
                    alt={member.nome}
                  />
                </AvatarContainer>
                <span>
                  {member.id_usuario === currentUser.id_usuario
                    ? `(Você)`
                    : member.nome}
                </span>
                {member.id_usuario !== currentUser.id_usuario &&
                  peers[member.socketId] && (
                    <Audio
                      peer={peers[member.socketId]}
                      onAudioActivity={(isSpeaking) =>
                        handleAudioActivity(member.socketId, isSpeaking)
                      }
                    />
                  )}
              </VoiceUser>
            )
        )}
      </VoiceUserList>
      <VoiceControls>
        <ControlButton
          $active={!isMuted}
          onClick={toggleMute}
          title={isMuted ? "Ativar som" : "Silenciar"}
        >
          <i
            className={`fas ${
              isMuted ? "fa-microphone-slash" : "fa-microphone"
            }`}
          ></i>
        </ControlButton>
        <ControlButton
          $active={false}
          onClick={onDisconnect}
          title="Desconectar"
        >
          <i className="fas fa-phone-slash"></i>
        </ControlButton>
      </VoiceControls>
    </VoiceChannelContainer>
  );
};

export default VoiceChannel;

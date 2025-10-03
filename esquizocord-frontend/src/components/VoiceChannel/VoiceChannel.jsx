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

const Audio = ({ stream, onAudioActivity }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
    }
  }, [stream]);

  // A lógica de análise de áudio pode ser adicionada aqui se necessário,
  // mas foi removida por simplicidade para garantir a funcionalidade principal.
  return <audio ref={audioRef} autoPlay playsInline />;
};

const VoiceChannel = ({ channelId, onDisconnect }) => {
  const { user: currentUser } = useAuth();
  const {
    usersToRender,
    remoteStreams,
    isMuted,
    speaking,
    toggleMute,
    handleAudioActivity,
  } = useVoiceChannel(channelId, onDisconnect);

  return (
    <VoiceChannelContainer>
      <VoiceUserList>
        {usersToRender.map((member) => {
          if (!member) return null;
          const stream =
            member.id_usuario === currentUser.id_usuario
              ? null
              : remoteStreams[member.socketId];

          return (
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
              {stream && (
                <Audio
                  stream={stream}
                  onAudioActivity={(isSpeaking) =>
                    handleAudioActivity(member.socketId, isSpeaking)
                  }
                />
              )}
            </VoiceUser>
          );
        })}
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

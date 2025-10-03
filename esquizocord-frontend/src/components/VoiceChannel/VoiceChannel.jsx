// src/components/VoiceChannel/VoiceChannel.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import {
  VoiceChannelContainer,
  VoiceUserList,
  VoiceUser,
  AvatarContainer,
  VoiceControls,
  ControlButton,
} from "./styles";

// Componente de Áudio Otimizado
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

        // --- CORREÇÃO: Garante que o AudioContext é criado e destruído corretamente ---
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
          onAudioActivity(average > 10); // Limiar de sensibilidade
          animationFrameId = requestAnimationFrame(analyze);
        };
        analyze();
      }
    };

    peer.addEventListener("track", handleTrack);

    return () => {
      peer.removeEventListener("track", handleTrack);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (source) {
        source.disconnect();
      }
      if (audioContext && audioContext.state !== "closed") {
        audioContext.close();
      }
    };
  }, [peer, onAudioActivity]);

  return <audio ref={audioRef} autoPlay playsInline />;
};

// Componente Principal do Canal de Voz Refatorado
const VoiceChannel = ({ channelId, onDisconnect }) => {
  const { user: currentUser } = useAuth();
  const socket = useSocket();

  const [peers, setPeers] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [speaking, setSpeaking] = useState({});
  const [connectedUsers, setConnectedUsers] = useState({});

  const localStreamRef = useRef(null);
  const peersRef = useRef({});

  const handleAudioActivity = useCallback((userId, isSpeaking) => {
    setSpeaking((prev) => ({ ...prev, [userId]: isSpeaking }));
  }, []);

  useEffect(() => {
    if (!socket) return;

    let isComponentMounted = true;
    let localAudioAnalyserCleanup = () => {};

    // --- LÓGICA CENTRALIZADA PARA CRIAR CONEXÕES ---
    const createPeer = (targetSocketId, stream) => {
      // Se já existir uma conexão, reutiliza-a
      if (peersRef.current[targetSocketId]) {
        return peersRef.current[targetSocketId];
      }

      const peer = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      peer.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("webrtc-ice-candidate", {
            targetSocketId,
            candidate: e.candidate,
          });
        }
      };

      peersRef.current[targetSocketId] = peer;
      setPeers((prev) => ({ ...prev, [targetSocketId]: peer }));

      return peer;
    };

    // Função para iniciar o áudio local e a análise de "a falar"
    const startLocalAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        if (!isComponentMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        localStreamRef.current = stream;

        const audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let animationFrameId;

        const analyze = () => {
          analyser.getByteFrequencyData(dataArray);
          const average =
            dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          handleAudioActivity(socket.id, average > 5 && !isMuted);
          animationFrameId = requestAnimationFrame(analyze);
        };
        analyze();

        localAudioAnalyserCleanup = () => {
          cancelAnimationFrame(animationFrameId);
          source.disconnect();
          if (audioContext.state !== "closed") audioContext.close();
        };

        socket.emit("join-voice-channel", channelId);
      } catch (err) {
        console.error("Erro ao aceder ao microfone:", err);
        alert("Não foi possível aceder ao microfone. Verifique as permissões.");
        if (onDisconnect) onDisconnect();
      }
    };

    startLocalAudio();

    // --- NOVAS FUNÇÕES DE EVENTO SIMPLIFICADAS ---

    // 1. Quando ESTE utilizador entra, recebe a lista dos outros e inicia a conexão com eles.
    const handleAllUsers = (users) => {
      const usersMap = {};
      users.forEach((user) => {
        usersMap[user.socketId] = user;
        if (localStreamRef.current) {
          const peer = createPeer(user.socketId, localStreamRef.current);
          peer.createOffer().then((offer) => {
            peer.setLocalDescription(offer);
            socket.emit("webrtc-offer", {
              targetSocketId: user.socketId,
              offer,
            });
          });
        }
      });
      if (isComponentMounted) setConnectedUsers(usersMap);
    };

    // 2. Quando um utilizador JÁ PRESENTE é notificado de um novo, ele apenas o adiciona à lista.
    // A conexão será iniciada pelo novo utilizador.
    const handleUserJoined = (user) => {
      if (isComponentMounted) {
        setConnectedUsers((prev) => ({ ...prev, [user.socketId]: user }));
      }
    };

    // 3. Quando um utilizador JÁ PRESENTE recebe uma "oferta" de conexão do novo.
    const handleOffer = ({ fromSocketId, offer }) => {
      if (isComponentMounted && localStreamRef.current) {
        const peer = createPeer(fromSocketId, localStreamRef.current);
        peer.setRemoteDescription(new RTCSessionDescription(offer));
        peer.createAnswer().then((answer) => {
          peer.setLocalDescription(answer);
          socket.emit("webrtc-answer", {
            targetSocketId: fromSocketId,
            answer,
          });
        });
      }
    };

    // 4. O utilizador que fez a "oferta" recebe a "resposta".
    const handleAnswer = ({ fromSocketId, answer }) => {
      peersRef.current[fromSocketId]?.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    };

    // 5. Troca de informações de rede entre os pares.
    const handleIceCandidate = ({ fromSocketId, candidate }) => {
      peersRef.current[fromSocketId]
        ?.addIceCandidate(new RTCIceCandidate(candidate))
        .catch((e) => console.error("Erro ao adicionar ICE candidate:", e));
    };

    // 6. Quando alguém sai, limpamos a sua conexão e estado.
    const handleUserLeft = ({ socketId }) => {
      if (peersRef.current[socketId]) {
        peersRef.current[socketId].close();
        delete peersRef.current[socketId];
      }
      if (isComponentMounted) {
        setPeers((prev) => {
          const newPeers = { ...prev };
          delete newPeers[socketId];
          return newPeers;
        });
        setConnectedUsers((prev) => {
          const newUsers = { ...prev };
          delete newUsers[socketId];
          return newUsers;
        });
      }
    };

    // Registo dos eventos
    socket.on("all-users-in-voice-channel", handleAllUsers);
    socket.on("user-joined-voice", handleUserJoined);
    socket.on("webrtc-offer", handleOffer);
    socket.on("webrtc-answer", handleAnswer);
    socket.on("webrtc-ice-candidate", handleIceCandidate);
    socket.on("user-left-voice", handleUserLeft);

    // Função de limpeza
    return () => {
      isComponentMounted = false;
      localAudioAnalyserCleanup();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      socket.emit("leave-voice-channel", channelId);
      Object.values(peersRef.current).forEach((peer) => peer.close());
      peersRef.current = {};

      socket.off("all-users-in-voice-channel", handleAllUsers);
      socket.off("user-joined-voice", handleUserJoined);
      socket.off("webrtc-offer", handleOffer);
      socket.off("webrtc-answer", handleAnswer);
      socket.off("webrtc-ice-candidate", handleIceCandidate);
      socket.off("user-left-voice", handleUserLeft);
    };
  }, [
    channelId,
    socket,
    currentUser.id_usuario,
    handleAudioActivity,
    onDisconnect,
    isMuted,
  ]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      });
    }
  };

  const usersToRender = [
    { ...currentUser, socketId: socket?.id },
    ...Object.values(connectedUsers),
  ];

  return (
    <VoiceChannelContainer>
      <VoiceUserList>
        {usersToRender.map(
          (member) =>
            member && (
              <VoiceUser key={member.socketId || member.id_usuario}>
                <AvatarContainer
                  $isSpeaking={
                    speaking[member.socketId] || speaking[member.id_usuario]
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

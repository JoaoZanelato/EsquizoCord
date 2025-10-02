// src/components/VoiceChannel/VoiceChannel.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import {
  VoiceChannelContainer,
  VoiceUserList,
  VoiceUser,
  VoiceControls,
  ControlButton,
} from "./styles";

// Componente de áudio para reproduzir o som dos outros utilizadores
const Audio = ({ peer }) => {
  const ref = useRef();

  useEffect(() => {
    peer.ontrack = (e) => {
      ref.current.srcObject = e.streams[0];
    };
  }, [peer]);

  return <audio autoPlay ref={ref} />;
};

const VoiceChannel = ({ channelId, members }) => {
  const { user: currentUser } = useAuth();
  const socket = useSocket();

  // --- INÍCIO DAS ALTERAÇÕES ---
  const [peers, setPeers] = useState({});
  const [localStream, setLocalStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  const peersRef = useRef({}); // Usado para manter as instâncias de RTCPeerConnection
  const audioRefs = useRef({}); // Usado para manter as instâncias dos elementos de áudio

  const createPeer = useCallback(
    (targetSocketId, stream) => {
      const peer = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      // Adiciona as faixas de áudio do nosso stream local à nova conexão
      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });

      // Quando o outro lado adiciona um stream, guardamo-lo para reprodução
      peer.ontrack = (event) => {
        if (audioRefs.current[targetSocketId]) {
          audioRefs.current[targetSocketId].srcObject = event.streams[0];
        }
      };

      // Envia os ICE candidates para o outro par via socket
      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc-ice-candidate", {
            targetSocketId,
            candidate: event.candidate,
          });
        }
      };

      return peer;
    },
    [socket]
  );

  const connectToVoice = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      setLocalStream(stream);

      socket.emit("join-voice-channel", {
        channelId,
        userId: currentUser.id_usuario,
      });

      socket.emit("get-users-in-voice-channel", channelId, (usersInChannel) => {
        usersInChannel.forEach((userInChannel) => {
          if (userInChannel.socketId !== socket.id) {
            const peer = createPeer(userInChannel.socketId, stream);
            peersRef.current[userInChannel.socketId] = peer;

            peer.createOffer().then((offer) => {
              peer.setLocalDescription(offer);
              socket.emit("webrtc-offer", {
                targetSocketId: userInChannel.socketId,
                offer,
              });
            });
          }
        });
      });
    } catch (error) {
      console.error("Erro ao aceder ao microfone:", error);
      alert(
        "Não foi possível aceder ao seu microfone. Verifique as permissões do navegador."
      );
    }
  }, [channelId, currentUser.id_usuario, socket, createPeer]);

  const disconnectFromVoice = useCallback(() => {
    socket.emit("leave-voice-channel", channelId);

    // Parar o stream local
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    setLocalStream(null);

    // Fechar todas as conexões peer
    Object.values(peersRef.current).forEach((peer) => peer.close());
    peersRef.current = {};
    setPeers({});
  }, [channelId, socket, localStream]);

  useEffect(() => {
    if (!socket) return;

    // --- Handlers de Sinalização ---
    const handleNewUser = ({ socketId }) => {
      if (localStream) {
        const peer = createPeer(socketId, localStream);
        peersRef.current[socketId] = peer;
        peer.createOffer().then((offer) => {
          peer.setLocalDescription(offer);
          socket.emit("webrtc-offer", { targetSocketId: socketId, offer });
        });
        setPeers((prev) => ({ ...prev, [socketId]: {} }));
      }
    };

    const handleOffer = ({ fromSocketId, offer }) => {
      if (localStream) {
        const peer = createPeer(fromSocketId, localStream);
        peersRef.current[fromSocketId] = peer;
        peer.setRemoteDescription(new RTCSessionDescription(offer));
        peer.createAnswer().then((answer) => {
          peer.setLocalDescription(answer);
          socket.emit("webrtc-answer", {
            targetSocketId: fromSocketId,
            answer,
          });
        });
        setPeers((prev) => ({ ...prev, [fromSocketId]: {} }));
      }
    };

    const handleAnswer = ({ fromSocketId, answer }) => {
      peersRef.current[fromSocketId]?.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    };

    const handleIceCandidate = ({ fromSocketId, candidate }) => {
      peersRef.current[fromSocketId]?.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    };

    const handleUserLeft = ({ socketId }) => {
      if (peersRef.current[socketId]) {
        peersRef.current[socketId].close();
        delete peersRef.current[socketId];
      }
      if (audioRefs.current[socketId]) {
        delete audioRefs.current[socketId];
      }
      setPeers((prev) => {
        const newPeers = { ...prev };
        delete newPeers[socketId];
        return newPeers;
      });
    };

    socket.on("user-joined-voice", handleNewUser);
    socket.on("webrtc-offer", handleOffer);
    socket.on("webrtc-answer", handleAnswer);
    socket.on("webrtc-ice-candidate", handleIceCandidate);
    socket.on("user-left-voice", handleUserLeft);

    return () => {
      // Limpeza geral
      socket.off("user-joined-voice", handleNewUser);
      socket.off("webrtc-offer", handleOffer);
      socket.off("webrtc-answer", handleAnswer);
      socket.off("webrtc-ice-candidate", handleIceCandidate);
      socket.off("user-left-voice", handleUserLeft);
      disconnectFromVoice();
    };
  }, [socket, localStream, createPeer, disconnectFromVoice]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };
  // --- FIM DAS ALTERAÇÕES ---

  return (
    <VoiceChannelContainer>
      <h2>Canal de Voz: {channelId}</h2>
      <VoiceUserList>
        {/* Mostra o utilizador atual */}
        <VoiceUser>
          <img
            src={currentUser.fotoPerfil || "/images/logo.png"}
            alt={currentUser.nome}
          />
          <span>{currentUser.nome} (Você)</span>
        </VoiceUser>

        {/* Mostra os outros utilizadores conectados */}
        {Object.keys(peers).map((socketId) => {
          // Encontra a info do membro pelo socketId (isto pode ser otimizado)
          const peerInfo = members.find((m) => m.socketId === socketId);
          return (
            <VoiceUser key={socketId}>
              <img
                src={peerInfo?.fotoPerfil || "/images/logo.png"}
                alt={peerInfo?.nome}
              />
              <span>{peerInfo?.nome || "Utilizador"}</span>
              <audio
                ref={(el) => (audioRefs.current[socketId] = el)}
                autoPlay
              />
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
          onClick={disconnectFromVoice}
          title="Desconectar"
        >
          <i className="fas fa-phone-slash"></i>
        </ControlButton>
      </VoiceControls>
    </VoiceChannelContainer>
  );
};

export default VoiceChannel;

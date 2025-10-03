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

const Audio = ({ peer, onAudioActivity }) => {
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);

  useEffect(() => {
    if (!peer) return;

    const handleTrack = (event) => {
      if (audioRef.current) {
        audioRef.current.srcObject = event.streams[0];

        if (!audioContextRef.current) {
          const context = new (window.AudioContext ||
            window.webkitAudioContext)();
          audioContextRef.current = context;
          const source = context.createMediaStreamSource(event.streams[0]);
          const analyser = context.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          let animationFrameId;

          const analyze = () => {
            analyser.getByteFrequencyData(dataArray);
            const average =
              dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            onAudioActivity(average > 10);
            animationFrameId = requestAnimationFrame(analyze);
          };
          analyze();

          return () => {
            cancelAnimationFrame(animationFrameId);
            source.disconnect();
            if (context.state !== "closed") {
              context.close();
            }
          };
        }
      }
    };

    peer.addEventListener("track", handleTrack);
    return () => {
      peer.removeEventListener("track", handleTrack);
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [peer, onAudioActivity]);

  return <audio ref={audioRef} autoPlay playsInline />;
};

const VoiceChannel = ({ channelId, onDisconnect }) => {
  const { user: currentUser } = useAuth();
  const socket = useSocket();

  const [peers, setPeers] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [speaking, setSpeaking] = useState({});
  const [connectedUsers, setConnectedUsers] = useState({});

  const localStreamRef = useRef(null);
  const peersRef = useRef({});

  const handleAudioActivity = useCallback((id, isSpeaking) => {
    setSpeaking((prev) => ({ ...prev, [id]: isSpeaking }));
  }, []);

  const handleDisconnectClick = useCallback(() => {
    if (onDisconnect) {
      onDisconnect();
    }
  }, [onDisconnect]);

  useEffect(() => {
    if (!socket) return;

    let isComponentMounted = true;
    let localAudioCleanup = () => {};

    const createPeer = (targetSocketId, stream) => {
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
      return peer;
    };

    const connect = async () => {
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
          handleAudioActivity(currentUser.id_usuario, average > 5 && !isMuted);
          animationFrameId = requestAnimationFrame(analyze);
        };
        analyze();

        localAudioCleanup = () => {
          cancelAnimationFrame(animationFrameId);
          source.disconnect();
          if (audioContext.state !== "closed") {
            audioContext.close();
          }
        };

        socket.emit("join-voice-channel", channelId);
      } catch (err) {
        console.error("Erro ao aceder ao microfone:", err);
        alert("Não foi possível aceder ao microfone. Verifique as permissões.");
        handleDisconnectClick();
      }
    };

    connect();

    const handleAllUsers = (users) => {
      const usersMap = {};
      const peersToCreate = {};
      users.forEach((user) => {
        usersMap[user.socketId] = user;
        if (user.socketId !== socket.id && localStreamRef.current) {
          const peer = createPeer(user.socketId, localStreamRef.current);
          peersRef.current[user.socketId] = peer;
          peersToCreate[user.socketId] = { peer };
          peer.createOffer().then((offer) => {
            peer.setLocalDescription(offer);
            socket.emit("webrtc-offer", {
              targetSocketId: user.socketId,
              offer,
            });
          });
        }
      });
      if (isComponentMounted) {
        setConnectedUsers(usersMap);
        setPeers(peersToCreate);
      }
    };

    const handleUserJoined = (user) => {
      if (isComponentMounted && localStreamRef.current) {
        setConnectedUsers((prev) => ({ ...prev, [user.socketId]: user }));
        const peer = createPeer(user.socketId, localStreamRef.current);
        peersRef.current[user.socketId] = peer;
        setPeers((prev) => ({ ...prev, [user.socketId]: { peer } }));
      }
    };

    const handleOffer = ({ fromSocketId, offer }) => {
      if (isComponentMounted && localStreamRef.current) {
        const peer = createPeer(fromSocketId, localStreamRef.current);
        peersRef.current[fromSocketId] = peer;
        peer.setRemoteDescription(new RTCSessionDescription(offer));
        peer.createAnswer().then((answer) => {
          peer.setLocalDescription(answer);
          socket.emit("webrtc-answer", {
            targetSocketId: fromSocketId,
            answer,
          });
        });
        setPeers((prev) => ({ ...prev, [fromSocketId]: { peer } }));
      }
    };

    const handleAnswer = ({ fromSocketId, answer }) => {
      peersRef.current[fromSocketId]?.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    };

    const handleIceCandidate = ({ fromSocketId, candidate }) => {
      peersRef.current[fromSocketId]
        ?.addIceCandidate(new RTCIceCandidate(candidate))
        .catch((e) => console.error("Erro ao adicionar ICE candidate:", e));
    };

    const handleUserLeft = ({ socketId }) => {
      if (peersRef.current[socketId]) {
        peersRef.current[socketId].close();
        delete peersRef.current[socketId];
      }
      if (isComponentMounted) {
        setPeers((prev) => {
          const { [socketId]: _, ...rest } = prev;
          return rest;
        });
        setConnectedUsers((prev) => {
          const { [socketId]: _, ...rest } = prev;
          return rest;
        });
      }
    };

    socket.on("all-users-in-voice-channel", handleAllUsers);
    socket.on("user-joined-voice", handleUserJoined);
    socket.on("webrtc-offer", handleOffer);
    socket.on("webrtc-answer", handleAnswer);
    socket.on("webrtc-ice-candidate", handleIceCandidate);
    socket.on("user-left-voice", handleUserLeft);

    return () => {
      isComponentMounted = false;
      localAudioCleanup();
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
    handleDisconnectClick,
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
    ...Object.values(connectedUsers).filter((u) => u.socketId !== socket?.id),
  ];

  return (
    <VoiceChannelContainer>
      <VoiceUserList>
        {usersToRender.map(
          (member) =>
            member && (
              <VoiceUser key={member.socketId || member.id_usuario}>
                <AvatarContainer $isSpeaking={speaking[member.id_usuario]}>
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
                      peer={peers[member.socketId].peer}
                      onAudioActivity={(isSpeaking) =>
                        handleAudioActivity(member.id_usuario, isSpeaking)
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
          onClick={handleDisconnectClick}
          title="Desconectar"
        >
          <i className="fas fa-phone-slash"></i>
        </ControlButton>
      </VoiceControls>
    </VoiceChannelContainer>
  );
};

export default VoiceChannel;

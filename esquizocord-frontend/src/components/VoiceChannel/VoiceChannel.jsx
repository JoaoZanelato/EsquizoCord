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

  useEffect(() => {
    if (!socket) return;

    let isComponentMounted = true;

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
        socket.emit("join-voice-channel", channelId);
      } catch (err) {
        console.error("Erro ao aceder ao microfone:", err);
        alert("Não foi possível aceder ao microfone. Verifique as permissões.");
        if (onDisconnect) onDisconnect();
      }
    };

    connect();

    const handleAllUsers = (users) => {
      if (!isComponentMounted) return;
      const usersMap = {};
      const newPeers = {};
      users.forEach((user) => {
        usersMap[user.socketId] = user;
        if (localStreamRef.current) {
          const peer = createPeer(user.socketId, localStreamRef.current);
          peersRef.current[user.socketId] = peer;
          newPeers[user.socketId] = peer;
          peer.createOffer().then((offer) => {
            peer.setLocalDescription(offer);
            socket.emit("webrtc-offer", {
              targetSocketId: user.socketId,
              offer,
            });
          });
        }
      });
      setConnectedUsers(usersMap);
      setPeers((prev) => ({ ...prev, ...newPeers }));
    };

    const handleUserJoined = (user) => {
      if (isComponentMounted && user.socketId !== socket.id) {
        setConnectedUsers((prev) => ({ ...prev, [user.socketId]: user }));
      }
    };

    const handleOffer = ({ fromSocketId, offer }) => {
      if (isComponentMounted && localStreamRef.current) {
        const peer = createPeer(fromSocketId, localStreamRef.current);
        peersRef.current[fromSocketId] = peer;
        setPeers((prev) => ({ ...prev, [fromSocketId]: peer }));
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
  }, [channelId, socket]); // <-- CORREÇÃO PRINCIPAL: onDisconnect foi removido das dependências.

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const newEnabledState = !audioTracks[0].enabled;
        audioTracks.forEach((track) => {
          track.enabled = newEnabledState;
        });
        setIsMuted(!newEnabledState);
      }
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

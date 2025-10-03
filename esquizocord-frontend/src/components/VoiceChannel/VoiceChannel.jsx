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
      console.log("[VC] Audio Component: Received remote track event.", event);
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
      console.log("[VC] Audio Component: Cleaning up track listener.");
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
    console.log("[VC] Component Mounted. Socket available.", socket.id);

    let isComponentMounted = true;

    const createPeer = (targetSocketId, stream) => {
      console.log(
        `[VC] createPeer: Creating peer for target ${targetSocketId}`
      );
      const peer = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      stream.getTracks().forEach((track) => {
        console.log(
          `[VC] createPeer: Adding local track to peer for ${targetSocketId}`
        );
        peer.addTrack(track, stream);
      });

      peer.onicecandidate = (e) => {
        if (e.candidate) {
          console.log(
            `[VC] onicecandidate: Sending ICE candidate to ${targetSocketId}`
          );
          socket.emit("webrtc-ice-candidate", {
            targetSocketId,
            candidate: e.candidate,
          });
        }
      };
      return peer;
    };

    const connect = async () => {
      console.log("[VC] connect: Attempting to get user media (microphone).");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        if (!isComponentMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        console.log("[VC] connect: Successfully got local stream.");
        localStreamRef.current = stream;

        console.log(
          "[VC] connect: Emitting 'join-voice-channel' for channel:",
          channelId
        );
        socket.emit("join-voice-channel", channelId);
      } catch (err) {
        console.error("[VC] FATAL: Error getting user media.", err);
        alert("Não foi possível aceder ao microfone. Verifique as permissões.");
        if (onDisconnect) onDisconnect();
      }
    };

    connect();

    const handleAllUsers = (users) => {
      if (!isComponentMounted) return;
      console.log(
        "[VC] handleAllUsers: Received list of existing users.",
        users
      );

      const usersMap = {};
      const newPeers = {};

      users.forEach((user) => {
        usersMap[user.socketId] = user;
        if (localStreamRef.current) {
          console.log(
            `[VC] handleAllUsers: Creating peer and sending offer to ${user.socketId}`
          );
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
        console.log(
          "[VC] handleUserJoined: New user joined the channel.",
          user
        );
        setConnectedUsers((prev) => ({ ...prev, [user.socketId]: user }));
      }
    };

    const handleOffer = ({ fromSocketId, offer }) => {
      if (isComponentMounted && localStreamRef.current) {
        console.log(`[VC] handleOffer: Received offer from ${fromSocketId}.`);
        const peer = createPeer(fromSocketId, localStreamRef.current);
        peersRef.current[fromSocketId] = peer;
        setPeers((prev) => ({ ...prev, [fromSocketId]: peer }));

        peer.setRemoteDescription(new RTCSessionDescription(offer));
        peer.createAnswer().then((answer) => {
          console.log(`[VC] handleOffer: Sending answer to ${fromSocketId}.`);
          peer.setLocalDescription(answer);
          socket.emit("webrtc-answer", {
            targetSocketId: fromSocketId,
            answer,
          });
        });
      }
    };

    const handleAnswer = ({ fromSocketId, answer }) => {
      console.log(`[VC] handleAnswer: Received answer from ${fromSocketId}.`);
      peersRef.current[fromSocketId]?.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    };

    const handleIceCandidate = ({ fromSocketId, candidate }) => {
      console.log(
        `[VC] handleIceCandidate: Received ICE candidate from ${fromSocketId}.`
      );
      peersRef.current[fromSocketId]
        ?.addIceCandidate(new RTCIceCandidate(candidate))
        .catch((e) => console.error("[VC] Error adding ICE candidate:", e));
    };

    const handleUserLeft = ({ socketId }) => {
      console.log(`[VC] handleUserLeft: User with socketId ${socketId} left.`);
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
      console.log(
        "[VC] Component Unmounting: Cleaning up all connections and listeners."
      );
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
  }, [channelId, socket, onDisconnect]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        // Determina o novo estado com base no estado atual do primeiro track
        const newEnabledState = !audioTracks[0].enabled;
        // Aplica o novo estado a todos os tracks
        audioTracks.forEach((track) => {
          track.enabled = newEnabledState;
        });
        // Atualiza o estado do React para refletir na UI
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

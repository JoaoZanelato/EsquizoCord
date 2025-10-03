// src/hooks/useVoiceChannel.js
import { useEffect, useState, useRef, useCallback } from "react";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";

export const useVoiceChannel = (channelId, onDisconnect) => {
  const { user: currentUser } = useAuth();
  const socket = useSocket();

  const [connectedUsers, setConnectedUsers] = useState({});
  const [peers, setPeers] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [speaking, setSpeaking] = useState({});

  const localStreamRef = useRef(null);
  const peersRef = useRef({});

  const handleAudioActivity = useCallback((id, isSpeaking) => {
    setSpeaking((prev) => ({ ...prev, [id]: isSpeaking }));
  }, []);

  // Limpa todas as conexões e listeners
  const cleanup = useCallback(() => {
    console.log("[useVoice] Cleaning up all voice connections.");
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    Object.values(peersRef.current).forEach((peer) => peer.close());
    peersRef.current = {};

    setPeers({});
    setConnectedUsers({});
    setSpeaking({});

    if (socket && channelId) {
      socket.emit("leave-voice-channel", channelId);
    }
  }, [socket, channelId]);

  useEffect(() => {
    if (!socket || !channelId) {
      return;
    }

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

      peersRef.current[targetSocketId] = peer;
      setPeers((prev) => ({ ...prev, [targetSocketId]: peer }));
      return peer;
    };

    const initialize = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        if (!isComponentMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        localStreamRef.current = stream;
        setIsMuted(false);
        socket.emit("join-voice-channel", channelId);
      } catch (err) {
        console.error("Microphone access error:", err);
        alert("Could not access microphone. Please check permissions.");
        if (onDisconnect) onDisconnect();
      }
    };

    initialize();

    const handleAllUsers = (users) => {
      if (!isComponentMounted || !localStreamRef.current) return;
      const usersMap = {};
      users.forEach((user) => {
        usersMap[user.socketId] = user;
        const peer = createPeer(user.socketId, localStreamRef.current);
        peer.createOffer().then((offer) => {
          peer.setLocalDescription(offer);
          socket.emit("webrtc-offer", { targetSocketId: user.socketId, offer });
        });
      });
      setConnectedUsers(usersMap);
    };

    const handleUserJoined = (user) => {
      if (isComponentMounted) {
        setConnectedUsers((prev) => ({ ...prev, [user.socketId]: user }));
      }
    };

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
      cleanup();
      socket.off("all-users-in-voice-channel", handleAllUsers);
      socket.off("user-joined-voice", handleUserJoined);
      socket.off("webrtc-offer", handleOffer);
      socket.off("webrtc-answer", handleAnswer);
      socket.off("webrtc-ice-candidate", handleIceCandidate);
      socket.off("user-left-voice", handleUserLeft);
    };
  }, [channelId, socket, cleanup, onDisconnect]);

  const toggleMute = useCallback(() => {
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
  }, []);

  const usersToRender = [
    { ...currentUser, socketId: socket?.id },
    ...Object.values(connectedUsers),
  ];

  return {
    usersToRender,
    peers,
    isMuted,
    speaking,
    toggleMute,
    handleAudioActivity,
  };
};

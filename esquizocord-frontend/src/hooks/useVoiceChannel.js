// src/hooks/useVoiceChannel.js
import { useEffect, useState, useRef, useCallback } from "react";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";

export const useVoiceChannel = (channelId, onDisconnect) => {
  const { user: currentUser } = useAuth();
  const socket = useSocket();

  const [connectedUsers, setConnectedUsers] = useState({});
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [speaking, setSpeaking] = useState({});

  const localStreamRef = useRef(null);
  const peersRef = useRef({});

  const handleAudioActivity = useCallback((id, isSpeaking) => {
    setSpeaking((prev) => ({ ...prev, [id]: isSpeaking }));
  }, []);

  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    Object.values(peersRef.current).forEach((peer) => peer.close());
    peersRef.current = {};
    setRemoteStreams({});
    setConnectedUsers({});
    if (socket && channelId) {
      socket.emit("leave-voice-channel", channelId);
    }
  }, [socket, channelId]);

  useEffect(() => {
    if (!socket || !channelId) return;

    let isMounted = true;

    const createPeer = (targetSocketId, stream) => {
      // Evita recriar uma conexão que já existe
      if (peersRef.current[targetSocketId]) {
        return peersRef.current[targetSocketId];
      }
      const peer = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      //Correção chat de voz: log do estado da conexão
      peer.oniceconnectionstatechange = (event) => {
        console.log(
            `Conexão ICE com ${targetSocketId} mudou para: ${peer.iceConnectionState}`
        );
    };

      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      peer.ontrack = (event) => {
        if (isMounted) {
          setRemoteStreams((prev) => ({
            ...prev,
            [targetSocketId]: event.streams[0],
          }));
        }
      };

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc-ice-candidate", {
            targetSocketId,
            candidate: event.candidate,
          });
        }
      };

      peersRef.current[targetSocketId] = peer;
      return peer;
    };

    const initialize = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        localStreamRef.current = stream;
        setIsMuted(false);
        socket.emit("join-voice-channel", channelId);
      } catch (err) {
        console.error("Microphone access error:", err);
        alert("Não foi possível aceder ao microfone. Verifique as permissões.");
        if (onDisconnect) onDisconnect();
      }
    };

    initialize();

    const handleAllUsers = (users) => {
      if (!isMounted || !localStreamRef.current) return;
      const usersMap = {};
      users.forEach((user) => {
        usersMap[user.socketId] = user;
        // --- CORREÇÃO DE "GLARE" ---
        // Apenas o utilizador com o ID "menor" inicia a oferta.
        if (socket.id < user.socketId) {
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
      setConnectedUsers(usersMap);
    };

    const handleUserJoined = (user) => {
      if (isMounted && localStreamRef.current && user.socketId !== socket.id) {
        setConnectedUsers((prev) => ({ ...prev, [user.socketId]: user }));
        // --- CORREÇÃO DE "GLARE" ---
        // Apenas o utilizador com o ID "menor" inicia a oferta.
        if (socket.id < user.socketId) {
          const peer = createPeer(user.socketId, localStreamRef.current);
          peer.createOffer().then((offer) => {
            peer.setLocalDescription(offer);
            socket.emit("webrtc-offer", {
              targetSocketId: user.socketId,
              offer,
            });
          });
        }
      }
    };

    const handleOffer = ({ fromSocketId, offer }) => {
      if (isMounted && localStreamRef.current) {
        const peer = createPeer(fromSocketId, localStreamRef.current);
        peer.setRemoteDescription(new RTCSessionDescription(offer));
        peer.createAnswer().then((answer) => {
          peer.setLocalDescription(answer);
          socket.emit("webrtc-answer", {
            targetSocketId: fromSocketId,
            answer,
          });
        });
        // Garante que o utilizador que fez a oferta é adicionado à lista para renderização
        setConnectedUsers((prev) => ({
          ...prev,
          [fromSocketId]: { socketId: fromSocketId, ...offer.user },
        }));
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
      if (isMounted) {
        setRemoteStreams((prev) => {
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
      isMounted = false;
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
        audioTracks.forEach((track) => (track.enabled = newEnabledState));
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
    remoteStreams,
    isMuted,
    speaking,
    toggleMute,
    handleAudioActivity,
  };
};

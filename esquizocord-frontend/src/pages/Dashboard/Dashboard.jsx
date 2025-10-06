// src/pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { useNotification } from "../../context/NotificationContext/NotificationContext";
import apiClient from "../../services/api";

import ChannelList from "../../components/ChannelList/ChannelList";
import ChatArea from "../../components/ChatArea/ChatArea";
import CreateGroupModal from "../../components/CreateGroupModal/CreateGroupModal";
import ExploreGroupsModal from "../../components/ExploreGroupsModal/ExploreGroupsModal";
import EditGroupModal from "../../components/EditGroupModal/EditGroupModal";
import UserProfileModal from "../../components/UserProfileModal/UserProfileModal";

import {
  DashboardLayout,
  ServerList,
  ServerIcon,
  Divider,
  LoadingContainer,
  NotificationBadge,
  Backdrop,
} from "./styles";

const Dashboard = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const { addNotification } = useNotification();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeChat, setActiveChat] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isExploreModalOpen, setIsExploreModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [viewingProfileId, setViewingProfileId] = useState(null);
  // --- INÍCIO DA CORREÇÃO ---
  // O estado agora é inicializado com base na largura da janela para evitar o menu aberto em mobile.
  const [isChannelListOpen, setIsChannelListOpen] = useState(
    window.innerWidth > 768
  );
  // --- FIM DA CORREÇÃO ---
  const [notifications, setNotifications] = useState([]);

  const dashboardDataRef = useRef(dashboardData);
  useEffect(() => {
    dashboardDataRef.current = dashboardData;
  }, [dashboardData]);

  // --- INÍCIO DA CORREÇÃO ---
  // Adiciona um listener para ajustar o estado do menu se o utilizador redimensionar a janela.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsChannelListOpen(true);
      } else {
        setIsChannelListOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    // Limpa o listener quando o componente é desmontado.
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  // --- FIM DA CORREÇÃO ---

  const fetchData = useCallback(async (selectChatAfter = null) => {
    try {
      const response = await apiClient.get("/dashboard");
      setDashboardData(response.data);
      if (selectChatAfter) {
        setActiveChat(selectChatAfter);
      }
    } catch (err) {
      setError(
        "Não foi possível carregar os seus dados. Tente atualizar a página."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectChat = useCallback((chat) => {
    setActiveChat(chat);
    setReplyingTo(null);
    if (chat.type === "dm") {
      setNotifications((prev) =>
        prev.filter((n) => n.senderId !== chat.user.id_usuario)
      );
    }
    // Fecha o menu em mobile ao selecionar uma conversa.
    if (window.innerWidth <= 768) {
      setIsChannelListOpen(false);
    }
  }, []);

  useEffect(() => {
    if (socket) {
      const handleNewDM = (msg) => {
        if (!dashboardDataRef.current) return;

        if (
          !activeChat ||
          activeChat.type !== "dm" ||
          activeChat.user.id_usuario !== msg.id_remetente
        ) {
          if (msg.id_remetente !== user.id_usuario) {
            const newNotification = {
              id: `dm-${msg.id_remetente}`,
              type: "dm",
              message: `Nova mensagem de ${msg.autorNome}`,
              senderId: msg.id_remetente,
            };
            setNotifications((prev) => [
              ...prev.filter((n) => n.id !== newNotification.id),
              newNotification,
            ]);
          }
        }
      };
      const handleNewGroupMessage = (msg) => {
        if (!dashboardDataRef.current) return;

        if (
          !activeChat ||
          activeChat.type !== "group" ||
          activeChat.channelId !== msg.id_chat
        ) {
          const group = dashboardDataRef.current.groups.find(
            (g) => g.id_grupo === msg.groupId
          );
          const groupName = group?.nome || "um grupo";
          const newNotification = {
            id: `group-${msg.groupId}`,
            type: "group",
            message: `Nova mensagem em ${groupName}`,
            groupId: msg.groupId,
          };
          setNotifications((prev) => [
            ...prev.filter((n) => n.id !== newNotification.id),
            newNotification,
          ]);
        }
      };
      const handleFriendRequest = (request) => {
        const newNotification = {
          id: `friend_request-${request.id_usuario}`,
          type: "friend_request",
          message: `${request.nome} enviou-lhe um pedido de amizade.`,
          senderId: request.id_usuario,
        };
        setNotifications((prev) => [
          ...prev.filter((n) => n.id !== newNotification.id),
          newNotification,
        ]);
      };

      const handleChannelDeleted = ({ channelId, groupId }) => {
        if (
          activeChat &&
          activeChat.type === "group" &&
          activeChat.group.details.id_grupo === groupId
        ) {
          setActiveChat((currentChat) => {
            const newChannels = currentChat.group.channels.filter(
              (c) => c.id_chat !== channelId
            );
            if (currentChat.channelId === channelId) {
              return {
                ...currentChat,
                group: { ...currentChat.group, channels: newChannels },
                channelId: newChannels[0]?.id_chat,
                channelName: newChannels[0]?.nome,
              };
            }
            return {
              ...currentChat,
              group: { ...currentChat.group, channels: newChannels },
            };
          });
        }
      };

      const handleMemberKicked = ({ groupId, kickedUserId }) => {
        if (kickedUserId === user.id_usuario) {
          addNotification("Você foi banido deste grupo.", "error");
          setDashboardData((prev) => ({
            ...prev,
            groups: prev.groups.filter((g) => g.id_grupo !== groupId),
          }));
          setActiveChat(null);
        } else {
          if (
            activeChat &&
            activeChat.type === "group" &&
            activeChat.group.details.id_grupo === groupId
          ) {
            setActiveChat((currentChat) => ({
              ...currentChat,
              group: {
                ...currentChat.group,
                members: currentChat.group.members.filter(
                  (m) => m.id_usuario !== kickedUserId
                ),
              },
            }));
          }
        }
      };

      const handleStatusChanged = ({
        userId,
        status,
        status_personalizado,
      }) => {
        setDashboardData((prevData) => {
          if (!prevData) return prevData;

          const newFriends = prevData.friends.map((friend) =>
            friend.id_usuario === userId
              ? { ...friend, status, status_personalizado }
              : friend
          );

          if (activeChat?.type === "group") {
            setActiveChat((currentChat) => ({
              ...currentChat,
              group: {
                ...currentChat.group,
                members: currentChat.group.members.map((m) =>
                  m.id_usuario === userId
                    ? { ...m, status, status_personalizado }
                    : m
                ),
              },
            }));
          }

          return { ...prevData, friends: newFriends };
        });
      };

      socket.on("user_status_changed", handleStatusChanged);
      socket.on("member_kicked", handleMemberKicked);
      socket.on("new_dm", handleNewDM);
      socket.on("new_group_message", handleNewGroupMessage);
      socket.on("friend_request_received", handleFriendRequest);
      socket.on("group_channel_deleted", handleChannelDeleted);

      return () => {
        socket.off("user_status_changed", handleStatusChanged);
        socket.off("member_kicked", handleMemberKicked);
        socket.off("new_dm", handleNewDM);
        socket.off("new_group_message", handleNewGroupMessage);
        socket.off("friend_request_received", handleFriendRequest);
        socket.off("group_channel_deleted", handleChannelDeleted);
      };
    }
  }, [
    socket,
    activeChat,
    user.id_usuario,
    fetchData,
    handleSelectChat,
    addNotification,
  ]);

  const handleSelectGroup = async (group) => {
    try {
      const response = await apiClient.get(`/groups/${group.id_grupo}/details`);
      const groupDetails = response.data;
      const defaultChannel = groupDetails.channels.find(
        (c) => c.tipo === "TEXTO"
      );

      setActiveChat({
        type: "group",
        group: groupDetails,
        channelId: defaultChannel?.id_chat,
        channelName: defaultChannel?.nome,
        channelType: defaultChannel?.tipo,
      });
      setNotifications((prev) =>
        prev.filter((n) => n.groupId !== group.id_grupo)
      );
    } catch (err) {
      console.error("Erro ao carregar detalhes do grupo:", err);
      addNotification(
        "Não foi possível carregar os detalhes deste servidor.",
        "error"
      );
    } finally {
      if (window.innerWidth <= 768) {
        setIsChannelListOpen(false);
      }
    }
  };

  const handleFriendAction = async (action, id) => {
    let url = "",
      body = {},
      method = "post";
    switch (action) {
      case "add":
        url = "/friends/request";
        body = { requestedId: id };
        break;
      case "remove":
        if (!window.confirm("Tem a certeza que deseja remover este amigo?"))
          return;
        url = `/friends/${id}`;
        method = "delete";
        break;
      case "accept":
        url = "/friends/respond";
        body = { requestId: id, action: "aceite" };
        break;
      case "reject":
        url = "/friends/respond";
        body = { requestId: id, action: "recusada" };
        break;
      case "cancel":
        url = "/friends/cancel";
        body = { requestId: id };
        break;
      default:
        return;
    }
    try {
      await apiClient[method](url, body);
      fetchData();
      if (viewingProfileId) {
        setViewingProfileId(null);
        setTimeout(() => setViewingProfileId(id), 0);
      }
    } catch (error) {
      addNotification(
        error.response?.data?.message || `Erro ao executar a ação: ${action}`,
        "error"
      );
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Tem a certeza de que deseja apagar esta mensagem?")) {
      return;
    }

    try {
      let url = "";
      if (activeChat?.type === "group") {
        url = `/groups/messages/${messageId}`;
      } else if (activeChat?.type === "dm") {
        url = `/friends/dm/messages/${messageId}`;
      }

      if (url) {
        await apiClient.delete(url);
      }
    } catch (error) {
      addNotification(
        error.response?.data?.message || "Não foi possível apagar a mensagem.",
        "error"
      );
    }
  };

  const handleEditMessage = async (messageId, newContent) => {
    try {
      let url = "";
      if (activeChat?.type === "group") {
        url = `/groups/messages/${messageId}`;
      } else if (activeChat?.type === "dm") {
        url = `/friends/dm/messages/${messageId}`;
      }

      if (url) {
        await apiClient.put(url, { content: newContent });
      }
    } catch (error) {
      addNotification(
        error.response?.data?.message || "Não foi possível editar a mensagem.",
        "error"
      );
    }
  };

  const handleBanMember = async (memberToBan) => {
    if (
      !window.confirm(
        `Tem a certeza de que deseja banir ${memberToBan.nome} do grupo? Esta ação é irreversível.`
      )
    ) {
      return;
    }

    try {
      if (activeChat?.type === "group") {
        await apiClient.delete(
          `/groups/${activeChat.group.details.id_grupo}/members/${memberToBan.id_usuario}`
        );
      }
    } catch (error) {
      addNotification(
        error.response?.data?.message || "Não foi possível banir o membro.",
        "error"
      );
    }
  };

  const handleSendMessage = (userToMessage) => {
    setActiveChat({ type: "dm", user: userToMessage });
    setViewingProfileId(null);
    if (window.innerWidth <= 768) {
      setIsChannelListOpen(false);
    }
  };

  const handleRoleUpdated = (updatedRole) => {
    if (!activeChat || activeChat.type !== "group") return;

    setActiveChat((currentActiveChat) => {
      const newActiveChat = {
        ...currentActiveChat,
        group: {
          ...currentActiveChat.group,
          members: currentActiveChat.group.members.map((member) => {
            const cargoIndex =
              member.cargos?.findIndex(
                (c) => c.id_cargo === updatedRole.id_cargo
              ) ?? -1;

            if (cargoIndex !== -1) {
              const newCargos = [...member.cargos];
              newCargos[cargoIndex] = {
                ...newCargos[cargoIndex],
                ...updatedRole,
              };
              return { ...member, cargos: newCargos };
            }
            return member;
          }),
        },
      };
      return newActiveChat;
    });
  };

  const handleChannelCreated = (newChannel) => {
    if (!activeChat || activeChat.type !== "group") return;

    setActiveChat((currentChat) => {
      const newGroupData = { ...currentChat.group };
      newGroupData.channels = [...newGroupData.channels, newChannel];

      return {
        ...currentChat,
        group: newGroupData,
        channelId: newChannel.id_chat,
        channelName: newChannel.nome,
        channelType: newChannel.tipo,
      };
    });
  };

  const handleChannelDeleted = async (channelId) => {
    if (!window.confirm("Tem a certeza de que deseja apagar este canal?")) {
      return;
    }

    try {
      if (activeChat?.type === "group") {
        await apiClient.delete(
          `/groups/${activeChat.group.details.id_grupo}/channels/${channelId}`
        );
      }
    } catch (error) {
      addNotification(
        error.response?.data?.message || "Não foi possível apagar o canal.",
        "error"
      );
    }
  };

  const handleLeaveGroup = async (groupToLeave) => {
    if (
      !window.confirm(
        `Tem a certeza de que deseja sair do servidor "${groupToLeave.nome}"?`
      )
    )
      return;

    try {
      await apiClient.delete(`/groups/${groupToLeave.id_grupo}/leave`);
      addNotification(`Você saiu de "${groupToLeave.nome}".`, "success");
      setActiveChat(null);
      fetchData();
    } catch (error) {
      addNotification(
        error.response?.data?.message || "Erro ao sair do grupo.",
        "error"
      );
    }
  };

  if (loading) {
    return <LoadingContainer>A carregar o seu universo.</LoadingContainer>;
  }
  if (error) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          color: "red",
        }}
      >
        {error}
      </div>
    );
  }
  if (!dashboardData) {
    return <div>Não foi possível carregar os dados.</div>;
  }

  return (
    <>
      <DashboardLayout>
        <Backdrop
          $isOpen={isChannelListOpen}
          onClick={() => setIsChannelListOpen(false)}
        />

        <ServerList>
          <ServerIcon
            title="Início"
            className={!activeChat || activeChat.type === "dm" ? "active" : ""}
            onClick={() => {
              setActiveChat(null);
              setReplyingTo(null);
              setIsChannelListOpen(true);
              setNotifications((prev) =>
                prev.filter(
                  (n) => n.type !== "dm" && n.type !== "friend_request"
                )
              );
            }}
          >
            <img src="/images/logo.png" alt="Início" />
            {notifications.some(
              (n) => n.type === "dm" || n.type === "friend_request"
            ) && <NotificationBadge />}
          </ServerIcon>
          <Divider />

          {dashboardData.groups.map((group) => (
            <ServerIcon
              key={group.id_grupo}
              title={group.nome}
              className={
                activeChat?.type === "group" &&
                activeChat.group.details.id_grupo === group.id_grupo
                  ? "active"
                  : ""
              }
              onClick={() => handleSelectGroup(group)}
            >
              <img
                src={group.foto || "/images/default-group-icon.png"}
                alt={group.nome}
              />
              {notifications.some((n) => n.groupId === group.id_grupo) && (
                <NotificationBadge />
              )}
            </ServerIcon>
          ))}

          <ServerIcon
            title="Adicionar um servidor"
            onClick={() => setIsCreateGroupModalOpen(true)}
          >
            <i
              className="fas fa-plus"
              style={{ color: "var(--green-accent)" }}
            ></i>
          </ServerIcon>
          <ServerIcon
            title="Explorar Servidores"
            onClick={() => setIsExploreModalOpen(true)}
          >
            <i
              className="fas fa-compass"
              style={{ color: "var(--green-accent)" }}
            ></i>
          </ServerIcon>

          <div style={{ marginTop: "auto" }}>
            <ServerIcon as={Link} to="/settings" title="Configurações">
              <img src={user.foto_perfil || "/images/logo.png"} alt="Perfil" />
            </ServerIcon>
          </div>
        </ServerList>

        <ChannelList
          data={dashboardData}
          onSelectChat={handleSelectChat}
          onUpdate={fetchData}
          activeChat={activeChat}
          onOpenGroupSettings={() => setIsEditGroupModalOpen(true)}
          onViewProfile={setViewingProfileId}
          onFriendAction={handleFriendAction}
          onBanMember={handleBanMember}
          $isChannelListOpen={isChannelListOpen}
          onChannelCreated={handleChannelCreated}
          onChannelDeleted={handleChannelDeleted}
          onLeaveGroup={handleLeaveGroup}
        />

        <ChatArea
          chatInfo={activeChat}
          onViewProfile={setViewingProfileId}
          replyingTo={replyingTo}
          onReply={setReplyingTo}
          onCancelReply={() => setReplyingTo(null)}
          onDeleteMessage={handleDeleteMessage}
          onEditMessage={handleEditMessage}
          onMenuClick={() => setIsChannelListOpen((prev) => !prev)}
          onSelectChat={handleSelectChat}
        />
      </DashboardLayout>

      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onGroupCreated={fetchData}
      />
      <ExploreGroupsModal
        isOpen={isExploreModalOpen}
        onClose={() => setIsExploreModalOpen(false)}
        onGroupJoined={fetchData}
      />

      <EditGroupModal
        isOpen={isEditGroupModalOpen}
        onClose={() => setIsEditGroupModalOpen(false)}
        groupDetails={
          activeChat?.type === "group" ? activeChat.group.details : null
        }
        currentUserPermissions={
          activeChat?.type === "group"
            ? activeChat.group.currentUserPermissions
            : 0
        }
        onGroupUpdated={() => {
          fetchData();
          if (activeChat?.type === "group") {
            handleSelectGroup(activeChat.group.details);
          }
        }}
        onGroupDeleted={() => {
          fetchData();
          setActiveChat(null);
        }}
        onRoleUpdated={handleRoleUpdated}
      />

      <UserProfileModal
        userId={viewingProfileId}
        onClose={() => setViewingProfileId(null)}
        onAction={handleFriendAction}
        onBanMember={handleBanMember}
        onSendMessage={handleSendMessage}
        activeGroup={activeChat?.type === "group" ? activeChat.group : null}
      />
    </>
  );
};

export default Dashboard;

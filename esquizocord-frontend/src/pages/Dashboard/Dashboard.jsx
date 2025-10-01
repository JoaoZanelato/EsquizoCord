// src/pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
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
} from "./styles";

const Dashboard = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeChat, setActiveChat] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isExploreModalOpen, setIsExploreModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [viewingProfileId, setViewingProfileId] = useState(null);
  const [isChannelListOpen, setIsChannelListOpen] = useState(false);
  const [notifications, setNotifications] = useState({
    dm: new Set(),
    groups: new Set(),
  });

  const fetchData = useCallback(
    async (selectChatAfter = null) => {
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
        if (loading) setLoading(false);
      }
    },
    [loading]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (socket) {
      const handleNewDM = (msg) => {
        if (
          !activeChat ||
          activeChat.type !== "dm" ||
          activeChat.user.id_usuario !== msg.id_remetente
        ) {
          if (msg.id_remetente !== user.id_usuario) {
            setNotifications((prev) => ({
              ...prev,
              dm: new Set(prev.dm).add(msg.id_remetente),
            }));
          }
        }
      };
      const handleNewGroupMessage = (msg) => {
        if (
          !activeChat ||
          activeChat.type !== "group" ||
          activeChat.channelId !== msg.id_chat
        ) {
          setNotifications((prev) => ({
            ...prev,
            groups: new Set(prev.groups).add(msg.groupId),
          }));
        }
      };
      const handleFriendRequest = () => {
        setNotifications((prev) => ({
          ...prev,
          dm: new Set(prev.dm).add("pending"),
        }));
      };

      socket.on("new_dm", handleNewDM);
      socket.on("new_group_message", handleNewGroupMessage);
      socket.on("friend_request_received", handleFriendRequest);

      return () => {
        socket.off("new_dm", handleNewDM);
        socket.off("new_group_message", handleNewGroupMessage);
        socket.off("friend_request_received", handleFriendRequest);
      };
    }
  }, [socket, activeChat, user.id_usuario]);

  const handleSelectGroup = async (group) => {
    try {
      const response = await apiClient.get(`/groups/${group.id_grupo}/details`);
      const groupDetails = response.data;
      const defaultChannel = groupDetails.channels[0];

      setActiveChat({
        type: "group",
        group: groupDetails,
        channelId: defaultChannel?.id_chat,
        channelName: defaultChannel?.Nome,
      });
      setNotifications((prev) => {
        const newGroups = new Set(prev.groups);
        newGroups.delete(group.id_grupo);
        return { ...prev, groups: newGroups };
      });
      setIsChannelListOpen(false);
    } catch (err) {
      console.error("Erro ao carregar detalhes do grupo:", err);
      alert("Não foi possível carregar os detalhes deste servidor.");
    }
  };

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    setReplyingTo(null);
    if (chat.type === "dm") {
      setNotifications((prev) => {
        const newDms = new Set(prev.dm);
        newDms.delete(chat.user.id_usuario);
        return { ...prev, dm: newDms };
      });
    }
    setIsChannelListOpen(false);
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
      alert(
        error.response?.data?.message || `Erro ao executar a ação: ${action}`
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
      alert(
        error.response?.data?.message || "Não foi possível apagar a mensagem."
      );
    }
  };

  const handleSendMessage = (userToMessage) => {
    setActiveChat({ type: "dm", user: userToMessage });
    setViewingProfileId(null);
  };

  // --- FUNÇÃO CORRIGIDA ---
  const handleRoleUpdated = (updatedRole) => {
    if (!activeChat || activeChat.type !== "group") return;

    setActiveChat((currentActiveChat) => {
      // Cria cópias apenas dos níveis do objeto que precisam de ser alterados
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
              // Se o membro tiver o cargo, cria um novo membro com os cargos atualizados
              const newCargos = [...member.cargos];
              newCargos[cargoIndex] = {
                ...newCargos[cargoIndex],
                ...updatedRole,
              };
              return { ...member, cargos: newCargos };
            }
            // Se não, retorna o membro original sem alterações
            return member;
          }),
        },
      };
      return newActiveChat;
    });
  };

  if (loading) {
    return <LoadingContainer>A carregar o seu universo...</LoadingContainer>;
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
        <ServerList $isOpen={isChannelListOpen}>
          <ServerIcon
            title="Início"
            className={!activeChat || activeChat.type === "dm" ? "active" : ""}
            onClick={() => {
              setActiveChat(null);
              setReplyingTo(null);
              setIsChannelListOpen(true);
              setNotifications((prev) => ({ ...prev, dm: new Set() }));
            }}
          >
            <img src="/images/logo.png" alt="Início" />
            {notifications.dm.size > 0 && <NotificationBadge />}
          </ServerIcon>
          <Divider />

          {dashboardData.groups.map((group) => (
            <ServerIcon
              key={group.id_grupo}
              title={group.Nome}
              className={
                activeChat?.type === "group" &&
                activeChat.group.details.id_grupo === group.id_grupo
                  ? "active"
                  : ""
              }
              onClick={() => handleSelectGroup(group)}
            >
              <img
                src={group.Foto || "/images/default-group-icon.png"}
                alt={group.Nome}
              />
              {notifications.groups.has(group.id_grupo) && (
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
              <img src={user.FotoPerfil || "/images/logo.png"} alt="Perfil" />
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
          $isChannelListOpen={isChannelListOpen}
        />

        <ChatArea
          chatInfo={activeChat}
          onViewProfile={setViewingProfileId}
          replyingTo={replyingTo}
          onReply={setReplyingTo}
          onCancelReply={() => setReplyingTo(null)}
          onDeleteMessage={handleDeleteMessage}
          onMenuClick={() => setIsChannelListOpen((prev) => !prev)}
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
        onlineUserIds={dashboardData.onlineUserIds || []}
        onClose={() => setViewingProfileId(null)}
        onAction={handleFriendAction}
        onSendMessage={handleSendMessage}
        activeGroup={activeChat?.type === "group" ? activeChat.group : null}
      />
    </>
  );
};

export default Dashboard;

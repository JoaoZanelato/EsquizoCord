// src/pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
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
} from "./styles";

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeChat, setActiveChat] = useState(null);

  // --- INÍCIO DAS NOVAS ADIÇÕES ---
  const [replyingTo, setReplyingTo] = useState(null); // Estado para controlar a resposta
  // --- FIM DAS NOVAS ADIÇÕES ---

  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isExploreModalOpen, setIsExploreModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [viewingProfileId, setViewingProfileId] = useState(null);

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
    } catch (err) {
      console.error("Erro ao carregar detalhes do grupo:", err);
      alert("Não foi possível carregar os detalhes deste servidor.");
    }
  };

  // --- INÍCIO DAS NOVAS FUNÇÕES ---
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
        // A atualização visual será feita via WebSocket
      }
    } catch (error) {
      alert(
        error.response?.data?.message || "Não foi possível apagar a mensagem."
      );
    }
  };
  // --- FIM DAS NOVAS FUNÇÕES ---

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

  const handleSendMessage = (userToMessage) => {
    setActiveChat({ type: "dm", user: userToMessage });
    setViewingProfileId(null);
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
        <ServerList>
          <ServerIcon
            title="Início"
            className={!activeChat || activeChat.type === "dm" ? "active" : ""}
            onClick={() => {
              setActiveChat(null);
              setReplyingTo(null); // Limpa a resposta ao mudar de chat
            }}
          >
            <img src="/images/logo.png" alt="Início" />
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
              onClick={() => {
                handleSelectGroup(group);
                setReplyingTo(null); // Limpa a resposta ao mudar de chat
              }}
            >
              <img
                src={group.Foto || "/images/default-group-icon.png"}
                alt={group.Nome}
              />
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
          onSelectChat={(chat) => {
            setActiveChat(chat);
            setReplyingTo(null); // Limpa a resposta ao mudar de chat
          }}
          onUpdate={fetchData}
          activeChat={activeChat}
          onOpenGroupSettings={() => setIsEditGroupModalOpen(true)}
          onViewProfile={setViewingProfileId}
          onFriendAction={handleFriendAction}
        />

        <ChatArea
          chatInfo={activeChat}
          onViewProfile={setViewingProfileId}
          // --- INÍCIO DAS NOVAS PROPS ---
          replyingTo={replyingTo}
          onReply={setReplyingTo}
          onCancelReply={() => setReplyingTo(null)}
          onDeleteMessage={handleDeleteMessage}
          // --- FIM DAS NOVAS PROPS ---
        />
      </DashboardLayout>

      {/* ... Modais ... */}
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
      />

      <UserProfileModal
        userId={viewingProfileId}
        onlineUserIds={dashboardData.onlineUserIds || []}
        onClose={() => setViewingProfileId(null)}
        onAction={handleFriendAction}
        onSendMessage={handleSendMessage}
      />
    </>
  );
};

export default Dashboard;

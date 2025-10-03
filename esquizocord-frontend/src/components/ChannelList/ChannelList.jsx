// src/components/ChannelList/ChannelList.jsx
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import styled from "styled-components";

import FriendsList from "../FriendsList/FriendsList";
import PendingRequests from "../PendingRequests/PendingRequests";
import AddFriend from "../AddFriend/AddFriend";
import ManageMemberRolesModal from "../ManageMemberRolesModal/ManageMemberRolesModal";
import CreateChannelModal from "../CreateChannelModal/CreateChannelModal";
import StatusModal from "../StatusModal/StatusModal"; // <-- 1. IMPORTAR O MODAL

import {
  ChannelListContainer,
  ChannelHeader,
  FriendsNav,
  FriendsNavButton,
  Content,
  UserPanel,
  ChannelItem,
  MemberList,
  MemberItem,
  ListHeader,
  ManageMemberButton,
  DeleteChannelButton,
  KickMemberButton,
  AvatarWithStatus, // <-- 2. IMPORTAR NOVOS ESTILOS
  UserStatusIndicator, // <-- 2. IMPORTAR NOVOS ESTILOS
} from "./styles";

const PERMISSIONS = {
  GERIR_CARGOS: 1,
  EXPULSAR_MEMBROS: 2,
  CRIAR_CANAIS: 8,
};

// --- INÍCIO DA ALTERAÇÃO ---
const STATUS_COLORS = {
  online: "#43b581",
  ausente: "#faa61a",
  ocupado: "#f04747",
  invisivel: "#747f8d",
};
// --- FIM DA ALTERAÇÃO ---

const ListHeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-right: 8px;
`;

const AddChannelButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.textMuted};
  cursor: pointer;
  font-size: 16px;
  &:hover {
    color: ${({ theme }) => theme.headerPrimary};
  }
`;

const ChannelList = ({
  data,
  onSelectChat,
  onUpdate,
  activeChat,
  onOpenGroupSettings,
  onViewProfile,
  onFriendAction,
  onBanMember,
  $isChannelListOpen,
  onChannelCreated,
  onChannelDeleted,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("friends");
  const [managingMember, setManagingMember] = useState(null);
  const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] =
    useState(false);
  // --- INÍCIO DA ALTERAÇÃO ---
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false); // 3. Adicionar estado para o modal de status
  // --- FIM DA ALTERAÇÃO ---

  const isGroupView = activeChat?.type === "group";
  const groupDetails = isGroupView ? activeChat.group : null;
  const onlineUserIds = data.onlineUserIds || [];
  const AI_USER_ID = 1;

  const renderFriendsContent = () => {
    switch (activeTab) {
      case "pending":
        return (
          <PendingRequests
            pending={data.pendingRequests}
            sent={data.sentRequests}
            onAction={onFriendAction}
          />
        );
      case "add":
        return <AddFriend onUpdate={onUpdate} />;
      case "friends":
      default:
        return (
          <FriendsList
            friends={data.friends}
            onlineUserIds={data.onlineUserIds}
            onSelectChat={onSelectChat}
            onAction={onFriendAction}
            onViewProfile={onViewProfile}
          />
        );
    }
  };

  const renderGroupContent = () => {
    if (!groupDetails) return null;

    const canManageRoles =
      (groupDetails.currentUserPermissions & PERMISSIONS.GERIR_CARGOS) > 0;
    const canCreateChannels =
      (groupDetails.currentUserPermissions & PERMISSIONS.CRIAR_CANAIS) > 0;
    const canBanMembers =
      (groupDetails.currentUserPermissions & PERMISSIONS.EXPULSAR_MEMBROS) > 0;

    const textChannels =
      groupDetails.channels?.filter((c) => c.tipo === "TEXTO") || [];
    const voiceChannels =
      groupDetails.channels?.filter((c) => c.tipo === "VOZ") || [];

    return (
      <>
        <ListHeaderContainer>
          <ListHeader>Canais de Texto</ListHeader>
          {canCreateChannels && (
            <AddChannelButton
              title="Criar Canal"
              onClick={() => setIsCreateChannelModalOpen(true)}
            >
              <i className="fas fa-plus"></i>
            </AddChannelButton>
          )}
        </ListHeaderContainer>

        {textChannels.map((channel) => (
          <ChannelItem
            key={channel.id_chat}
            $active={activeChat.channelId === channel.id_chat}
            onClick={() =>
              onSelectChat({
                ...activeChat,
                channelId: channel.id_chat,
                channelName: channel.nome,
                channelType: channel.tipo,
              })
            }
          >
            <i className="fas fa-hashtag" style={{ width: "12px" }}></i>
            {channel.nome}
            {canCreateChannels && channel.nome !== "geral" && (
              <DeleteChannelButton
                title="Excluir Canal"
                onClick={(e) => {
                  e.stopPropagation();
                  onChannelDeleted(channel.id_chat);
                }}
              >
                <i className="fas fa-trash"></i>
              </DeleteChannelButton>
            )}
          </ChannelItem>
        ))}

        <ListHeaderContainer style={{ marginTop: "20px" }}>
          <ListHeader>Canais de Voz</ListHeader>
        </ListHeaderContainer>
        {voiceChannels.map((channel) => (
          <ChannelItem
            key={channel.id_chat}
            $active={activeChat.channelId === channel.id_chat}
            onClick={() =>
              onSelectChat({
                ...activeChat,
                channelId: channel.id_chat,
                channelName: channel.nome,
                channelType: channel.tipo,
              })
            }
          >
            <i className="fas fa-volume-up" style={{ width: "12px" }}></i>
            {channel.nome}
            {canCreateChannels && (
              <DeleteChannelButton
                title="Excluir Canal"
                onClick={(e) => {
                  e.stopPropagation();
                  onChannelDeleted(channel.id_chat);
                }}
              >
                <i className="fas fa-trash"></i>
              </DeleteChannelButton>
            )}
          </ChannelItem>
        ))}

        <ListHeader style={{ marginTop: "20px" }}>
          Membros — {groupDetails.members?.length}
        </ListHeader>
        <MemberList>
          {groupDetails.members?.map((member) => {
            const isAI = member.id_usuario === AI_USER_ID;
            const isOnline = isAI || onlineUserIds.includes(member.id_usuario);
            const memberRole =
              member.cargos?.length > 0 ? member.cargos[0] : null;
            const isOwner =
              member.id_usuario === groupDetails.details.id_criador;

            return (
              <MemberItem key={member.id_usuario}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flexGrow: 1,
                    cursor: "pointer",
                    minWidth: 0,
                  }}
                  onClick={() => onViewProfile(member.id_usuario)}
                >
                  <img
                    src={member.foto_perfil || "/images/logo.png"}
                    alt={member.nome}
                    style={{ flexShrink: 0 }}
                  />
                  <span
                    style={{
                      color: memberRole?.cor,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {member.nome}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexShrink: 0,
                    marginLeft: "auto",
                  }}
                >
                  {memberRole && !isAI && (
                    <i
                      className="fas fa-shield-alt"
                      title={memberRole.nome_cargo}
                      style={{ color: memberRole.cor }}
                    ></i>
                  )}
                  {isAI && (
                    <i
                      className="fas fa-robot"
                      title="Inteligência Artificial"
                      style={{ color: "#8e9297" }}
                    ></i>
                  )}
                  {!isAI && !memberRole && isOnline && (
                    <div className="online-indicator" title="Online"></div>
                  )}
                  {canManageRoles && !isAI && !isOwner && (
                    <ManageMemberButton
                      onClick={() => setManagingMember(member)}
                      title="Gerir cargos"
                    >
                      <i className="fas fa-user-cog"></i>
                    </ManageMemberButton>
                  )}
                  {canBanMembers && !isAI && !isOwner && (
                    <KickMemberButton
                      onClick={() => onBanMember(member)}
                      title="Banir Membro"
                    >
                      <i className="fas fa-gavel"></i>
                    </KickMemberButton>
                  )}
                </div>
              </MemberItem>
            );
          })}
        </MemberList>
      </>
    );
  };

  return (
    <>
      <ChannelListContainer $isOpen={$isChannelListOpen}>
        <ChannelHeader>
          <span>{isGroupView ? groupDetails?.details?.nome : "Amigos"}</span>
          {isGroupView &&
            (groupDetails.currentUserPermissions & PERMISSIONS.GERIR_CARGOS) >
              0 && (
              <i
                className="fas fa-cog"
                title="Configurações do Grupo"
                style={{ cursor: "pointer" }}
                onClick={onOpenGroupSettings}
              ></i>
            )}
        </ChannelHeader>

        {!isGroupView && (
          <FriendsNav>
            <FriendsNavButton
              $active={activeTab === "friends"}
              onClick={() => setActiveTab("friends")}
            >
              Amigos
            </FriendsNavButton>
            <FriendsNavButton
              $active={activeTab === "pending"}
              onClick={() => setActiveTab("pending")}
            >
              Pendentes
            </FriendsNavButton>
            <FriendsNavButton
              $active={activeTab === "add"}
              onClick={() => setActiveTab("add")}
            >
              Adicionar
            </FriendsNavButton>
          </FriendsNav>
        )}

        <Content>
          {isGroupView ? renderGroupContent() : renderFriendsContent()}
        </Content>

        {/* --- INÍCIO DA ALTERAÇÃO --- */}
        <UserPanel onClick={() => setIsStatusModalOpen(true)}>
          <AvatarWithStatus>
            <img src={user.foto_perfil || "/images/logo.png"} alt={user.nome} />
            <UserStatusIndicator
              color={STATUS_COLORS[user.status || "online"]}
            />
          </AvatarWithStatus>
          <div className="user-info">
            <span className="username">{user.nome}</span>
            <span className="user-status">
              {user.status_personalizado || user.status}
            </span>
          </div>
        </UserPanel>
      </ChannelListContainer>

      <ManageMemberRolesModal
        isOpen={!!managingMember}
        onClose={() => setManagingMember(null)}
        member={managingMember}
        groupDetails={groupDetails?.details}
        onRolesUpdated={onUpdate}
      />

      <CreateChannelModal
        isOpen={isCreateChannelModalOpen}
        onClose={() => setIsCreateChannelModalOpen(false)}
        groupDetails={groupDetails?.details}
        onChannelCreated={onChannelCreated}
      />

      <StatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
      />
      {/* --- FIM DA ALTERAÇÃO --- */}
    </>
  );
};

export default ChannelList;

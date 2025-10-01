// src/components/ChannelList/ChannelList.jsx
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import styled from "styled-components";

import FriendsList from "../FriendsList/FriendsList";
import PendingRequests from "../PendingRequests/PendingRequests";
import AddFriend from "../AddFriend/AddFriend";
import ManageMemberRolesModal from "../ManageMemberRolesModal/ManageMemberRolesModal";

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
} from "./styles";

const PERMISSIONS = {
  GERIR_CARGOS: 1,
};

const ChannelList = ({
  data,
  onSelectChat,
  onUpdate,
  activeChat,
  onOpenGroupSettings,
  onViewProfile,
  onFriendAction,
  $isChannelListOpen,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("friends");
  const [managingMember, setManagingMember] = useState(null);

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

    return (
      <>
        <ListHeader>Canais de Texto</ListHeader>
        {groupDetails.channels?.map((channel) => (
          <ChannelItem
            key={channel.id_chat}
            $active={activeChat.channelId === channel.id_chat}
            onClick={() =>
              onSelectChat({
                ...activeChat,
                channelId: channel.id_chat,
                channelName: channel.Nome,
              })
            }
          >
            <i className="fas fa-hashtag" style={{ width: "12px" }}></i>
            {channel.Nome}
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
                  }}
                  onClick={() => onViewProfile(member.id_usuario)}
                >
                  <img
                    src={member.FotoPerfil || "/images/logo.png"}
                    alt={member.Nome}
                  />
                  <span style={{ color: memberRole?.cor }}>{member.Nome}</span>
                </div>

                {isAI && (
                  <i
                    className="fas fa-robot"
                    title="Inteligência Artificial"
                    style={{ color: "#8e9297" }}
                  ></i>
                )}

                {memberRole && !isAI && (
                  <i
                    className="fas fa-shield-alt"
                    title={memberRole.nome_cargo}
                    style={{ color: memberRole.cor }}
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
          <span>{isGroupView ? groupDetails?.details?.Nome : "Amigos"}</span>
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

        <UserPanel>
          <img src={user.FotoPerfil || "/images/logo.png"} alt={user.Nome} />
          <div>
            <span className="username">{user.Nome}</span>
            <span className="user-tag">#{user.id_usuario}</span>
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
    </>
  );
};

export default ChannelList;

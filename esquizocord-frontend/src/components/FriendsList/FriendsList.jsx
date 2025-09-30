// src/components/FriendsList/FriendsList.jsx
import React from "react";
import {
  FriendsListContainer,
  ListHeader,
  FriendItem,
  FriendInfo,
  AvatarContainer,
  StatusIndicator,
  NameTag,
  FriendActions,
} from "./styles";

const FriendsList = ({
  friends,
  onlineUserIds,
  onSelectChat,
  onAction,
  onViewProfile,
}) => {
  const AI_USER_ID = 1;

  return (
    <FriendsListContainer>
      <ListHeader>Amigos - {friends.length}</ListHeader>
      {friends.map((friend) => {
        const isAI = friend.id_usuario === AI_USER_ID;
        const isOnline = isAI || onlineUserIds.includes(friend.id_usuario);

        return (
          <FriendItem key={friend.id_usuario}>
            <FriendInfo
              onClick={() => onSelectChat({ type: "dm", user: friend })}
            >
              <AvatarContainer>
                <img
                  src={friend.FotoPerfil || "/images/logo.png"}
                  alt={friend.Nome}
                />
                <StatusIndicator $isOnline={isOnline} />
              </AvatarContainer>
              <NameTag>
                {friend.Nome}
                {!isAI && (
                  <span className="user-tag">#{friend.id_usuario}</span>
                )}
                {isAI && (
                  <i
                    className="fas fa-robot"
                    title="Inteligência Artificial"
                    style={{ fontSize: "12px", marginLeft: "8px" }}
                  ></i>
                )}
              </NameTag>
            </FriendInfo>

            <FriendActions onClick={(e) => e.stopPropagation()}>
              <button
                title="Ver Perfil"
                onClick={() => onViewProfile(friend.id_usuario)}
              >
                <i className="fas fa-eye"></i>
              </button>
              {!isAI && (
                <button
                  title="Remover Amigo"
                  className="remove"
                  onClick={() => onAction("remove", friend.id_usuario)}
                >
                  <i className="fas fa-user-minus"></i>
                </button>
              )}
            </FriendActions>
          </FriendItem>
        );
      })}
    </FriendsListContainer>
  );
};

export default FriendsList; // <-- A LINHA QUE FALTAVA FOI ADICIONADA AQUI

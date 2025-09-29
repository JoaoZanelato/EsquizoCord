// src/components/ChannelList/ChannelList.jsx
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import FriendsList from "../FriendsList/FriendsList";
import PendingRequests from "../PendingRequests/PendingRequests";
import AddFriend from "../AddFriend/AddFriend";
import {
  ChannelListContainer,
  ChannelHeader,
  FriendsNav,
  FriendsNavButton,
  Content,
  UserPanel,
} from "./styles";

const ChannelList = ({ data, onSelectChat }) => {
  const { user } = useAuth();
  // 'friends' será o estado por defeito
  const [activeTab, setActiveTab] = useState("friends");

  const renderContent = () => {
    switch (activeTab) {
      case "pending":
        return (
          <PendingRequests
            pending={data.pendingRequests}
            sent={data.sentRequests}
          />
        );
      case "add":
        return <AddFriend />;
      case "friends":
      default:
        return (
          <FriendsList
            friends={data.friends}
            onlineUserIds={data.onlineUserIds}
            onSelectChat={onSelectChat}
          />
        );
    }
  };

  return (
    <ChannelListContainer>
      <ChannelHeader>
        <span>Amigos</span>
      </ChannelHeader>

      <FriendsNav>
        <FriendsNavButton
          active={activeTab === "friends"}
          onClick={() => setActiveTab("friends")}
        >
          Amigos
        </FriendsNavButton>
        <FriendsNavButton
          active={activeTab === "pending"}
          onClick={() => setActiveTab("pending")}
        >
          Pendentes
        </FriendsNavButton>
        <FriendsNavButton
          active={activeTab === "add"}
          onClick={() => setActiveTab("add")}
        >
          Adicionar
        </FriendsNavButton>
      </FriendsNav>

      <Content>{renderContent()}</Content>

      <UserPanel>
        <img src={user.FotoPerfil || "/images/logo.png"} alt={user.Nome} />
        <div>
          <span className="username">{user.Nome}</span>
          <span className="user-tag">#{user.id_usuario}</span>
        </div>
      </UserPanel>
    </ChannelListContainer>
  );
};

export default ChannelList;

// src/components/ChannelList/ChannelList.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

import FriendsList from '../FriendsList/FriendsList';
import PendingRequests from '../PendingRequests/PendingRequests';
import AddFriend from '../AddFriend/AddFriend';

import {
    ChannelListContainer, ChannelHeader, FriendsNav, FriendsNavButton, Content, UserPanel,
    ChannelItem, MemberList, MemberItem, ListHeader
} from './styles';

const ChannelList = ({ data, onSelectChat, onUpdate, activeChat, onOpenGroupSettings, onViewProfile, onFriendAction }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('friends');
    
    const isGroupView = activeChat?.type === 'group';
    const groupDetails = isGroupView ? activeChat.group : null;
    const onlineUserIds = data.onlineUserIds || [];
    const AI_USER_ID = 1;

    const renderFriendsContent = () => {
        switch (activeTab) {
            case 'pending':
                return <PendingRequests 
                            pending={data.pendingRequests} 
                            sent={data.sentRequests} 
                            onAction={onFriendAction} 
                        />;
            case 'add':
                return <AddFriend onUpdate={onUpdate} />;
            case 'friends':
            default:
                return <FriendsList 
                            friends={data.friends} 
                            onlineUserIds={data.onlineUserIds} 
                            onSelectChat={onSelectChat} 
                            onAction={onFriendAction}
                            onViewProfile={onViewProfile}
                        />;
        }
    };
    
    const renderGroupContent = () => {
        if (!groupDetails) return null;
        
        return (
            <>
                <ListHeader>Canais de Texto</ListHeader>
                {groupDetails.channels?.map(channel => (
                    <ChannelItem 
                        key={channel.id_chat}
                        $active={activeChat.channelId === channel.id_chat}
                        onClick={() => onSelectChat({ ...activeChat, channelId: channel.id_chat, channelName: channel.Nome })}
                    >
                        <i className="fas fa-hashtag" style={{width: '12px'}}></i>
                        {channel.Nome}
                    </ChannelItem>
                ))}
                
                <ListHeader style={{ marginTop: '20px' }}>Membros — {groupDetails.members?.length}</ListHeader>
                <MemberList>
                    {groupDetails.members?.map(member => {
                        const isAI = member.id_usuario === AI_USER_ID;
                        const isOnline = isAI || onlineUserIds.includes(member.id_usuario);
                        return (
                            <MemberItem key={member.id_usuario} onClick={() => onViewProfile(member.id_usuario)}>
                                <img src={member.FotoPerfil || '/images/logo.png'} alt={member.Nome} />
                                <span>{member.Nome}</span>
                                {isAI && <i className="fas fa-robot" title="Inteligência Artificial" style={{marginLeft: 'auto', color: '#8e9297'}}></i>}
                                {member.isAdmin && !isAI && <i className="fas fa-crown" title="Administrador"></i>}
                                {!isAI && !member.isAdmin && isOnline && <div className="online-indicator" title="Online"></div>}
                            </MemberItem>
                        );
                    })}
                </MemberList>
            </>
        );
    }

    return (
        <ChannelListContainer>
            <ChannelHeader>
                <span>{isGroupView ? groupDetails?.details?.Nome : 'Amigos'}</span>
                {isGroupView && user.id_usuario === groupDetails?.details?.id_criador && (
                    <i className="fas fa-cog" title="Configurações do Grupo" style={{cursor: 'pointer'}} onClick={onOpenGroupSettings}></i>
                )}
            </ChannelHeader>

            {!isGroupView && (
                 <FriendsNav>
                    <FriendsNavButton $active={activeTab === 'friends'} onClick={() => setActiveTab('friends')}>Amigos</FriendsNavButton>
                    <FriendsNavButton $active={activeTab === 'pending'} onClick={() => setActiveTab('pending')}>Pendentes</FriendsNavButton>
                    <FriendsNavButton $active={activeTab === 'add'} onClick={() => setActiveTab('add')}>Adicionar</FriendsNavButton>
                </FriendsNav>
            )}
            
            <Content>
                {isGroupView ? renderGroupContent() : renderFriendsContent()}
            </Content>

            <UserPanel>
                <img src={user.FotoPerfil || '/images/logo.png'} alt={user.Nome} />
                <div>
                    <span className="username">{user.Nome}</span>
                    <span className="user-tag">#{user.id_usuario}</span>
                </div>
            </UserPanel>
        </ChannelListContainer>
    );
};

export default ChannelList;
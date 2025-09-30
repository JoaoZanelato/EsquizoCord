// src/pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import apiClient from '../../services/api';

import ChannelList from '../../components/ChannelList/ChannelList';
import ChatArea from '../../components/ChatArea/ChatArea';
import CreateGroupModal from '../../components/CreateGroupModal/CreateGroupModal';
import ExploreGroupsModal from '../../components/ExploreGroupsModal/ExploreGroupsModal';
import EditGroupModal from '../../components/EditGroupModal/EditGroupModal';
import UserProfileModal from '../../components/UserProfileModal/UserProfileModal';

import {
  DashboardLayout, ServerList, ServerIcon, Divider, LoadingContainer
} from './styles';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeChat, setActiveChat] = useState(null);
  
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isExploreModalOpen, setIsExploreModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [viewingProfileId, setViewingProfileId] = useState(null);

  const fetchData = useCallback(async (selectChatAfter = null) => {
    try {
      const response = await apiClient.get('/dashboard');
      setDashboardData(response.data);
      if (selectChatAfter) {
          setActiveChat(selectChatAfter);
      }
    } catch (err) {
      setError('Não foi possível carregar os seus dados. Tente atualizar a página.');
    } finally {
      if (loading) setLoading(false);
    }
  }, [loading]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSelectGroup = async (group) => {
      try {
          const response = await apiClient.get(`/groups/${group.id_grupo}/details`);
          const groupDetails = response.data;
          const defaultChannel = groupDetails.channels[0];
          
          setActiveChat({
              type: 'group',
              group: groupDetails,
              channelId: defaultChannel?.id_chat,
              channelName: defaultChannel?.Nome
          });
      } catch (err) {
          console.error("Erro ao carregar detalhes do grupo:", err);
          alert("Não foi possível carregar os detalhes deste servidor.");
      }
  };

  const handleFriendAction = async (action, id) => {
    let url = '', body = {}, method = 'post';
    switch (action) {
        case 'add':
            url = '/friends/request';
            body = { requestedId: id };
            break;
        case 'remove':
            if (!window.confirm("Tem a certeza que deseja remover este amigo?")) return;
            url = `/friends/${id}`;
            method = 'delete';
            break;
        case 'accept':
            url = '/friends/respond';
            body = { requestId: id, action: 'aceite' };
            break;
        case 'reject':
             url = '/friends/respond';
             body = { requestId: id, action: 'recusada' };
             break;
        case 'cancel':
             url = '/friends/cancel';
             body = { requestId: id };
             break;
        default:
            return;
    }
    try {
        await apiClient[method](url, body);
        fetchData(); 
        if(viewingProfileId) {
            setViewingProfileId(null); // Fecha o modal de perfil
            setViewingProfileId(id); // e reabre para atualizar os dados
        }
    } catch (error) {
        alert(error.response?.data?.message || `Erro ao executar a ação: ${action}`);
    }
  };

  const handleSendMessage = (userToMessage) => {
    setActiveChat({ type: 'dm', user: userToMessage });
    setViewingProfileId(null);
  };

  if (loading) { return <LoadingContainer>A carregar o seu universo...</LoadingContainer>; }
  if (error) { return <div style={{color: 'red'}}>{error}</div>; }
  if (!dashboardData) { return <div>Não foi possível carregar os dados.</div>; }

  return (
    <>
      <DashboardLayout>
        <ServerList>
          <ServerIcon title="Início" className={!activeChat || activeChat.type === 'dm' ? 'active' : ''} onClick={() => setActiveChat(null)}>
            <img src="/images/logo.png" alt="Início" />
          </ServerIcon>
          <Divider />

          {dashboardData.groups.map(group => (
            <ServerIcon key={group.id_grupo} title={group.Nome} className={activeChat?.type === 'group' && activeChat.group.details.id_grupo === group.id_grupo ? 'active' : ''} onClick={() => handleSelectGroup(group)}>
              <img src={group.Foto || '/images/default-group-icon.png'} alt={group.Nome} />
            </ServerIcon>
          ))}
          
          <ServerIcon title="Adicionar um servidor" onClick={() => setIsCreateGroupModalOpen(true)}>
              <i className="fas fa-plus" style={{color: 'var(--green-accent)'}}></i>
          </ServerIcon>
          <ServerIcon title="Explorar Servidores" onClick={() => setIsExploreModalOpen(true)}>
              <i className="fas fa-compass" style={{color: 'var(--green-accent)'}}></i>
          </ServerIcon>
          
          <div style={{ marginTop: 'auto' }}>
              <ServerIcon as={Link} to="/settings" title="Configurações">
                  <img src={user.FotoPerfil || '/images/logo.png'} alt="Perfil" />
              </ServerIcon>
          </div>
        </ServerList>

        <ChannelList 
          data={dashboardData} 
          onSelectChat={setActiveChat}
          onUpdate={fetchData}
          activeChat={activeChat}
          onOpenGroupSettings={() => setIsEditGroupModalOpen(true)}
          onViewProfile={setViewingProfileId}
          onFriendAction={handleFriendAction}
        />

        <ChatArea 
            chatInfo={activeChat}
            onViewProfile={setViewingProfileId}
        />
      </DashboardLayout>

      <CreateGroupModal isOpen={isCreateGroupModalOpen} onClose={() => setIsCreateGroupModalOpen(false)} onGroupCreated={fetchData} />
      <ExploreGroupsModal isOpen={isExploreModalOpen} onClose={() => setIsExploreModalOpen(false)} onGroupJoined={fetchData} />
      
      <EditGroupModal 
        isOpen={isEditGroupModalOpen}
        onClose={() => setIsEditGroupModalOpen(false)}
        groupDetails={activeChat?.type === 'group' ? activeChat.group.details : null}
        onGroupUpdated={() => {
            fetchData();
            if (activeChat?.type === 'group') {
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
        onClose={() => setViewingProfileId(null)}
        onAction={handleFriendAction}
        onSendMessage={handleSendMessage}
      />
    </>
  );
};

export default Dashboard;
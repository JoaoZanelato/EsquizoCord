// src/pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import apiClient from '../../services/api';

// Componentes
import ChannelList from '../../components/ChannelList/ChannelList';
import ChatArea from '../../components/ChatArea/ChatArea';
import CreateGroupModal from '../../components/CreateGroupModal/CreateGroupModal'; // <-- Importe o novo modal

// Estilos
import {
  DashboardLayout, ServerList, ServerIcon, Divider, LoadingContainer
} from './styles';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeChat, setActiveChat] = useState(null);

  // --- INÍCIO DA ADIÇÃO ---
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  // --- FIM DA ADIÇÃO ---

  const fetchData = useCallback(async () => {
    try {
      const response = await apiClient.get('/dashboard');
      setDashboardData(response.data);
    } catch (err) {
      setError('Não foi possível carregar os seus dados. Tente atualizar a página.');
      console.error(err);
    } finally {
      if (loading) setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectChat = (chatInfo) => {
    setActiveChat(chatInfo);
  };

  if (loading) {
    return <LoadingContainer>A carregar o seu universo...</LoadingContainer>;
  }
  if (error) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'red' }}>{error}</div>;
  }
  if (!dashboardData) {
    return <div>Não foi possível carregar os dados.</div>;
  }

  return (
    <>
      <DashboardLayout>
        <ServerList>
          {/* Ícone de Início/Amigos */}
          <ServerIcon
            title="Início"
            className={!activeChat || activeChat.type === 'dm' ? 'active' : ''}
            onClick={() => handleSelectChat(null)}
          >
            <img src="/images/logo.png" alt="Início" />
          </ServerIcon>
          
          <Divider />

          {/* Ícones dos servidores (grupos) */}
          {dashboardData.groups.map(group => (
            <ServerIcon
              key={group.id_grupo}
              title={group.Nome}
              className={activeChat?.type === 'group' && activeChat.group.id_grupo === group.id_grupo ? 'active' : ''}
              onClick={() => handleSelectChat({ type: 'group', group })}
            >
              <img
                src={group.Foto || '/images/default-group-icon.png'}
                alt={group.Nome}
              />
            </ServerIcon>
          ))}
          
          {/* --- INÍCIO DA ALTERAÇÃO --- */}
          {/* Botão para abrir o modal de criação */}
          <ServerIcon title="Adicionar um servidor" onClick={() => setIsCreateGroupModalOpen(true)}>
              <i className="fas fa-plus" style={{color: 'var(--green-accent)'}}></i>
          </ServerIcon>
          {/* --- FIM DA ALTERAÇÃO --- */}

          <ServerIcon title="Explorar Servidores">
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
          onSelectChat={handleSelectChat}
          onUpdate={fetchData}
          isGroupView={activeChat?.type === 'group'}
          groupDetails={activeChat?.type === 'group' ? activeChat.group : null}
        />

        <ChatArea chatInfo={activeChat} />
      </DashboardLayout>

      {/* --- INÍCIO DA ADIÇÃO --- */}
      {/* Renderiza o modal de criação de grupo */}
      <CreateGroupModal 
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onGroupCreated={fetchData}
      />
      {/* --- FIM DA ADIÇÃO --- */}
    </>
  );
};

export default Dashboard;
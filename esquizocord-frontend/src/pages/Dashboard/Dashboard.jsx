// src/pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api';

// Importação dos componentes principais do layout
import ChannelList from '../../components/ChannelList/ChannelList';
import ChatArea from '../../components/ChatArea/ChatArea';

// Importação dos componentes de estilo
import {
  DashboardLayout,
  ServerList,
  ServerIcon,
  Divider
} from './styles';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estado para controlar qual chat (DM ou grupo) está ativo
  const [activeChat, setActiveChat] = useState(null);

  useEffect(() => {
    // Função para buscar os dados iniciais do dashboard
    const fetchData = async () => {
      try {
        const response = await apiClient.get('/dashboard');
        setDashboardData(response.data);
      } catch (err) {
        setError('Não foi possível carregar os seus dados. Tente atualizar a página.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // O array vazio [] garante que esta função só é executada uma vez

  // Função para ser chamada quando um amigo ou grupo é selecionado
  const handleSelectChat = (chatInfo) => {
    // Se o chatInfo for um grupo, precisamos de mais detalhes (canais, etc.)
    if (chatInfo && chatInfo.type === 'group') {
      // Lógica para buscar detalhes do grupo e definir o primeiro canal como ativo (será implementada a seguir)
      console.log("Grupo selecionado (lógica futura):", chatInfo.group.id_grupo);
      setActiveChat(chatInfo); // Por agora, apenas define o grupo como ativo
    } else {
      // Para DMs ou para limpar a seleção (quando chatInfo é null)
      setActiveChat(chatInfo);
    }
  };

  // Renderiza um estado de carregamento enquanto os dados não chegam
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>A carregar o seu universo...</div>;
  }

  // Renderiza uma mensagem de erro se a busca de dados falhar
  if (error) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'red' }}>{error}</div>;
  }

  return (
    <DashboardLayout>
      <ServerList>
        {/* Ícone de Início/Amigos */}
        <ServerIcon
          title="Início"
          className={!activeChat || activeChat.type === 'dm' ? 'active' : ''}
          onClick={() => handleSelectChat(null)} // Clicar em início limpa a seleção de grupo
        >
          <img src="/images/logo.png" alt="Início" />
        </ServerIcon>
        
        <Divider />

        {/* Mapeia e renderiza os ícones dos servidores (grupos) */}
        {dashboardData.groups.map(group => (
          <ServerIcon
            key={group.id_grupo}
            title={group.Nome}
            className={activeChat?.group?.id_grupo === group.id_grupo ? 'active' : ''}
            onClick={() => handleSelectChat({ type: 'group', group })}
          >
            <img
              src={group.Foto || '/images/default-group-icon.png'}
              alt={group.Nome}
            />
          </ServerIcon>
        ))}
        
        {/* Ícones de Ação - A lógica será adicionada posteriormente */}
        <ServerIcon title="Adicionar um servidor">
            <i className="fas fa-plus" style={{color: 'var(--green-accent)'}}></i>
        </ServerIcon>
        <ServerIcon title="Explorar Servidores">
            <i className="fas fa-compass" style={{color: 'var(--green-accent)'}}></i>
        </ServerIcon>
        
        {/* Ícone do Perfil do Utilizador no final da lista */}
        <div style={{ marginTop: 'auto' }}>
            <ServerIcon title="Configurações">
                <img src={user.FotoPerfil || '/images/logo.png'} alt="Perfil" />
            </ServerIcon>
        </div>
      </ServerList>

      {/* A coluna do meio (canais/amigos) agora recebe os dados e a função para selecionar um chat */}
      <ChannelList 
        data={dashboardData} 
        onSelectChat={handleSelectChat}
        isGroupView={activeChat?.type === 'group'}
        groupDetails={activeChat?.type === 'group' ? activeChat.group : null} // Passa detalhes do grupo se estiver ativo
      />

      {/* A área de chat principal, que renderiza a conversa ativa */}
      <ChatArea 
        chatInfo={activeChat} 
      />

    </DashboardLayout>
  );
};

export default Dashboard;
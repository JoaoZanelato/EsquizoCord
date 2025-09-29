// src/pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
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

  // Envolvemos a fetchData com useCallback para que a sua referência seja estável
  // e não cause re-renderizações desnecessárias nos componentes filhos.
  const fetchData = useCallback(async () => {
    // Não é preciso definir o loading aqui para evitar o piscar da tela ao atualizar
    try {
      const response = await apiClient.get('/dashboard');
      setDashboardData(response.data);
    } catch (err) {
      setError('Não foi possível carregar os seus dados. Tente atualizar a página.');
      console.error(err);
    } finally {
      // O loading principal só deve ser definido como falso na primeira vez
      if (loading) setLoading(false);
    }
  }, [loading]); // A dependência 'loading' garante que o setLoading(false) é chamado corretamente

  // Efeito para buscar os dados iniciais quando o componente é montado
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Função para ser chamada quando um amigo ou grupo é selecionado
  const handleSelectChat = (chatInfo) => {
    setActiveChat(chatInfo);
  };

  // Renderiza um estado de carregamento inicial
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#202225' }}>A carregar o seu universo...</div>;
  }

  // Renderiza uma mensagem de erro se a busca inicial falhar
  if (error) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'red' }}>{error}</div>;
  }

  // Se os dados ainda não chegaram por algum motivo (pouco provável após o loading), mostra uma mensagem
  if (!dashboardData) {
    return <div>Não foi possível carregar os dados.</div>;
  }

  return (
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

        {/* Mapeia e renderiza os ícones dos servidores (grupos) */}
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

      {/* A coluna do meio (canais/amigos) */}
      <ChannelList 
        data={dashboardData} 
        onSelectChat={handleSelectChat}
        onUpdate={fetchData} // Passa a função para que os filhos possam acionar uma atualização
        isGroupView={activeChat?.type === 'group'}
        groupDetails={activeChat?.type === 'group' ? activeChat.group : null}
      />

      {/* A área de chat principal, que renderiza a conversa ativa */}
      <ChatArea 
        chatInfo={activeChat} 
      />

    </DashboardLayout>
  );
};

export default Dashboard;
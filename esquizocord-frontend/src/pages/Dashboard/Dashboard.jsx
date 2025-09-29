// src/pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api';
import {
  DashboardLayout,
  ServerList,
  ServerIcon,
  Divider,
  ChannelList,
  ChatArea
} from './styles';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    groups: [],
    friends: [],
    pendingRequests: [],
    sentRequests: [],
    onlineUserIds: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get('/dashboard');
        setDashboardData(response.data);
      } catch (err) {
        setError('Não foi possível carregar os dados do dashboard.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // O array vazio [] garante que este efeito corre apenas uma vez, quando o componente é montado

  if (loading) {
    return <div>A carregar o seu universo...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <DashboardLayout>
      <ServerList>
        <ServerIcon title="Início" className="active">
          <img src="/images/logo.png" alt="Início" />
        </ServerIcon>
        <Divider />
        {dashboardData.groups.map(group => (
          <ServerIcon key={group.id_grupo} title={group.Nome}>
            <img
              src={group.Foto || '/images/default-group-icon.png'}
              alt={group.Nome}
            />
          </ServerIcon>
        ))}
        {/* Ícones de Ação (adicionar, explorar) virão depois */}
         <div style={{marginTop: 'auto'}}>
             <ServerIcon title="Configurações" onClick={() => {/* Navegar para configurações */}}>
                 <img src={user.FotoPerfil || '/images/logo.png'} alt="Perfil" style={{border: '2px solid var(--text-muted)'}}/>
             </ServerIcon>
         </div>
      </ServerList>

      <ChannelList>
        {/* A lista de canais e amigos virá aqui */}
        <p>Coluna de Canais/Amigos</p>
        <button onClick={logout}>Sair</button>
      </ChannelList>

      <ChatArea>
        {/* A área de chat virá aqui */}
        <p>Área de Chat</p>
      </ChatArea>

    </DashboardLayout>
  );
};

export default Dashboard;
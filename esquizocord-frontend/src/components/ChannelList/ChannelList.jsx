import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api';

// Sub-componentes para cada aba
import FriendsList from '../FriendsList/FriendsList';
import PendingRequests from '../PendingRequests/PendingRequests';
import AddFriend from '../AddFriend/AddFriend';

// Componentes de estilo
import {
    ChannelListContainer,
    ChannelHeader,
    FriendsNav,
    FriendsNavButton,
    Content,
    UserPanel,
} from './styles';

// A prop 'onUpdate' é uma função vinda do Dashboard para recarregar os dados
const ChannelList = ({ data, onSelectChat, onUpdate, isGroupView, groupDetails }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('friends');

    // Função central para lidar com todas as ações de amizade
    const handleFriendAction = async (action, id) => {
        let url = '';
        let body = {};
        let method = 'post';

        switch (action) {
            case 'accept':
            case 'reject':
                url = '/friends/respond';
                body = { requestId: id, action: action === 'accept' ? 'aceite' : 'recusada' };
                break;
            case 'cancel':
                url = '/friends/cancel';
                body = { requestId: id };
                break;
            case 'remove':
                if (!window.confirm("Tem a certeza de que deseja remover este amigo?")) return;
                url = `/friends/${id}`;
                method = 'delete';
                break;
            default:
                return;
        }

        try {
            await apiClient[method](url, body);
            onUpdate(); // Notifica o Dashboard para buscar os dados atualizados
        } catch (error) {
            alert(error.response?.data?.message || `Erro ao executar a ação: ${action}`);
        }
    };

    // Renderiza o conteúdo da aba de amigos
    const renderFriendsContent = () => {
        switch (activeTab) {
            case 'pending':
                return <PendingRequests 
                            pending={data.pendingRequests} 
                            sent={data.sentRequests} 
                            onAction={handleFriendAction} 
                        />;
            case 'add':
                return <AddFriend onUpdate={onUpdate} />;
            case 'friends':
            default:
                return <FriendsList 
                            friends={data.friends} 
                            onlineUserIds={data.onlineUserIds} 
                            onSelectChat={onSelectChat} 
                            onAction={handleFriendAction}
                        />;
        }
    };
    
    // Renderiza o conteúdo da visualização de grupo
    const renderGroupContent = () => {
        // Lógica futura para renderizar canais de texto e voz
        return (
            <div>
                 <div style={{ padding: '12px', color: 'var(--text-muted)' }}>
                    CANAIS DE TEXTO
                 </div>
                 {/* Aqui faremos um map dos canais do grupo */}
                 <div style={{ padding: '12px', cursor: 'pointer' }}># geral</div>
            </div>
        );
    }

    return (
        <ChannelListContainer>
            <ChannelHeader>
                {/* O título muda se estivermos a ver um grupo ou a lista de amigos */}
                <span>{isGroupView ? groupDetails.Nome : 'Amigos'}</span>
                {/* O ícone de configurações do grupo será adicionado aqui */}
            </ChannelHeader>

            {/* Mostra a navegação de amigos apenas se não estivermos a ver um grupo */}
            {!isGroupView && (
                 <FriendsNav>
                    <FriendsNavButton $active={activeTab === 'friends'} onClick={() => setActiveTab('friends')}>
                        Amigos
                    </FriendsNavButton>
                    <FriendsNavButton $active={activeTab === 'pending'} onClick={() => setActiveTab('pending')}>
                        Pendentes
                    </FriendsNavButton>
                    <FriendsNavButton $active={activeTab === 'add'} onClick={() => setActiveTab('add')}>
                        Adicionar
                    </FriendsNavButton>
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
// src/components/UserProfileModal/UserProfileModal.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api';
import { ModalOverlay, ModalContent, CloseButton } from '../../pages/Settings/styles';
import {
    ModalBanner, ModalHeader, Avatar, ActionsContainer, ActionButton,
    ModalBody, UserInfo, UserName, Section, MutualsList, MutualItem
} from './styles';

const UserProfileModal = ({ userId, onClose, onAction, onSendMessage }) => {
    const { user: currentUser } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const AI_USER_ID = 1;

    useEffect(() => {
        if (!userId) return;

        const fetchProfile = async () => {
            setLoading(true);
            try {
                // Para a IA, fazemos uma chamada mais simples, pois não há "amigos em comum"
                const url = userId === AI_USER_ID ? `/users/${userId}/profile` : `/users/${userId}/full-profile`;
                const response = await apiClient.get(url);

                // Se a resposta for do perfil simples da IA, formatamos para corresponder à estrutura do perfil completo
                if (userId === AI_USER_ID) {
                    setProfileData({ user: response.data, friendship: { status: 'aceite' }, mutuals: {} });
                } else {
                    setProfileData(response.data);
                }
            } catch (error) {
                console.error("Erro ao buscar perfil:", error);
                alert(error.response?.data?.message || "Não foi possível carregar o perfil.");
                onClose();
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [userId, onClose]);

    const renderActionButtons = () => {
        if (!profileData || !profileData.user || profileData.user.id_usuario === currentUser.id_usuario) {
            return null; // Não mostra botões para o próprio perfil
        }

        const { friendship } = profileData;
        const targetUser = profileData.user;

        // Caso especial para a IA
        if (targetUser.id_usuario === AI_USER_ID) {
            return <ActionButton className="primary" onClick={() => onSendMessage(targetUser)}>Mensagem</ActionButton>;
        }

        if (friendship) {
            if (friendship.status === 'aceite') {
                return (
                    <>
                        <ActionButton className="primary" onClick={() => onSendMessage(targetUser)}>Mensagem</ActionButton>
                        <ActionButton className="danger" onClick={() => onAction('remove', targetUser.id_usuario)}>Remover</ActionButton>
                    </>
                );
            }
            if (friendship.status === 'pendente') {
                if (friendship.id_utilizador_requisitante === currentUser.id_usuario) {
                    return <ActionButton className="secondary" onClick={() => onAction('cancel', friendship.id_amizade)}>Cancelar Pedido</ActionButton>;
                } else {
                    return (
                        <>
                            <ActionButton className="primary" onClick={() => onAction('accept', friendship.id_amizade)}>Aceitar</ActionButton>
                            <ActionButton className="danger" onClick={() => onAction('reject', friendship.id_amizade)}>Recusar</ActionButton>
                        </>
                    );
                }
            }
        }
        
        return <ActionButton className="primary" onClick={() => onAction('add', targetUser.id_usuario)}>Adicionar Amigo</ActionButton>;
    };

    return (
        <ModalOverlay $isOpen={!!userId} onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()} style={{ padding: 0, overflow: 'hidden' }}>
                <CloseButton onClick={onClose}>&times;</CloseButton>
                {loading && <p style={{padding: '20px'}}>A carregar perfil...</p>}
                {!loading && profileData && (
                    <>
                        <ModalBanner />
                        <ModalHeader>
                            <Avatar src={profileData.user.FotoPerfil || '/images/logo.png'} />
                            <ActionsContainer>{renderActionButtons()}</ActionsContainer>
                        </ModalHeader>
                        <ModalBody>
                            <UserInfo>
                                <UserName>
                                    {profileData.user.Nome} 
                                    {profileData.user.id_usuario !== AI_USER_ID && <span> #{profileData.user.id_usuario}</span>}
                                </UserName>
                                
                                <Section>
                                    <h4>Sobre mim</h4>
                                    <p>{profileData.user.Biografia || 'Este utilizador é um mistério... muahahaha!'}</p>
                                </Section>
                            </UserInfo>

                            {profileData.mutuals?.friends?.length > 0 && (
                                <Section>
                                    <h4>{profileData.mutuals.friends.length} Amigo(s) em Comum</h4>
                                    <MutualsList>
                                        {profileData.mutuals.friends.map(friend => (
                                            <MutualItem key={friend.id_usuario}>
                                                <img src={friend.FotoPerfil || '/images/logo.png'} alt={friend.Nome} />
                                                <span>{friend.Nome}</span>
                                            </MutualItem>
                                        ))}
                                    </MutualsList>
                                </Section>
                            )}
                            
                            {profileData.mutuals?.groups?.length > 0 && (
                                <Section>
                                    <h4>{profileData.mutuals.groups.length} Servidor(es) em Comum</h4>
                                    <MutualsList>
                                        {profileData.mutuals.groups.map(group => (
                                            <MutualItem key={group.id_grupo}>
                                                <img src={group.Foto || '/images/default-group-icon.png'} alt={group.Nome} style={{borderRadius: '8px'}}/>
                                                <span>{group.Nome}</span>
                                            </MutualItem>
                                        ))}
                                    </MutualsList>
                                </Section>
                            )}
                        </ModalBody>
                    </>
                )}
            </ModalContent>
        </ModalOverlay>
    );
};

export default UserProfileModal;
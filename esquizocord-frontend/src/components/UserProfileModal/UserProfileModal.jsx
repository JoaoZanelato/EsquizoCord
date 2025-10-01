import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../services/api";
import {
  ModalOverlay,
  ModalContent,
  CloseButton,
} from "../../pages/Settings/styles";
import {
  ModalBanner,
  AvatarContainer,
  Avatar,
  StatusIndicator,
  ProfileHeader,
  ActionsContainer,
  ActionButton,
  ModalBody,
  UserInfo,
  UserName,
  Section,
  MutualsList,
  MutualItem,
  ImagePreviewOverlay,
  UserNameContainer,
  RolesContainer,
  RoleBadge,
  RoleColorDot,
} from "./styles";

const UserProfileModal = ({
  userId,
  onlineUserIds,
  onClose,
  onAction,
  onSendMessage,
  activeGroup,
}) => {
  const { user: currentUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const AI_USER_ID = 1;

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const url =
          userId === AI_USER_ID
            ? `/users/${userId}/profile`
            : `/users/${userId}/full-profile`;
        const response = await apiClient.get(url);
        const data =
          userId === AI_USER_ID
            ? {
                user: response.data,
                friendship: { status: "aceite" },
                mutuals: {},
              }
            : response.data;

        // Adiciona os cargos do servidor ao perfil, se aplicável
        if (activeGroup && data.user) {
          const memberInGroup = activeGroup.members.find(
            (m) => m.id_usuario === data.user.id_usuario
          );
          data.user.cargos = memberInGroup?.cargos || [];
        }

        setProfileData(data);
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
        alert(
          error.response?.data?.message || "Não foi possível carregar o perfil."
        );
        onClose();
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, activeGroup]); // Adicionado activeGroup como dependência

  // ... (função renderActionButtons sem alterações) ...
  const renderActionButtons = () => {
    if (
      !profileData ||
      !profileData.user ||
      profileData.user.id_usuario === currentUser.id_usuario
    )
      return null;
    const { friendship } = profileData;
    const targetUser = profileData.user;
    if (targetUser.id_usuario === AI_USER_ID) {
      return (
        <ActionButton
          className="primary"
          title="Enviar Mensagem"
          onClick={() => onSendMessage(targetUser)}
        >
          <i className="fas fa-comment-dots"></i>
        </ActionButton>
      );
    }
    if (friendship) {
      if (friendship.status === "aceite") {
        return (
          <>
            <ActionButton
              className="primary"
              title="Enviar Mensagem"
              onClick={() => onSendMessage(targetUser)}
            >
              <i className="fas fa-comment-dots"></i>
            </ActionButton>
            <ActionButton
              className="danger"
              title="Remover Amigo"
              onClick={() => onAction("remove", targetUser.id_usuario)}
            >
              <i className="fas fa-user-minus"></i>
            </ActionButton>
          </>
        );
      }
      if (friendship.status === "pendente") {
        if (friendship.id_utilizador_requisitante === currentUser.id_usuario) {
          return (
            <ActionButton
              className="secondary"
              title="Cancelar Pedido"
              onClick={() => onAction("cancel", friendship.id_amizade)}
            >
              <i className="fas fa-user-clock"></i>
            </ActionButton>
          );
        } else {
          return (
            <>
              <ActionButton
                className="primary"
                title="Aceitar"
                onClick={() => onAction("accept", friendship.id_amizade)}
              >
                <i className="fas fa-check"></i>
              </ActionButton>
              <ActionButton
                className="danger"
                title="Recusar"
                onClick={() => onAction("reject", friendship.id_amizade)}
              >
                <i className="fas fa-times"></i>
              </ActionButton>
            </>
          );
        }
      }
    }
    return (
      <ActionButton
        className="primary"
        title="Adicionar Amigo"
        onClick={() => onAction("add", targetUser.id_usuario)}
      >
        <i className="fas fa-user-plus"></i>
      </ActionButton>
    );
  };

  const isUserOnline = (id) => id === AI_USER_ID || onlineUserIds.includes(id);
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  return (
    <>
      <ModalOverlay $isOpen={!!userId} onClick={onClose}>
        <ModalContent
          onClick={(e) => e.stopPropagation()}
          style={{
            padding: 0,
            overflow: "hidden",
            background: "var(--background-secondary)",
          }}
        >
          <CloseButton onClick={onClose} style={{ zIndex: 10 }}>
            &times;
          </CloseButton>
          {loading && <p style={{ padding: "20px" }}>A carregar perfil...</p>}
          {!loading && profileData && (
            <>
              <ModalBanner />
              <ModalBody>
                <AvatarContainer>
                  <Avatar
                    src={profileData.user.FotoPerfil || "/images/logo.png"}
                    onClick={() => setShowImagePreview(true)}
                  />
                  <StatusIndicator
                    $isOnline={isUserOnline(profileData.user.id_usuario)}
                  />
                </AvatarContainer>
                <ProfileHeader>
                  <UserNameContainer>
                    <UserName>
                      {profileData.user.Nome}
                      <span> #{profileData.user.id_usuario}</span>
                    </UserName>
                  </UserNameContainer>
                  <ActionsContainer>{renderActionButtons()}</ActionsContainer>
                </ProfileHeader>
                <UserInfo>
                  <Section>
                    <h4>Sobre mim</h4>
                    <p>
                      {profileData.user.Biografia ||
                        "Este utilizador é um mistério... muahahaha!"}
                    </p>
                  </Section>

                  {/* NOVA SEÇÃO DE CARGOS */}
                  {profileData.user.cargos &&
                    profileData.user.cargos.length > 0 && (
                      <Section>
                        <h4>Cargos</h4>
                        <RolesContainer>
                          {profileData.user.cargos.map((role) => (
                            <RoleBadge key={role.id_cargo} color={role.cor}>
                              <RoleColorDot color={role.cor} />
                              {role.icone} {role.nome_cargo}
                            </RoleBadge>
                          ))}
                        </RolesContainer>
                      </Section>
                    )}

                  {profileData.user.data_cadastro && (
                    <Section>
                      <h4>Membro Desde</h4>
                      <p>{formatDate(profileData.user.data_cadastro)}</p>
                    </Section>
                  )}
                </UserInfo>

                {/* ... (seções de amigos e servidores em comum) ... */}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </ModalOverlay>
      {showImagePreview && (
        <ImagePreviewOverlay onClick={() => setShowImagePreview(false)}>
          <img
            src={profileData.user.FotoPerfil || "/images/logo.png"}
            alt="Preview"
          />
        </ImagePreviewOverlay>
      )}
    </>
  );
};

export default UserProfileModal;

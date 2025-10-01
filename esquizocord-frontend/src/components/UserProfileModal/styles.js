// src/components/UserProfileModal/styles.js
import styled from "styled-components";

export const ModalBanner = styled.div`
  height: 60px;
  background-color: ${({ theme }) =>
    theme.backgroundTertiary}; /* Cor do banner suavizada */
  border-radius: 8px 8px 0 0;
`;

export const AvatarContainer = styled.div`
  position: absolute;
  top: 20px;
  left: 16px;
  width: 92px;
  height: 92px;
  z-index: 2;
`;

export const Avatar = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 6px solid ${({ theme }) => theme.backgroundSecondary};
  background-color: ${({ theme }) => theme.backgroundSecondary};
  cursor: pointer;
`;

export const StatusIndicator = styled.div`
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 4px solid ${({ theme }) => theme.backgroundSecondary};
  background-color: ${({ theme, $isOnline }) =>
    $isOnline ? theme.greenAccent : theme.textMuted};
`;

export const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 0 16px;
  margin-top: -40px;
  margin-left: 110px;
`;

export const UserNameContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: ${({ theme }) => theme.backgroundTertiary};
  border-radius: 8px;
  padding: 8px 12px;
  flex-grow: 1;
  min-width: 0;
`;

export const ActionsContainer = styled.div`
  margin-left: auto;
  display: flex;
  gap: 10px;
  padding-left: 10px;
`;

export const ActionButton = styled.button`
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: background-color 0.2s, transform 0.1s ease-in-out;
  flex-shrink: 0;

  &:active {
    transform: scale(0.95);
  }
  &.primary {
    background-color: ${({ theme }) => theme.brandExperiment};
    color: white;
    &:hover {
      background-color: ${({ theme }) => theme.brandHover};
    }
  }
  &.secondary {
    background-color: ${({ theme }) => theme.backgroundTertiary};
    color: ${({ theme }) => theme.textNormal};
    &:hover {
      background-color: ${({ theme }) => theme.backgroundPrimary};
    }
  }
  &.danger {
    background-color: ${({ theme }) => theme.redDanger};
    color: white;
    &:hover {
      background-color: ${({ theme }) => theme.redDangerHover};
    }
  }
  &:disabled {
    background-color: ${({ theme }) => theme.backgroundTertiary};
    color: ${({ theme }) => theme.textMuted};
    cursor: not-allowed;
  }
`;

export const ModalBody = styled.div`
  padding: 16px;
  background-color: ${({ theme }) => theme.backgroundSecondary};
  border-radius: 0 0 8px 8px;
`;

export const UserInfo = styled.div`
  padding: 16px;
  background-color: ${({ theme }) => theme.backgroundTertiary};
  border-radius: 8px;
  margin-top: 50px;
`;

export const UserName = styled.h3`
  font-size: 20px;
  color: ${({ theme }) => theme.headerPrimary};
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  span {
    color: ${({ theme }) => theme.textMuted};
    font-weight: normal;
  }
`;

export const Section = styled.div`
  margin-top: 16px;
  &:first-child {
    margin-top: 0;
  }

  h4 {
    color: ${({ theme }) => theme.textMuted};
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
    margin: 0 0 8px 0;
  }
  p {
    color: ${({ theme }) => theme.textNormal};
    font-size: 14px;
    line-height: 1.5;
    margin: 0;
    white-space: pre-wrap;
  }
`;

export const MutualsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const MutualItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.backgroundPrimary};

  img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }
  span {
    font-weight: 500;
    color: ${({ theme }) => theme.textNormal};
  }
`;

export const ImagePreviewOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  cursor: pointer;

  img {
    max-width: 80vw;
    max-height: 80vh;
    border-radius: 8px;
  }
`;
export const RolesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const RoleBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: ${({ theme }) => theme.backgroundPrimary};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid ${(props) => props.color || "transparent"};
`;

export const RoleColorDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${(props) => props.color};
`;

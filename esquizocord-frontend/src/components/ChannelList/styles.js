// src/components/ChannelList/styles.js
import styled from "styled-components";

export const ChannelListContainer = styled.aside`
  width: 260px;
  background-color: ${({ theme }) => theme.backgroundSecondary};
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  z-index: 2;

  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    bottom: 0;
    height: 100%;
    left: ${({ $isOpen }) => ($isOpen ? "72px" : "-100%")};
    transition: left 0.3s ease-in-out;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.5);
  }
`;

export const ChannelHeader = styled.div`
  padding: 12px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
  font-weight: bold;
  color: ${({ theme }) => theme.headerPrimary};
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 50px;
`;

export const FriendsNav = styled.div`
  display: flex;
  padding: 12px;
  gap: 8px;
  border-bottom: 1px solid ${({ theme }) => theme.backgroundTertiary};
`;

export const FriendsNavButton = styled.button`
  flex: 1;
  background: ${({ theme, $active }) =>
    $active ? theme.brandExperiment : "transparent"};
  border: none;
  color: ${({ theme }) => theme.textNormal};
  padding: 8px 5px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
  transition: background-color 0.2s;
  &:hover {
    background-color: ${({ theme, $active }) =>
      !$active && "rgba(255, 255, 255, 0.04)"};
  }
`;

export const Content = styled.div`
  padding: 12px 8px;
  flex-grow: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

export const UserPanel = styled.div`
  background-color: ${({ theme }) => theme.backgroundTertiary};
  padding: 8px;
  display: flex;
  align-items: center;
  margin-top: auto;
  min-height: 52px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.backgroundModifierHover};
  }

  .user-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
    white-space: nowrap;
  }

  .username {
    font-weight: bold;
    font-size: 14px;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .user-status {
    color: ${({ theme }) => theme.textMuted};
    font-size: 12px;
    text-overflow: ellipsis;
    overflow: hidden;
  }
`;

export const AvatarWithStatus = styled.div`
  position: relative;
  flex-shrink: 0;
  margin-right: 8px;

  img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }
`;

export const UserStatusIndicator = styled.span`
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 3px solid ${({ theme }) => theme.backgroundTertiary};
  background-color: ${({ color }) => color};
`;

export const ListHeader = styled.div`
  color: ${({ theme }) => theme.textMuted};
  font-size: 12px;
  font-weight: bold;
  padding: 0 8px;
  margin-bottom: 8px;
  text-transform: uppercase;
`;

export const ChannelItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  margin: 0 4px;
  border-radius: 4px;
  cursor: pointer;
  color: ${({ theme, $active }) =>
    $active ? theme.headerPrimary : theme.textMuted};
  background-color: ${({ theme, $active }) =>
    $active ? "rgba(255, 255, 255, 0.08)" : "transparent"};
  font-weight: ${({ $active }) => ($active ? "bold" : "normal")};

  &:hover {
    background-color: rgba(255, 255, 255, 0.04);
    color: ${({ theme }) => theme.headerPrimary};
  }
`;

export const MemberList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const MemberItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.04);
  }

  img {
    width: 24px;
    height: 24px;
    border-radius: 50%;
  }

  span {
    color: ${({ theme, color }) => color || theme.textMuted};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .online-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${({ theme }) => theme.greenAccent};
    margin-left: auto;
    flex-shrink: 0;
  }

  i.fa-shield-alt,
  i.fa-robot {
    margin-left: auto;
    flex-shrink: 0;
  }
`;

export const ManageMemberButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.textMuted};
  cursor: pointer;
  visibility: hidden;
  opacity: 0;
  margin-left: 8px;
  padding: 4px;

  ${MemberItem}:hover & {
    visibility: visible;
    opacity: 1;
  }

  &:hover {
    color: ${({ theme }) => theme.headerPrimary};
  }
`;

export const KickMemberButton = styled(ManageMemberButton)`
  &:hover {
    color: ${({ theme }) => theme.redDanger};
  }
`;

export const DeleteChannelButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.textMuted};
  cursor: pointer;
  visibility: hidden;
  opacity: 0;
  margin-left: auto;
  padding: 4px;
  font-size: 14px;

  ${ChannelItem}:hover & {
    visibility: visible;
    opacity: 1;
  }

  &:hover {
    color: ${({ theme }) => theme.redDanger};
  }
`;
export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;

  i {
    cursor: pointer;
    color: ${({ theme }) => theme.textMuted};
    transition: color 0.2s;

    &:hover {
      color: ${({ theme }) => theme.headerPrimary};
    }
  }
`;
export const STATUS_COLORS = {
  online: "#43b581",
  ausente: "#faa61a",
  ocupado: "#f04747",
  invisivel: "#747f8d",
};
export const ListHeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-right: 8px;
`;

export const AddChannelButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.textMuted};
  cursor: pointer;
  font-size: 16px;
  &:hover {
    color: ${({ theme }) => theme.headerPrimary};
  }
`;

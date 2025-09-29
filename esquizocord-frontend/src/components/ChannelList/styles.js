// src/components/ChannelList/styles.js
import styled from 'styled-components';

export const ChannelListContainer = styled.aside`
  width: 260px;
  background-color: ${({ theme }) => theme.backgroundSecondary};
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
`;

export const ChannelHeader = styled.div`
  padding: 12px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
  font-weight: bold;
  color: ${({ theme }) => theme.headerPrimary};
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 50px; // Altura fixa para alinhar com o header do chat
`;

export const FriendsNav = styled.div`
  display: flex;
  padding: 12px;
  gap: 8px;
  border-bottom: 1px solid ${({ theme }) => theme.backgroundTertiary};
`;

export const FriendsNavButton = styled.button`
  flex: 1;
  background: ${({ theme, active }) => (active ? theme.brandExperiment : theme.backgroundSecondary)};
  border: none;
  color: ${({ theme }) => theme.textNormal};
  padding: 8px 5px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme, active }) => !active && 'rgba(255, 255, 255, 0.04)'};
  }
`;

export const Content = styled.div`
  padding: 12px;
  flex-grow: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

export const UserPanel = styled.div`
  background-color: ${({ theme }) => theme.backgroundTertiary};
  padding: 12px;
  display: flex;
  align-items: center;
  margin-top: auto; // Empurra o painel para o fundo
  height: 52px; // Altura fixa

  img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    margin-right: 8px;
  }

  .username {
    font-weight: bold;
  }
  
  .user-tag {
    color: ${({ theme }) => theme.textMuted};
    font-size: 12px;
  }
`;
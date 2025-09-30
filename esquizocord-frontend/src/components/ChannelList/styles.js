// src/components/ChannelList/styles.js
import styled from 'styled-components';

// ... (estilos existentes: ChannelListContainer, ChannelHeader, etc.)
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
  background: ${({ theme, $active }) => ($active ? theme.brandExperiment : 'transparent')};
  border: none;
  color: ${({ theme }) => theme.textNormal};
  padding: 8px 5px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
  transition: background-color 0.2s;
  &:hover {
    background-color: ${({ theme, $active }) => !$active && 'rgba(255, 255, 255, 0.04)'};
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
  padding: 12px;
  display: flex;
  align-items: center;
  margin-top: auto;
  height: 52px;

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
  color: ${({ theme, $active }) => $active ? theme.headerPrimary : theme.textMuted};
  background-color: ${({ theme, $active }) => $active ? 'rgba(255, 255, 255, 0.08)' : 'transparent'};
  font-weight: ${({ $active }) => $active ? 'bold' : 'normal'};
  
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
  cursor: pointer; /* Adicionado para indicar que o item todo é clicável */
  transition: background-color 0.2s;

  /* --- EFEITO DE HOVER ADICIONADO --- */
  &:hover {
    background-color: rgba(255, 255, 255, 0.04);
  }
  
  img {
    width: 24px;
    height: 24px;
    border-radius: 50%;
  }

  span {
    color: ${({ theme }) => theme.textMuted};
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

  i.fa-crown {
    color: #FAA61A;
    font-size: 14px;
    margin-left: auto;
    flex-shrink: 0;
  }
`;
// src/components/FriendsList/styles.js
import styled from 'styled-components';

export const FriendsListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const ListHeader = styled.div`
  color: ${({ theme }) => theme.textMuted};
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 10px;
  text-transform: uppercase;
  padding: 0 8px;
`;

export const FriendItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.04);
  }
`;

export const FriendInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const AvatarContainer = styled.div`
  position: relative;
  flex-shrink: 0;

  img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }
`;

export const StatusIndicator = styled.span`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid ${({ theme }) => theme.backgroundSecondary};
  background-color: ${({ theme, $isOnline }) => ($isOnline ? theme.greenAccent : theme.textMuted)};
`;


export const NameTag = styled.span`
  font-weight: 500;
  .user-tag {
    color: ${({ theme }) => theme.textMuted};
    font-size: 12px;
    font-weight: normal;
  }
`;

export const FriendActions = styled.div`
  display: flex;
  gap: 10px;
  
  button {
    background: none;
    border: none;
    color: ${({ theme }) => theme.textMuted};
    font-size: 16px;
    cursor: pointer;
    padding: 5px;
    transition: color 0.2s;

    &:hover {
        color: ${({ theme }) => theme.headerPrimary};
    }
    
    &.remove:hover {
        color: ${({ theme }) => theme.redDanger};
    }
  }
`;
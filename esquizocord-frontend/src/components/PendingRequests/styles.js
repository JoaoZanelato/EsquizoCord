// src/components/PendingRequests/styles.js
import styled from 'styled-components';
import { ListHeader, NameTag, AvatarContainer } from '../FriendsList/styles'; // Reutilizamos alguns estilos

export const PendingContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

export const StyledListHeader = styled(ListHeader)``; // Reutiliza o estilo do cabeçalho

export const RequestItem = styled.div`
  background-color: transparent;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.04);
  }
`;

export const UserInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`;

export const StyledAvatarContainer = styled(AvatarContainer)``;
export const StyledNameTag = styled(NameTag)``;

export const Actions = styled.div`
  display: flex;
  gap: 10px;

  button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 20px;
    padding: 5px;
    transition: color 0.2s;

    &.accept {
        color: ${({ theme }) => theme.greenAccent};
        &:hover { color: #fff; }
    }

    &.reject, &.cancel {
        color: ${({ theme }) => theme.redDanger};
        &:hover { color: #fff; }
    }
  }
`;
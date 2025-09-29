// src/components/AddFriend/styles.js
import styled from 'styled-components';
import { ListHeader, NameTag, AvatarContainer } from '../FriendsList/styles'; // Reutilizamos alguns estilos

export const AddFriendContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

export const StyledListHeader = styled(ListHeader)``;

export const Description = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.textMuted};
  margin: 0 8px 12px;
`;

export const SearchInput = styled.input`
  width: 100%;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid ${({ theme }) => theme.backgroundTertiary};
  background-color: ${({ theme }) => theme.backgroundTertiary};
  color: ${({ theme }) => theme.textNormal};
  font-size: 16px;
  margin-bottom: 20px;
`;

export const ResultsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const ResultItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.backgroundPrimary};
`;

export const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const StyledAvatarContainer = styled(AvatarContainer)``;
export const StyledNameTag = styled(NameTag)``;

export const AddButton = styled.button`
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.brandExperiment};
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.brandHover};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.backgroundTertiary};
    cursor: not-allowed;
  }
`;
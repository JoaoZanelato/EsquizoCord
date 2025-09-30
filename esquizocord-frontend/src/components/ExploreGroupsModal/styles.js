// src/components/ExploreGroupsModal/styles.js
import styled from 'styled-components';

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
  margin-top: 10px;
  max-height: 40vh;
  overflow-y: auto;
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

  &:hover {
    background-color: ${({ theme }) => theme.backgroundModifierHover};
  }
`;

export const GroupInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  img {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    object-fit: cover;
  }
`;

export const GroupName = styled.div`
  font-weight: 500;
  color: ${({ theme }) => theme.headerPrimary};
  
  span {
    color: ${({ theme }) => theme.textMuted};
    font-size: 12px;
    font-weight: normal;
  }
`;

export const JoinButton = styled.button`
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
    color: ${({ theme }) => theme.textMuted};
    cursor: not-allowed;
  }
`;
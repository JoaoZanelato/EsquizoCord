// src/components/EditGroupModal/styles.js
import styled from 'styled-components';

// A maioria dos estilos pode ser reutilizada do CreateGroupModal
export const ModalActions = styled.div`
  display: flex;
  justify-content: space-between; /* Alinha os botões nas extremidades */
  align-items: center;
  margin-top: 24px;
`;

export const DeleteButton = styled.button`
    padding: 10px 24px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    background-color: ${({ theme }) => theme.redDanger};
    color: white;

    &:hover {
        background-color: ${({ theme }) => theme.redDangerHover};
    }

    &:disabled {
        background-color: ${({ theme }) => theme.backgroundTertiary};
        cursor: not-allowed;
    }
`;
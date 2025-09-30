// src/components/UserProfileModal/styles.js
import styled from 'styled-components';
import { ActionLink } from '../../pages/Settings/styles';

export const ModalBanner = styled.div`
    height: 100px;
    background-color: ${({ theme }) => theme.brandExperiment};
    border-radius: 8px 8px 0 0;
`;

export const ModalHeader = styled.div`
    position: relative;
    padding: 0 16px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
`;

export const Avatar = styled.img`
    width: 92px;
    height: 92px;
    border-radius: 50%;
    border: 6px solid ${({ theme }) => theme.backgroundSecondary};
    position: absolute;
    top: -46px; /* Metade da altura para sobrepor a banner */
    background-color: ${({ theme }) => theme.backgroundSecondary};
`;

export const ActionsContainer = styled.div`
    padding-top: 16px;
    display: flex;
    gap: 10px;
    margin-left: auto; /* Empurra os botões para a direita */
`;

export const ActionButton = styled.button`
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    font-size: 14px;
    transition: background-color 0.2s;

    &.primary {
        background-color: ${({ theme }) => theme.brandExperiment};
        color: white;
        &:hover { background-color: ${({ theme }) => theme.brandHover}; }
    }

    &.secondary {
        background-color: ${({ theme }) => theme.backgroundTertiary};
        color: ${({ theme }) => theme.textNormal};
        &:hover { background-color: ${({ theme }) => theme.backgroundPrimary}; }
    }

    &.danger {
        background-color: ${({ theme }) => theme.redDanger};
        color: white;
        &:hover { background-color: ${({ theme }) => theme.redDangerHover}; }
    }

    &:disabled {
        background-color: ${({ theme }) => theme.backgroundTertiary};
        color: ${({ theme }) => theme.textMuted};
        cursor: not-allowed;
    }
`;

export const ModalBody = styled.div`
    padding: 52px 16px 16px 16px;
    background-color: ${({ theme }) => theme.backgroundSecondary};
    border-radius: 0 0 8px 8px;
`;

export const UserInfo = styled.div`
    padding: 16px;
    background-color: ${({ theme }) => theme.backgroundTertiary};
    border-radius: 8px;
`;

export const UserName = styled.h3`
    font-size: 20px;
    color: ${({ theme }) => theme.headerPrimary};
    margin: 0;
    
    span {
        color: ${({ theme }) => theme.textMuted};
        font-weight: normal;
    }
`;

export const Section = styled.div`
    margin-top: 20px;

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
        white-space: pre-wrap; /* Preserva quebras de linha na biografia */
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
    background-color: ${({ theme }) => theme.backgroundSecondary};

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
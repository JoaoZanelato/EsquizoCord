// src/pages/Dashboard/styles.js
import styled from 'styled-components';

export const DashboardLayout = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: ${({ theme }) => theme.backgroundPrimary};
`;

export const ServerList = styled.nav`
  width: 72px;
  background-color: ${({ theme }) => theme.backgroundTertiary};
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  overflow-y: auto;
`;

export const ServerIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.backgroundPrimary};
  margin-bottom: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: border-radius 0.3s, background-color 0.3s;

  img {
    width: 100%;
    height: 100%;
    border-radius: inherit;
    object-fit: cover;
  }

  &:hover, &.active {
    border-radius: 16px;
    background-color: ${({ theme }) => theme.brandExperiment};
  }
`;

export const Divider = styled.div`
  height: 2px;
  width: 32px;
  background-color: ${({ theme }) => theme.backgroundSecondary};
  margin: 8px 0;
`;

export const ChannelList = styled.aside`
  width: 260px;
  background-color: ${({ theme }) => theme.backgroundSecondary};
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
`;

export const ChatArea = styled.main`
  flex-grow: 1;
  background-color: ${({ theme }) => theme.backgroundPrimary};
  display: flex;
  flex-direction: column;
`;
export const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  /* A cor de fundo agora vem do tema aplicado */
  background-color: ${({ theme }) => theme.backgroundTertiary};
  color: ${({ theme }) => theme.textNormal};
  font-size: 1.2rem;
`;
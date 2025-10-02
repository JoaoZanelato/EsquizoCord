// src/pages/Dashboard/styles.js
import styled from "styled-components";

export const DashboardLayout = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: ${({ theme }) => theme.backgroundPrimary};

  @media (max-width: 768px) {
    overflow-x: hidden;
  }
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
  z-index: 3;

  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    bottom: 0;
    height: 100%;
    left: ${({ $isOpen }) => ($isOpen ? "0" : "-100%")};
    transition: left 0.3s ease-in-out;
  }
`;

export const ServerIcon = styled.div`
  position: relative; /* Adicionado para o badge */
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

  &:hover,
  &.active {
    border-radius: 16px;
    background-color: ${({ theme }) => theme.brandExperiment};
  }
`;

export const NotificationBadge = styled.span`
  position: absolute;
  top: 0px;
  right: 0px;
  width: 10px;
  height: 10px;
  background-color: ${({ theme }) => theme.redDanger};
  border-radius: 50%;
  border: 2px solid ${({ theme }) => theme.backgroundTertiary};
`;

export const Divider = styled.div`
  height: 2px;
  width: 32px;
  background-color: ${({ theme }) => theme.backgroundSecondary};
  margin: 8px 0;
`;

export const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background-color: ${({ theme }) => theme.backgroundTertiary};
  color: ${({ theme }) => theme.textNormal};
  font-size: 1.2rem;
`;
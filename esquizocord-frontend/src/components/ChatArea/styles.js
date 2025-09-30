// src/components/ChatArea/styles.js
import styled from 'styled-components';

export const ChatAreaContainer = styled.main`
  flex-grow: 1;
  background-color: ${({ theme }) => theme.backgroundPrimary};
  display: flex;
  flex-direction: column;
`;

export const Header = styled.div`
  padding: 12px 16px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
  font-weight: bold;
  color: ${({ theme }) => theme.headerPrimary};
  display: flex;
  align-items: center;
  gap: 12px;
  height: 50px;
  flex-shrink: 0;
  
  /* --- EFEITO DE HOVER ADICIONADO --- */
  & > div { /* Aplica o hover apenas ao container do perfil no cabeçalho */
    padding: 4px 8px;
    border-radius: 4px;
    transition: background-color 0.2s;
    &:hover {
        background-color: rgba(255, 255, 255, 0.04);
    }
  }

  img {
    width: 24px;
    height: 24px;
    border-radius: 50%;
  }

  h3 {
    margin: 0;
    font-size: 16px;
    .user-tag {
        color: ${({ theme }) => theme.textMuted};
        font-size: 12px;
    }
  }
`;

export const MessagesContainer = styled.div`
  flex-grow: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;


export const WelcomeMessage = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: ${({ theme }) => theme.textMuted};
    text-align: center;
`;
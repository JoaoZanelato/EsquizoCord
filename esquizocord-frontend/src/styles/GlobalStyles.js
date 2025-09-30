// src/styles/GlobalStyles.js
import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    overflow: hidden;
    color: ${({ theme }) => theme.textNormal};
    background-color: ${({ theme }) => theme.backgroundPrimary};
  }

  /* --- INÍCIO DA ALTERAÇÃO --- */
  /* Estilização da Scrollbar para navegadores WebKit (Chrome, Safari, etc.) */
  ::-webkit-scrollbar {
    width: 15px; /* Largura da scrollbar */
  }

  /* Fundo da scrollbar (a trilha) */
  ::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.backgroundTertiary};
    border-radius: 4px;
  }

  /* O "polegar" ou a parte que se move */
  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.backgroundSecondary};
    border-radius: 4px;
  }

  /* Efeito ao passar o mouse sobre o "polegar" */
  ::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.brandHover};
  }
  /* --- FIM DA ALTERAÇÃO --- */
`;

export default GlobalStyles;
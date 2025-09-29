// src/styles/themes.js
const baseTheme = {
  backgroundPrimary: '#36393f',
  backgroundSecondary: '#2f3136',
  backgroundTertiary: '#202225',
  headerPrimary: '#fff',
  textNormal: '#dcddde',
  textMuted: '#72767d',
  brandExperiment: '#660080',
  brandHover: '#572364',
  purpleAccent: '#cc00ff',
  greenAccent: '#43b581',
  redDanger: '#f04747',
  redDangerHover: '#d84040',
  chatBubbleSent: '#5865f2',
};

export const themes = {
  1: { // Roxo Padrão
    ...baseTheme,
    brandExperiment: '#540B70',
    purpleAccent: '#cc00ff',
  },
  2: { // Azul Meia-noite
    ...baseTheme,
    backgroundPrimary: '#2c3e50',
    backgroundSecondary: '#34495e',
    backgroundTertiary: '#23303e',
    headerPrimary: '#ecf0f1',
    textNormal: '#bdc3c7',
    textMuted: '#95a5a6',
    brandExperiment: '#3498db',
    brandHover: '#2980b9',
    purpleAccent: '#5dade2',
    greenAccent: '#2ecc71',
    redDanger: '#e74c3c',
    chatBubbleSent: '#3498db',
  },
  3: { // Verde Floresta
    ...baseTheme,
    backgroundPrimary: '#2e403f',
    backgroundSecondary: '#3a4e4e',
    backgroundTertiary: '#253332',
    headerPrimary: '#f0fff0',
    textNormal: '#d4edda',
    textMuted: '#a8d1b1',
    brandExperiment: '#28a745',
    brandHover: '#218838',
    greenAccent: '#00bc8c',
  },
  // Adicione os outros temas aqui (4 e 5)
};
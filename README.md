# EsquizoCord

![EsquizoCord Logo](https://raw.githubusercontent.com/JoaoZanelato/EsquizoCord/main/esquizocord-frontend/public/images/logo.png)

> Uma aplicação de chat em tempo real inspirada no Discord, desenvolvida como uma Single-Page Application (SPA) com foco em segurança, escalabilidade e interatividade.

## Contexto Acadêmico e Uso de IA

Este projeto foi idealizado e desenvolvido com o objetivo de colocar em prática os conhecimentos obtidos no **terceiro semestre do curso de Análise e Desenvolvimento de Sistemas no IFRS**. 

Como a visão original da plataforma era bastante ambiciosa e algumas funcionalidades ultrapassavam nosso escopo técnico atual, adotamos a **Inteligência Artificial (IA)** como ferramenta de apoio em etapas mais complexas. O uso da IA nos permitiu viabilizar lógicas avançadas (como a integração de WebRTC para voz e a arquitetura do backend) sem comprometer a ideia original, garantindo que pudéssemos focar 100% da nossa energia na aplicação prática dos requisitos exigidos no semestre.

## Tecnologias Utilizadas

| Categoria         | Tecnologia                                                            |
| :---------------- | :-------------------------------------------------------------------- |
| **Frontend** | React, Vite, Styled-Components, Axios, Socket.io-client, React Router |
| **Backend** | Node.js, Express.js, Socket.IO, WebRTC (Voz)                          |
| **Base de Dados** | MySQL                                                                 |
| **Segurança** | Express Session, Bcrypt, Encriptação AES-256-GCM para mensagens       |
| **Uploads & IA** | Cloudinary, Multer, Google Gemini API                                 |

## Principais Funcionalidades

* **Gestão de Utilizadores:** Autenticação completa, recuperação de senha via e-mail, perfis customizáveis com avatares e status de presença.
* **Chat em Tempo Real:** Mensagens diretas e em canais de grupo via WebSockets, canais de voz, upload de imagens e edição/exclusão de mensagens.
* **Servidores e Amizades:** Criação de grupos públicos ou privados, moderação avançada, sistema de cargos/permissões granulares e lista de amigos.
* **EsquizoIA:** Assistente virtual inteligente alimentada pela API Gemini, capaz de interagir nos grupos ou via DMs.
* **Analytics do Servidor:** Relatórios visuais e gráficos de atividade para administradores.

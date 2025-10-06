# EsquizoCord

![EsquizoCord Logo](https://raw.githubusercontent.com/JoaoZanelato/EsquizoCord/main/esquizocord-frontend/public/images/logo.png)

## Visão Geral do Projeto

O EsquizoCord é uma aplicação de chat em tempo real inspirada no Discord, desenvolvida como uma moderna Single-Page Application (SPA). A plataforma permite que os utilizadores comuniquem em servidores (grupos) públicos ou privados, criem canais de texto e voz, conversem diretamente com amigos e interajam com uma IA integrada, a "EsquizoIA".

Este projeto foi construído com uma arquitetura desacoplada, utilizando um backend robusto em **Node.js/Express** e um frontend reativo em **React (com Vite)**, garantindo uma experiência de utilizador fluida e em tempo real através de WebSockets com Socket.IO. A segurança é um pilar fundamental, com autenticação baseada em sessão, encriptação de senhas e encriptação de todas as mensagens no servidor.

## 🚀 Tecnologias Utilizadas

| Categoria         | Tecnologia                                                            |
| :---------------- | :-------------------------------------------------------------------- |
| **Frontend**      | React, Vite, Styled-Components, Axios, Socket.io-client, React Router |
| **Backend**       | Node.js, Express.js, Socket.IO, WebRTC (para voz)                     |
| **Base de Dados** | MySQL                                                                 |
| **Autenticação**  | Express Session, Bcrypt (para hashing de senhas)                      |
| **Segurança**     | Encriptação AES-256-GCM para mensagens no servidor                    |
| **Uploads**       | Cloudinary, Multer                                                    |
| **IA**            | Google Gemini API                                                     |

## ✨ Funcionalidades Implementadas

### 👤 Autenticação e Gestão de Utilizadores

- **Sistema de Contas Completo:** Registo de utilizador com verificação por e-mail, login seguro e logout.
- **Recuperação de Senha:** Fluxo completo para solicitar e redefinir a senha através de um token enviado por e-mail.
- **Perfis Personalizáveis:** Os utilizadores podem editar o seu nome, biografia, foto de perfil e escolher entre diferentes temas visuais para a interface.
- **Status de Presença Personalizado:** Os utilizadores podem definir o seu status como Online, Ausente, Ocupado ou Invisível, além de uma mensagem de status personalizada.
- **Recorte de Imagem:** Ferramenta de recorte de imagem integrada para avatares de utilizador e ícones de grupo.

### 💬 Chat em Tempo Real

- **Comunicação Instantânea:** Mensagens diretas (DMs) e em canais de grupo atualizadas em tempo real via WebSockets.
- **Canais de Voz:** Integração com WebRTC para permitir comunicação por voz em canais dedicados.
- **Notificações em Tempo Real:** Sistema de notificações visuais para novas mensagens, pedidos de amizade e menções.
- **Funcionalidades Avançadas:**
  - **Edição de Mensagens:** Os utilizadores podem editar as suas próprias mensagens após o envio.
  - **Responder a Mensagens:** Contexto visual ao responder a uma mensagem específica.
  - **Apagar Mensagens:** Utilizadores podem apagar as suas próprias mensagens, e administradores com permissão podem apagar qualquer mensagem.
  - **Envio de Imagens:** Suporte para upload e visualização de imagens nos chats.
- **Segurança:** Todas as mensagens são encriptadas no servidor com AES-256-GCM, garantindo que fiquem ilegíveis na base de dados.

### 🤝 Sistema de Amizades

- **Gestão de Amigos:** Pesquisa de utilizadores, envio, aceitação, recusa e cancelamento de pedidos de amizade.
- **Lista de Amigos:** Interface dedicada para visualizar amigos e o seu status online.

### 🏛️ Gestão de Servidores (Grupos)

- **Criação e Descoberta:** Utilizadores podem criar os seus próprios servidores (públicos ou privados) e explorar uma lista de servidores públicos para se juntarem.
- **Moderação Avançada:** Ferramentas para administradores, como expulsar e banir membros de um servidor.
- **Gestão de Canais:** Criação e exclusão de canais de texto e voz dentro de um servidor.
- **Sistema de Cargos e Permissões:**
  - Criação e gestão de cargos com nome, cor, ícone e permissões granulares (ex: Gerir Cargos, Apagar Mensagens, Banir Membros).
  - Atribuição de múltiplos cargos a membros do servidor.

### 🤖 Integração com IA

- **EsquizoIA:** Uma personagem de IA, alimentada pela API Gemini do Google, que participa nos grupos e pode ser adicionada como amiga para conversas diretas.
- **Interação:** Mencione a `@EsquizoIA` num canal ou converse diretamente com ela para obter respostas contextuais e criativas.

### 📊 Analytics do Servidor

- **Relatórios Visuais:** Administradores com permissão podem aceder a um modal com estatísticas do servidor, incluindo número de membros, total de mensagens, um gráfico de atividade diária e uma lista dos membros mais ativos.

## 🔧 Como Executar o Projeto

Siga os passos abaixo para configurar e executar o projeto localmente.

### Pré-requisitos

- Node.js (versão 16 ou superior)
- MySQL
- Git

### 1. Clonar o Repositório

```bash
git clone [https://github.com/JoaoZanelato/EsquizoCord.git](https://github.com/JoaoZanelato/EsquizoCord.git)
cd EsquizoCord

```

### 2. Configuração do Backend

Bash

```
cd esquizocord-backend
npm install

# Crie um ficheiro .env a partir do exemplo
cp ".env example" .env

```

Preencha o ficheiro `.env` com as suas credenciais:

- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, `DB_CA_CERT`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `ENCRYPTION_SECRET_KEY` (uma string hexadecimal de 64 caracteres)
- `EMAIL_USER`, `EMAIL_PASS` (para o Nodemailer)
- `GEMINI_API_KEY`

Após configurar, execute o script SQL `db.sql` na sua base de dados MySQL para criar as tabelas e inserir os dados iniciais.

Finalmente, inicie o servidor backend:

Bash

```
npm start

```

O servidor estará a correr em `http://localhost:3000`.

### 3. Configuração do Frontend

Num novo terminal:

Bash

```
cd esquizocord-frontend
npm install

# Inicie o servidor de desenvolvimento do Vite
npm run dev

```

A aplicação frontend estará acessível em `http://localhost:5173`.

## 🗺️ Roadmap (Próximos Passos)

- **Agente de IA:** Transforme a API Gemini com prompt em um Agente de IA chamado EsquizoAI

## 📄 Licença

Este projeto está licenciado sob a Licença MIT. Consulte o ficheiro `LICENSE` para mais detalhes.```

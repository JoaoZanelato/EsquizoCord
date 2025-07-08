# Documentação Completa do EsquizoCord

## Visão Geral do Projeto

O EsquizoCord é uma aplicação de chat em tempo real inspirada no Discord, que permite aos usuários se comunicarem em grupos públicos ou privados, além de conversas diretas com amigos. O projeto inclui um backend robusto construído com Node.js e Express, um frontend dinâmico usando EJS e JavaScript puro, e um banco de dados MySQL para persistência de dados. A segurança é uma prioridade, com criptografia de senhas e mensagens. Além disso, o projeto conta com uma IA interativa, a "EsquizoIA", que pode ser mencionada em grupos para obter respostas.

## Arquitetura

O projeto é dividido nas seguintes pastas principais:

* **`bin/www`**: Ponto de entrada da aplicação. Responsável por iniciar o servidor HTTP e o Socket.IO.
* **`db.js`**: Configura e inicializa o pool de conexões com o banco de dados MySQL.
* **`public/`**: Contém todos os arquivos estáticos que são servidos ao cliente.
    * **`images/`**: Imagens e ícones usados na aplicação.
    * **`js/`**: Lógica do lado do cliente, principalmente o arquivo `dashboard.js` que gerencia toda a interatividade da interface do usuário.
    * **`stylesheets/`**: Arquivos de estilo (CSS) para a aplicação.
* **`routes/`**: Define os endpoints da API para diferentes funcionalidades da aplicação.
    * **`index.js`**: Rotas principais, como login, cadastro, e renderização do dashboard.
    * **`users.js`**: Rotas relacionadas a usuários.
    * **`groups.js`**: Rotas para gerenciamento de grupos, chats e mensagens em grupo.
    * **`friends.js`**: Rotas para gerenciamento de amizades e mensagens diretas.
* **`utils/`**: Contém módulos de ajuda.
    * **`crypto-helper.js`**: Funções para criptografar e descriptografar mensagens.
    * **`ia-helper.js`**: Lógica para interagir com a API da IA (Gemini).
* **`views/`**: Arquivos de template EJS (Embedded JavaScript) que são renderizados no servidor para gerar o HTML final.
* **`app.js`**: Arquivo principal de configuração do Express. Aqui, os middlewares são configurados, as rotas são importadas e os tratamentos de erro são definidos.

## Funcionalidades Detalhadas

### 1. **Autenticação e Usuários (`routes/index.js`)**

* **Cadastro (`/cadastro`)**:
    * **POST**: Cria um novo usuário, criptografa a senha e envia um e-mail de verificação. As senhas são tratadas com `bcrypt` para segurança.
* **Login (`/login`)**:
    * **POST**: Autentica um usuário comparando a senha fornecida com a versão criptografada no banco de dados. Após o sucesso, uma sessão é criada para o usuário.
* **Recuperação de Senha (`/esqueceu-senha`, `/redefinir-senha`)**:
    * **POST (`/esqueceu-senha`)**: Envia um e-mail com um link de redefinição de senha contendo um token seguro.
    * **POST (`/redefinir-senha`)**: Permite que o usuário defina uma nova senha usando o token recebido.
* **Configurações do Perfil (`/configuracao`)**:
    * **POST**: Permite que o usuário atualize seu nome, biografia, foto de perfil (com upload para o Cloudinary) e tema da interface.

### 2. **Grupos (`routes/groups.js`)**

* **Criar Grupo (`/criar`)**:
    * **POST**: Cria um novo grupo (público ou privado), adiciona o criador e a "EsquizoIA" como participantes, e cria um canal de texto padrão chamado "geral".
* **Explorar Grupos (`/search`)**:
    * **GET**: Retorna uma lista de grupos públicos que podem ser pesquisados por nome ou ID.
* **Entrar em um Grupo (`/:id/join`)**:
    * **POST**: Adiciona o usuário logado como participante de um grupo público.
* **Detalhes do Grupo (`/:id/details`)**:
    * **GET**: Retorna todos os detalhes de um grupo, incluindo nome, canais, e lista de membros com status de administrador.
* **Mensagens em Grupo (`/chats/:chatId/messages`)**:
    * **GET**: Busca o histórico de mensagens de um canal de texto específico, descriptografando o conteúdo antes de enviá-lo ao cliente.
    * **POST**: Envia uma nova mensagem para um canal. Se a mensagem mencionar a "@EsquizoIA", o sistema obtém uma resposta da IA e a envia para o mesmo canal.

### 3. **Amizades e Mensagens Diretas (`routes/friends.js`)**

* **Buscar Usuários (`/search`)**:
    * **GET**: Procura por usuários pelo nome para adicionar como amigo, excluindo a si mesmo e a IA dos resultados.
* **Pedidos de Amizade (`/request`, `/respond`, `/cancel`)**:
    * **POST (`/request`)**: Envia um pedido de amizade para outro usuário.
    * **POST (`/respond`)**: Permite ao usuário aceitar ou recusar um pedido de amizade pendente.
    * **POST (`/cancel`)**: Cancela um pedido de amizade enviado.
* **Remover Amigo (`/:friendId`)**:
    * **DELETE**: Desfaz uma amizade existente.
* **Mensagens Diretas (`/dm/:friendId/messages`)**:
    * **GET**: Obtém o histórico de mensagens entre o usuário logado e um amigo.
    * **POST**: Envia uma mensagem direta para um amigo. Se o amigo for a "EsquizoIA", o sistema também gera e salva uma resposta da IA.

### 4. **Frontend (`public/js/dashboard.js`)**

Este é o arquivo central da lógica do lado do cliente, responsável por:

* **Conexão com Socket.IO**: Gerencia a comunicação em tempo real para receber novas mensagens, notificações, status de usuários (online/offline) e atualizações de amizades.
* **Renderização Dinâmica**: Renderiza a interface do usuário, incluindo a lista de servidores (grupos), canais, amigos, mensagens e notificações, sem a necessidade de recarregar a página.
* **Gerenciamento de Estado**: Mantém o estado atual da aplicação, como o grupo ou amigo selecionado, o chat ativo e os dados do usuário logado.
* **Manipulação de Eventos**: Captura todas as interações do usuário, como cliques em botões, envio de formulários e digitação de mensagens, e envia as requisições apropriadas para o backend.
* **Notificações**: Exibe indicadores visuais para novas mensagens em grupos ou conversas diretas.

### 5. **Banco de Dados (`Modelo do banco de dados.pdf`)**

O esquema do banco de dados é relacional, projetado para suportar as funcionalidades da aplicação. As principais tabelas incluem:

* **Usuarios**: Armazena informações dos usuários, como nome, email, senha criptografada, foto de perfil e biografia.
* **Grupos**: Contém os detalhes dos grupos, incluindo nome, foto, se é privado e quem é o criador.
* **ParticipantesGrupo**: Tabela de junção que mapeia quais usuários pertencem a quais grupos.
* **Chats**: Armazena os canais de texto de cada grupo.
* **Mensagens**: Guarda todas as mensagens enviadas nos chats dos grupos, com o conteúdo criptografado.
* **Amizades**: Gerencia os relacionamentos de amizade entre os usuários, incluindo o status (pendente, aceito).
* **MensagensDiretas**: Salva as mensagens trocadas entre amigos, também com conteúdo criptografado.

## Como Executar o Projeto

1.  **Clone o Repositório**:
    ```bash
    git clone [https://github.com/JoaoZanelato/EsquizoCord.git](https://github.com/JoaoZanelato/EsquizoCord.git)
    cd EsquizoCord/TESTE
    ```

2.  **Instale as Dependências**:
    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente**:
    Crie um arquivo `.env` na pasta `TESTE/` e preencha as seguintes variáveis:
    ```env
    # Banco de Dados
    DB_HOST=seu_host
    DB_USER=seu_usuario
    DB_PASSWORD=sua_senha
    DB_NAME=seu_banco_de_dados
    DB_PORT=sua_porta
    DB_CA_CERT="seu_certificado_ca_em_uma_linha"

    # Cloudinary (para upload de imagens)
    CLOUDINARY_CLOUD_NAME=seu_cloud_name
    CLOUDINARY_API_KEY=sua_api_key
    CLOUDINARY_API_SECRET=sua_api_secret

    # Criptografia de Mensagens (deve ser uma string hexadecimal de 64 caracteres)
    ENCRYPTION_SECRET_KEY=sua_chave_secreta_de_64_caracteres_hex

    # E-mail (Nodemailer com Gmail)
    EMAIL_USER=seu_email@gmail.com
    EMAIL_PASS=sua_senha_de_app_do_gmail

    # Gemini API (para a IA)
    GEMINI_API_KEY=sua_api_key_do_gemini
    ```

4.  **Inicie o Servidor**:
    ```bash
    npm start
    ```

A aplicação estará disponível em `http://localhost:3000`.

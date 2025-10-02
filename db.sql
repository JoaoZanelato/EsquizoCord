-- Tabela de Temas
CREATE TABLE `temas` (
  `id_tema` int NOT NULL AUTO_INCREMENT,
  `nome_tema` varchar(100) NOT NULL,
  `bckgrnd_color` varchar(7) NOT NULL,
  `main_color` varchar(7) NOT NULL,
  PRIMARY KEY (`id_tema`)
);

-- Tabela de Usuários
-- --- INÍCIO DA ALTERAÇÃO ---
CREATE TABLE `usuarios` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `foto_perfil` varchar(255) DEFAULT NULL,
  `biografia` text,
  `status` ENUM('online', 'ausente', 'ocupado', 'invisivel') NOT NULL DEFAULT 'online',
  `status_personalizado` VARCHAR(128) DEFAULT NULL,
  `id_tema` int DEFAULT NULL,
  `data_cadastro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `token_verificacao` varchar(255) DEFAULT NULL,
  `email_verificado` tinyint(1) NOT NULL DEFAULT '0',
  `token_redefinir_senha` varchar(255) DEFAULT NULL,
  `expiracao_token_redefinir_senha` datetime DEFAULT NULL,
  `is_ia` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `uq_email` (`email`),
  UNIQUE KEY `uq_nome` (`nome`),
  KEY `fk_usuario_tema` (`id_tema`),
  CONSTRAINT `fk_usuario_tema` FOREIGN KEY (`id_tema`) REFERENCES `temas` (`id_tema`) ON DELETE SET NULL ON UPDATE CASCADE
);
-- --- FIM DA ALTERAÇÃO ---

-- Tabela de Amizades
CREATE TABLE `amizades` (
  `id_amizade` int NOT NULL AUTO_INCREMENT,
  `id_requisitante` int NOT NULL,
  `id_requisitado` int NOT NULL,
  `status` enum('pendente','aceite','bloqueada') NOT NULL DEFAULT 'pendente',
  `data_pedido` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_amizade`),
  UNIQUE KEY `uq_amizade` (`id_requisitante`, `id_requisitado`),
  KEY `fk_amizade_requisitado` (`id_requisitado`),
  CONSTRAINT `fk_amizade_requisitante` FOREIGN KEY (`id_requisitante`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `fk_amizade_requisitado` FOREIGN KEY (`id_requisitado`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
);

-- Tabela de Grupos
CREATE TABLE `grupos` (
  `id_grupo` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `is_private` tinyint(1) NOT NULL DEFAULT '0',
  `id_criador` int NOT NULL,
  PRIMARY KEY (`id_grupo`),
  KEY `fk_grupo_criador` (`id_criador`),
  CONSTRAINT `fk_grupo_criador` FOREIGN KEY (`id_criador`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
);

-- Tabela de Participantes do Grupo
CREATE TABLE `participantes_grupo` (
  `id_participacao` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `id_grupo` int NOT NULL,
  `data_entrada` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_participacao`),
  UNIQUE KEY `uq_membro_grupo` (`id_usuario`, `id_grupo`),
  KEY `fk_participante_grupo` (`id_grupo`),
  CONSTRAINT `fk_participante_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `fk_participante_grupo` FOREIGN KEY (`id_grupo`) REFERENCES `grupos` (`id_grupo`) ON DELETE CASCADE
);

-- Tabela de Cargos
CREATE TABLE `cargos` (
  `id_cargo` int NOT NULL AUTO_INCREMENT,
  `id_grupo` int NOT NULL,
  `nome_cargo` varchar(100) NOT NULL,
  `cor` varchar(7) DEFAULT '#99aab5',
  `permissoes` bigint unsigned NOT NULL DEFAULT '0',
  `icone` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_cargo`),
  KEY `fk_cargo_grupo` (`id_grupo`),
  CONSTRAINT `fk_cargo_grupo` FOREIGN KEY (`id_grupo`) REFERENCES `grupos` (`id_grupo`) ON DELETE CASCADE
);

-- Tabela de atribuição de Cargos aos Usuários
CREATE TABLE `cargos_usuario` (
  `id_cargo_usuario` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `id_cargo` int NOT NULL,
  PRIMARY KEY (`id_cargo_usuario`),
  UNIQUE KEY `uq_usuario_cargo` (`id_usuario`, `id_cargo`),
  KEY `fk_cargousuario_cargo` (`id_cargo`),
  CONSTRAINT `fk_cargousuario_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `fk_cargousuario_cargo` FOREIGN KEY (`id_cargo`) REFERENCES `cargos` (`id_cargo`) ON DELETE CASCADE
);

-- Tabela de Chats (Canais)
CREATE TABLE `chats` (
  `id_chat` int NOT NULL AUTO_INCREMENT,
  `id_grupo` int NOT NULL,
  `nome` varchar(255) NOT NULL DEFAULT 'geral',
  `tipo` ENUM('TEXTO', 'VOZ') NOT NULL DEFAULT 'TEXTO',
  PRIMARY KEY (`id_chat`),
  KEY `fk_chat_grupo` (`id_grupo`),
  CONSTRAINT `fk_chat_grupo` FOREIGN KEY (`id_grupo`) REFERENCES `grupos` (`id_grupo`) ON DELETE CASCADE
);

-- Tabela de Mensagens em Grupo
CREATE TABLE `mensagens` (
  `id_mensagem` int NOT NULL AUTO_INCREMENT,
  `id_chat` int NOT NULL,
  `id_usuario` int NOT NULL,
  `conteudo_criptografado` text NOT NULL,
  `nonce` text NOT NULL,
  `data_hora` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `id_mensagem_respondida` int DEFAULT NULL,
  `tipo` enum('texto','imagem') NOT NULL DEFAULT 'texto',
  `foi_editada` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_mensagem`),
  KEY `fk_msg_usuario` (`id_usuario`),
  KEY `fk_msg_chat` (`id_chat`),
  KEY `fk_msg_respondida` (`id_mensagem_respondida`),
  CONSTRAINT `fk_msg_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `fk_msg_chat` FOREIGN KEY (`id_chat`) REFERENCES `chats` (`id_chat`) ON DELETE CASCADE,
  CONSTRAINT `fk_msg_respondida` FOREIGN KEY (`id_mensagem_respondida`) REFERENCES `mensagens` (`id_mensagem`) ON DELETE SET NULL
);

-- Tabela de Mensagens Diretas
CREATE TABLE `mensagens_diretas` (
  `id_mensagem` int NOT NULL AUTO_INCREMENT,
  `id_remetente` int NOT NULL,
  `id_destinatario` int NOT NULL,
  `conteudo_criptografado` text NOT NULL,
  `nonce` text NOT NULL,
  `data_hora` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `id_mensagem_respondida` int DEFAULT NULL,
  `tipo` enum('texto','imagem') NOT NULL DEFAULT 'texto',
  `foi_editada` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_mensagem`),
  KEY `fk_dm_remetente` (`id_remetente`),
  KEY `fk_dm_destinatario` (`id_destinatario`),
  KEY `fk_dm_respondida` (`id_mensagem_respondida`),
  CONSTRAINT `fk_dm_remetente` FOREIGN KEY (`id_remetente`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `fk_dm_destinatario` FOREIGN KEY (`id_destinatario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `fk_dm_respondida` FOREIGN KEY (`id_mensagem_respondida`) REFERENCES `mensagens_diretas` (`id_mensagem`) ON DELETE SET NULL
);

-- Tabela de Banimentos
CREATE TABLE `banimentos` (
  `id_banimento` INT NOT NULL AUTO_INCREMENT,
  `id_grupo` INT NOT NULL,
  `id_usuario` INT NOT NULL,
  `data_banimento` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_banimento`),
  UNIQUE KEY `uq_banimento_grupo_usuario` (`id_grupo`, `id_usuario`),
  CONSTRAINT `fk_banimento_grupo` FOREIGN KEY (`id_grupo`) REFERENCES `grupos` (`id_grupo`) ON DELETE CASCADE,
  CONSTRAINT `fk_banimento_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
);

-- ÍNDICES PARA OTIMIZAÇÃO DE CONSULTAS
CREATE INDEX `idx_mensagens_chat_data` ON `mensagens` (`id_chat`, `data_hora`);
CREATE INDEX `idx_mensagens_diretas_conversa_data` ON `mensagens_diretas` (`id_remetente`, `id_destinatario`, `data_hora`);

-- INSERT DE IA
INSERT INTO usuarios (id_usuario, nome, email, senha, foto_perfil, biografia, email_verificado, is_ia)
VALUES (1, 'EsquizoIA', 'ia@esquizocord.com', '---', 'https://res.cloudinary.com/dgp3wwpv5/image/upload/v1751657687/ChatGPT_Image_4_de_jul._de_2025_15_57_28_dc5gud.png', 'Eu sou a inteligência artificial residente do EsquizoCord, pronta para ajudar!', 1, 1)
ON DUPLICATE KEY UPDATE
nome = 'EsquizoIA', 
email = 'ia@esquizocord.com', 
foto_perfil = 'https://res.cloudinary.com/dgp3wwpv5/image/upload/v1751657687/ChatGPT_Image_4_de_jul._de_2025_15_57_28_dc5gud.png',
biografia = 'Eu sou a inteligência artificial residente do EsquizoCord, pronta para ajudar!',
email_verificado = 1,
is_ia = 1;

-- INSERT DE TEMAS
INSERT INTO temas (id_tema, nome_tema, bckgrnd_color, main_color) VALUES
(1, 'Roxo Padrão', '#36393f', '#540B70'),
(2, 'Azul Meia-noite', '#2C3E50', '#3498DB'),
(3, 'Verde Floresta', '#2E403F', '#28A745'),
(4, 'Escuro Moderno', '#242526', '#3498DB'),
(5, 'Claro Minimalista', '#F0F2F5', '#0D6EFD')
ON DUPLICATE KEY UPDATE 
nome_tema=VALUES(nome_tema), 
bckgrnd_color=VALUES(bckgrnd_color), 
main_color=VALUES(main_color);
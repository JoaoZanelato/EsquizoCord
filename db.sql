-- defaultdb.Temas definição

CREATE TABLE "Temas" (
  "id_tema" int NOT NULL AUTO_INCREMENT,
  "nome_tema" varchar(100) NOT NULL,
  "bckgrnd_color" varchar(7) NOT NULL,
  "main_color" varchar(7) NOT NULL,
  PRIMARY KEY ("id_tema")
);


-- defaultdb.Usuarios definição

CREATE TABLE "Usuarios" (
  "id_usuario" int NOT NULL AUTO_INCREMENT,
  "Nome" varchar(255) NOT NULL,
  "Email" varchar(255) NOT NULL,
  "Senha" varchar(255) NOT NULL,
  "FotoPerfil" varchar(255) DEFAULT NULL,
  "Biografia" text,
  "id_tema" int DEFAULT NULL,
  "data_cadastro" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "token_verificacao" varchar(255) DEFAULT NULL,
  "email_verificado" tinyint(1) NOT NULL DEFAULT '0',
  "token_redefinir_senha" varchar(255) DEFAULT NULL,
  "expiracao_token_redefinir_senha" datetime DEFAULT NULL,
  "ChavePublica" text,
  "is_ia" tinyint(1) DEFAULT '0',
  PRIMARY KEY ("id_usuario"),
  UNIQUE KEY "Email" ("Email"),
  UNIQUE KEY "UQ_Nome" ("Nome"),
  KEY "fk_usuario_tema" ("id_tema"),
  CONSTRAINT "fk_usuario_tema" FOREIGN KEY ("id_tema") REFERENCES "Temas" ("id_tema") ON DELETE SET NULL ON UPDATE CASCADE
);


-- defaultdb.Amizades definição

CREATE TABLE "Amizades" (
  "id_amizade" int NOT NULL AUTO_INCREMENT,
  "id_utilizador_requisitante" int NOT NULL,
  "id_utilizador_requisitado" int NOT NULL,
  "status" enum('pendente','aceite','bloqueada') NOT NULL DEFAULT 'pendente',
  "data_pedido" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id_amizade"),
  UNIQUE KEY "amizade_unica" ("id_utilizador_requisitante","id_utilizador_requisitado"),
  KEY "id_utilizador_requisitado" ("id_utilizador_requisitado"),
  CONSTRAINT "Amizades_ibfk_1" FOREIGN KEY ("id_utilizador_requisitante") REFERENCES "Usuarios" ("id_usuario") ON DELETE CASCADE,
  CONSTRAINT "Amizades_ibfk_2" FOREIGN KEY ("id_utilizador_requisitado") REFERENCES "Usuarios" ("id_usuario") ON DELETE CASCADE
);


-- defaultdb.Grupos definição

CREATE TABLE "Grupos" (
  "id_grupo" int NOT NULL AUTO_INCREMENT,
  "Nome" varchar(255) NOT NULL,
  "Foto" varchar(255) DEFAULT NULL,
  "IsPrivate" tinyint(1) NOT NULL DEFAULT '0',
  "id_criador" int NOT NULL,
  PRIMARY KEY ("id_grupo"),
  KEY "id_criador" ("id_criador"),
  CONSTRAINT "Grupos_ibfk_1" FOREIGN KEY ("id_criador") REFERENCES "Usuarios" ("id_usuario")
);


-- defaultdb.MensagensDiretas definição

CREATE TABLE "MensagensDiretas" (
  "id_mensagem" int NOT NULL AUTO_INCREMENT,
  "id_remetente" int NOT NULL,
  "id_destinatario" int NOT NULL,
  "ConteudoCriptografado" text NOT NULL,
  "DataHora" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "Nonce" text NOT NULL,
  "id_mensagem_respondida" int DEFAULT NULL,
  PRIMARY KEY ("id_mensagem"),
  KEY "id_remetente" ("id_remetente"),
  KEY "id_destinatario" ("id_destinatario"),
  KEY "id_mensagem_respondida" ("id_mensagem_respondida"),
  CONSTRAINT "MensagensDiretas_ibfk_1" FOREIGN KEY ("id_remetente") REFERENCES "Usuarios" ("id_usuario"),
  CONSTRAINT "MensagensDiretas_ibfk_2" FOREIGN KEY ("id_destinatario") REFERENCES "Usuarios" ("id_usuario"),
  CONSTRAINT "MensagensDiretas_ibfk_3" FOREIGN KEY ("id_mensagem_respondida") REFERENCES "MensagensDiretas" ("id_mensagem") ON DELETE SET NULL
);


-- defaultdb.Moderadores definição

CREATE TABLE "Moderadores" (
  "id_moderador" int NOT NULL AUTO_INCREMENT,
  "id_usuario" int NOT NULL,
  "id_grupo" int NOT NULL,
  PRIMARY KEY ("id_moderador"),
  UNIQUE KEY "moderador_unico" ("id_usuario","id_grupo"),
  KEY "id_grupo" ("id_grupo"),
  CONSTRAINT "Moderadores_ibfk_1" FOREIGN KEY ("id_usuario") REFERENCES "Usuarios" ("id_usuario"),
  CONSTRAINT "Moderadores_ibfk_2" FOREIGN KEY ("id_grupo") REFERENCES "Grupos" ("id_grupo")
);


-- defaultdb.ParticipantesGrupo definição

CREATE TABLE "ParticipantesGrupo" (
  "id_participacao" int NOT NULL AUTO_INCREMENT,
  "id_usuario" int NOT NULL,
  "id_grupo" int NOT NULL,
  "data_entrada" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id_participacao"),
  UNIQUE KEY "membro_unico" ("id_usuario","id_grupo"),
  KEY "id_grupo" ("id_grupo"),
  CONSTRAINT "ParticipantesGrupo_ibfk_1" FOREIGN KEY ("id_usuario") REFERENCES "Usuarios" ("id_usuario"),
  CONSTRAINT "ParticipantesGrupo_ibfk_2" FOREIGN KEY ("id_grupo") REFERENCES "Grupos" ("id_grupo")
);


-- defaultdb.Administradores definição

CREATE TABLE "Administradores" (
  "id_admin" int NOT NULL AUTO_INCREMENT,
  "id_usuario" int NOT NULL,
  "id_grupo" int NOT NULL,
  PRIMARY KEY ("id_admin"),
  UNIQUE KEY "admin_unico" ("id_usuario","id_grupo"),
  KEY "id_grupo" ("id_grupo"),
  CONSTRAINT "Administradores_ibfk_1" FOREIGN KEY ("id_usuario") REFERENCES "Usuarios" ("id_usuario"),
  CONSTRAINT "Administradores_ibfk_2" FOREIGN KEY ("id_grupo") REFERENCES "Grupos" ("id_grupo")
);


-- defaultdb.Chats definição

CREATE TABLE "Chats" (
  "id_chat" int NOT NULL AUTO_INCREMENT,
  "id_grupo" int NOT NULL,
  "Nome" varchar(255) NOT NULL DEFAULT 'geral',
  PRIMARY KEY ("id_chat"),
  KEY "id_grupo" ("id_grupo"),
  CONSTRAINT "Chats_ibfk_1" FOREIGN KEY ("id_grupo") REFERENCES "Grupos" ("id_grupo") ON DELETE CASCADE
);


-- defaultdb.ChavesGrupo definição

CREATE TABLE "ChavesGrupo" (
  "id_chave" int NOT NULL AUTO_INCREMENT,
  "id_grupo" int NOT NULL,
  "id_usuario" int NOT NULL,
  "ChaveCriptografada" text NOT NULL,
  PRIMARY KEY ("id_chave"),
  UNIQUE KEY "id_grupo" ("id_grupo","id_usuario"),
  KEY "id_usuario" ("id_usuario"),
  CONSTRAINT "ChavesGrupo_ibfk_1" FOREIGN KEY ("id_grupo") REFERENCES "Grupos" ("id_grupo") ON DELETE CASCADE,
  CONSTRAINT "ChavesGrupo_ibfk_2" FOREIGN KEY ("id_usuario") REFERENCES "Usuarios" ("id_usuario") ON DELETE CASCADE
);


-- defaultdb.Mensagens definição

CREATE TABLE "Mensagens" (
  "id_mensagem" int NOT NULL AUTO_INCREMENT,
  "ConteudoCriptografado" text NOT NULL,
  "DataHora" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "id_usuario" int NOT NULL,
  "id_chat" int NOT NULL,
  "Nonce" text NOT NULL,
  "id_mensagem_respondida" int DEFAULT NULL,
  PRIMARY KEY ("id_mensagem"),
  KEY "id_usuario" ("id_usuario"),
  KEY "id_chat" ("id_chat"),
  KEY "id_mensagem_respondida" ("id_mensagem_respondida"),
  CONSTRAINT "Mensagens_ibfk_1" FOREIGN KEY ("id_usuario") REFERENCES "Usuarios" ("id_usuario"),
  CONSTRAINT "Mensagens_ibfk_2" FOREIGN KEY ("id_chat") REFERENCES "Chats" ("id_chat"),
  CONSTRAINT "Mensagens_ibfk_3" FOREIGN KEY ("id_mensagem_respondida") REFERENCES "Mensagens" ("id_mensagem") ON DELETE SET NULL
); 
INSERT INTO defaultdb.Usuarios
(id_usuario, Nome, Email, Senha, FotoPerfil, Biografia, id_tema, data_cadastro, token_verificacao, email_verificado, token_redefinir_senha, expiracao_token_redefinir_senha, ChavePublica, is_ia)
VALUES(1, 'EsquizoIA', 'ia@esquizocord.com', 'senha_super_segura_para_ia_que_nao_faz_login', 'https://res.cloudinary.com/dgp3wwpv5/image/upload/v1751657687/ChatGPT_Image_4_de_jul._de_2025_15_57_28_dc5gud.png', 'Eu sou a inteligência artificial residente do EsquizoCord, pronta para ajudar!', NULL, '2025-07-04 13:54:47', NULL, 1, NULL, NULL, NULL, 1);

INSERT INTO defaultdb.Temas
(id_tema, nome_tema, bckgrnd_color, main_color)
VALUES(1, 'Roxo Padrão', '#36393f', '#540B70');
INSERT INTO defaultdb.Temas
(id_tema, nome_tema, bckgrnd_color, main_color)
VALUES(2, 'Azul Meia-noite', '#2C3E50', '#3498DB');
INSERT INTO defaultdb.Temas
(id_tema, nome_tema, bckgrnd_color, main_color)
VALUES(3, 'Verde Floresta', '#2E403F', '#28A745');
INSERT INTO defaultdb.Temas
(id_tema, nome_tema, bckgrnd_color, main_color)
VALUES(4, 'Escuro Moderno', '#242526', '#3498DB');
INSERT INTO defaultdb.Temas
(id_tema, nome_tema, bckgrnd_color, main_color)
VALUES(5, 'Claro Minimalista', '#F0F2F5', '#0D6EFD');

-- Tabela de Cargos (Roles)
CREATE TABLE `Cargos` (
  `id_cargo` INT NOT NULL AUTO_INCREMENT,
  `id_grupo` INT NOT NULL,
  `nome_cargo` VARCHAR(100) NOT NULL,
  `cor` VARCHAR(7) DEFAULT '#99aab5',
  `permissoes` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_cargo`),
  KEY `fk_cargo_grupo` (`id_grupo`),
  CONSTRAINT `fk_cargo_grupo` FOREIGN KEY (`id_grupo`) REFERENCES `Grupos` (`id_grupo`) ON DELETE CASCADE
);

-- Tabela de junção para atribuir cargos aos usuários
CREATE TABLE `CargosUsuario` (
  `id_cargo_usuario` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `id_cargo` INT NOT NULL,
  PRIMARY KEY (`id_cargo_usuario`),
  UNIQUE KEY `usuario_cargo_unico` (`id_usuario`, `id_cargo`),
  KEY `fk_cargousuario_cargo` (`id_cargo`),
  CONSTRAINT `fk_cargousuario_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `Usuarios` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `fk_cargousuario_cargo` FOREIGN KEY (`id_cargo`) REFERENCES `Cargos` (`id_cargo`) ON DELETE CASCADE
);
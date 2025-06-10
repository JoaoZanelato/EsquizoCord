const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10; // Fator de custo para a criptografia

/* GET home page */
router.get('/', function(req, res, next) {
  res.render('Home');
});

/* GET Login page. */
router.get('/login', function(req, res, next) {
  res.render('Login');
});

/* GET Cadastro page. */
router.get('/cadastro', function(req, res, next) {
  res.render('Cadastro');
});

/* ======================================================= */
/* ROTA PARA PROCESSAR O CADASTRO E SALVAR NO BANCO DE DADOS */
/* ======================================================= */
router.post('/cadastro', async function(req, res, next) {
  // 1. Pega os dados enviados pelo formulário
  const { nome, email, senha, confirmar_senha } = req.body;

  // 2. Validação básica: checa se as senhas são iguais
  if (senha !== confirmar_senha) {
    return res.status(400).send("Erro: As senhas não conferem.");
  }

  try {
    // 3. Criptografa a senha do usuário antes de salvar
    const senhaCriptografada = await bcrypt.hash(senha, saltRounds);

    // 4. Acessa o pool de conexões que o app.js disponibilizou em req.db
    const pool = req.db;

    // 5. Prepara o comando SQL para inserir o novo usuário
    const sql = "INSERT INTO Usuarios (Nome, Email, Senha) VALUES (?, ?, ?)";
    
    // 6. Executa o comando, passando os dados de forma segura
    await pool.query(sql, [nome, email, senhaCriptografada]);

    console.log(`Usuário ${nome} cadastrado com sucesso!`);

    // 7. Se tudo deu certo, redireciona o usuário para a página de login
    res.redirect('/login');

  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    next(error);
  }
});

/* ======================================================= */
/* ROTA PARA PROCESSAR O LOGIN E AUTENTICAR O USUÁRIO      */
/* ======================================================= */
router.post('/login', async function(req, res, next) {
  // 1. Pega os dados do formulário de login
  const { email, senha } = req.body;

  try {
    // 2. Acessa o pool de conexões
    const pool = req.db;

    // 3. Procura pelo usuário no banco de dados usando o email
    const sql = "SELECT * FROM Usuarios WHERE Email = ?";
    const [rows] = await pool.query(sql, [email]);

    // 4. Verifica se o usuário foi encontrado
    if (rows.length === 0) {
      // Se não encontrou, envia um erro. Não seja específico (segurança)
      return res.status(401).send("Erro: Email ou senha inválidos.");
    }

    const user = rows[0];

    // 5. Compara a senha enviada com a senha criptografada no banco
    const match = await bcrypt.compare(senha, user.Senha);

    if (match) {
      // 6. Se as senhas batem, o login é um sucesso!
      console.log(`Usuário ${user.Nome} logado com sucesso!`);
      // Futuramente, você irá criar uma sessão aqui. Por agora, redirecionamos.
      res.redirect('/dashboard');
    } else {
      // Se as senhas não batem, envia o mesmo erro genérico
      return res.status(401).send("Erro: Email ou senha inválidos.");
    }

  } catch (error) {
    console.error("Erro no processo de login:", error);
    next(error);
  }
});


/* GET Dashboard page. */
router.get('/dashboard', function(req, res, next) {
  // Idealmente, esta rota seria protegida, acessível apenas para usuários logados.
  res.render('Dashboard');
});

module.exports = router;

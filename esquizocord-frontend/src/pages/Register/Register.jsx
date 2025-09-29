// src/pages/Register/Register.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Importar o hook
import {
  RegisterPageContainer,
  RegisterBox,
  RegisterTitle,
  RegisterFeedbackMessage,
  RegisterForm,
  RegisterLabel,
  RegisterInput,
  RegisterButton,
  RegisterBackLink,
} from './styles.js';

const Register = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register } = useAuth(); // <-- Obter a função correta do contexto
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (senha !== confirmarSenha) {
      setError('As senhas não conferem.');
      return;
    }

    try {
      // Usar a função 'register' do contexto
      const response = await register(nome, email, senha, confirmarSenha);
      setSuccess(response.data.message + ' Você será redirecionado para o login.');
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao tentar fazer o cadastro.');
    }
  };

  return (
    <RegisterPageContainer>
      <RegisterBox>
        <RegisterTitle>Crie sua Conta</RegisterTitle>
        {error && <RegisterFeedbackMessage><p>{error}</p></RegisterFeedbackMessage>}
        {success && <RegisterFeedbackMessage style={{backgroundColor: 'rgba(67, 181, 129, 0.2)', borderLeftColor: 'var(--green-accent)'}}><p>{success}</p></RegisterFeedbackMessage>}

        <RegisterForm onSubmit={handleSubmit}>
          <RegisterLabel htmlFor="nome">Nome de Usuário:</RegisterLabel>
          <RegisterInput
            type="text"
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            autoComplete="username"
          />

          <RegisterLabel htmlFor="email">Email:</RegisterLabel>
          <RegisterInput
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <RegisterLabel htmlFor="senha">Senha:</RegisterLabel>
          <RegisterInput
            type="password"
            id="senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            autoComplete="new-password"
          />

          <RegisterLabel htmlFor="confirmar_senha">Confirmar Senha:</RegisterLabel>
          <RegisterInput
            type="password"
            id="confirmar_senha"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            required
            autoComplete="new-password"
          />

          <RegisterButton type="submit" disabled={!!success}>Cadastrar</RegisterButton>
        </RegisterForm>
        <RegisterBackLink as={Link} to="/login">
          Já tem uma conta? Faça Login
        </RegisterBackLink>
      </RegisterBox>
    </RegisterPageContainer>
  );
};

export default Register;
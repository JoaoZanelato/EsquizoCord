// src/pages/Login/Login.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import {
  LoginPageContainer,
  LoginBox,
  Title,
  FeedbackMessage,
  Form,
  Label,
  Input,
  Button,
  BackLink,
} from './styles.js';

// Configura o Axios para se comunicar com sua API
const apiClient = axios.create({
  baseURL: 'http://localhost:PORTA_DO_SEU_BACKEND', // Ex: http://localhost:8000
  withCredentials: true, // Importante para o gerenciamento de sessão
});

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await apiClient.post('/login', {
        email: email,
        senha: password, // Note que o name no EJS era "senha"
      });
      // Se o login for bem-sucedido, o backend retorna os dados do usuário
      // Você pode salvar esses dados em um Context API ou outra forma de estado global
      // e redirecionar para o dashboard.
      console.log('Login bem-sucedido:', response.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao tentar fazer login.');
    }
  };

  return (
    <LoginPageContainer>
      <LoginBox>
        <Title>Login</Title>
        {error && (
          <FeedbackMessage>
            <p>{error}</p>
          </FeedbackMessage>
        )}
        <Form onSubmit={handleSubmit}>
          <Label htmlFor="email">Email:</Label>
          <Input
            type="email" /* */
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Digite seu email"
            required
          />
          <Label htmlFor="password">Senha:</Label>
          <Input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Digite sua senha"
            required
          />
          {/* O link "Esqueceu a senha?" pode ser um <Link> do react-router-dom */}
          <div style={{ textAlign: 'right', marginTop: '-15px', marginBottom: '20px' }}>
            <Link to="/esqueceu-senha" style={{ color: '#e0c8e6', textDecoration: 'none', fontSize: '14px' }}>
              Esqueceu a senha?
            </Link>
          </div>
          <Button type="submit">Entrar</Button>
        </Form>
        <BackLink as={Link} to="/">Voltar para a Home</BackLink> {/* */}
      </LoginBox>
    </LoginPageContainer>
  );
};

export default Login;
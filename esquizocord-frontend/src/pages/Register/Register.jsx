// src/pages/Register/Register.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext/NotificationContext"; // 1. IMPORTAR O HOOK DE NOTIFICAÇÃO
import {
  RegisterPageContainer,
  RegisterBox,
  RegisterTitle,
  RegisterFeedbackMessage, // Manteremos para o caso de erros de validação local
  RegisterForm,
  RegisterLabel,
  RegisterInput,
  RegisterButton,
  RegisterBackLink,
} from "./styles.js";

const Register = () => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [error, setError] = useState(""); // Para erros de validação local (ex: senhas não conferem)
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const { addNotification } = useNotification(); // 2. USAR O HOOK
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (senha !== confirmarSenha) {
      setError("As senhas não conferem.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await register(nome, email, senha, confirmarSenha);
      // 3. USAR A NOTIFICAÇÃO DE SUCESSO
      addNotification(response.data.message, "success");

      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      // 4. USAR A NOTIFICAÇÃO DE ERRO PARA ERROS DA API
      const errorMessage =
        err.response?.data?.message || "Erro ao tentar fazer o cadastro.";
      addNotification(errorMessage, "error");
      setIsSubmitting(false);
    }
  };

  return (
    <RegisterPageContainer>
      <RegisterBox>
        <RegisterTitle>Crie sua Conta</RegisterTitle>
        {/* O feedback de erro local ainda é útil para validações do lado do cliente */}
        {error && (
          <RegisterFeedbackMessage>
            <p>{error}</p>
          </RegisterFeedbackMessage>
        )}

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

          <RegisterLabel htmlFor="confirmar_senha">
            Confirmar Senha:
          </RegisterLabel>
          <RegisterInput
            type="password"
            id="confirmar_senha"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            required
            autoComplete="new-password"
          />

          <RegisterButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Aguarde..." : "Cadastrar"}
          </RegisterButton>
        </RegisterForm>
        <RegisterBackLink as={Link} to="/login">
          Já tem uma conta? Faça Login
        </RegisterBackLink>
      </RegisterBox>
    </RegisterPageContainer>
  );
};

export default Register;

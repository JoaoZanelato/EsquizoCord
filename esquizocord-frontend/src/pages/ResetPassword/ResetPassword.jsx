// src/pages/ResetPassword/ResetPassword.jsx
import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import apiClient from "../../services/api.js";
import {
  ForgotPasswordContainer,
  AuthBox,
  Title,
  Form,
  InputGroup,
  Label,
  Input,
  Button,
  AuthLinks,
  AuthLink,
  FeedbackMessage,
} from "./styles.js";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const token = searchParams.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (!token) {
      setError("Token de redefinição inválido ou ausente.");
      return;
    }

    try {
      const response = await apiClient.post("/redefinir-senha", {
        token,
        senha: password,
        confirmar_senha: confirmPassword,
      });
      setMessage(response.data.message + " Você será redirecionado em breve.");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(
        err.response?.data?.message || "Ocorreu um erro ao redefinir a senha."
      );
    }
  };

  return (
    <ForgotPasswordContainer>
      <AuthBox>
        <Title>Crie a sua nova senha</Title>

        {message && (
          <FeedbackMessage success>
            <p>{message}</p>
          </FeedbackMessage>
        )}
        {error && (
          <FeedbackMessage>
            <p>{error}</p>
          </FeedbackMessage>
        )}

        {!message && (
          <Form onSubmit={handleSubmit}>
            <InputGroup>
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </InputGroup>
            <InputGroup>
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </InputGroup>
            <Button type="submit">Redefinir Senha</Button>
          </Form>
        )}

        <AuthLinks>
          <AuthLink as={Link} to="/login">
            <i className="fas fa-arrow-left" style={{ marginRight: "8px" }}></i>
            Voltar para o Login
          </AuthLink>
        </AuthLinks>
      </AuthBox>
    </ForgotPasswordContainer>
  );
};

export default ResetPassword;

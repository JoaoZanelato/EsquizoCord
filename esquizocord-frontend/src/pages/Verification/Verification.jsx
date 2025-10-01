// src/pages/Verification/Verification.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import apiClient from "../../services/api";
import {
  VerificationPageContainer,
  VerificationBox,
  Icon,
  Title,
  Message,
  ActionButton,
} from "./styles";

const Verification = () => {
  const [searchParams] = useSearchParams();
  // Novo estado 'idle' para aguardar a ação do utilizador
  const [status, setStatus] = useState("idle"); // 'idle', 'loading', 'success', 'error'
  const [message, setMessage] = useState("");
  const token = searchParams.get("token");

  // Verifica o token na URL assim que a página carrega
  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage(
        "Token de verificação não encontrado. O link pode estar quebrado ou incompleto."
      );
    }
  }, [token]);

  // A função de verificação agora é chamada por um evento de clique
  const handleVerification = useCallback(async () => {
    if (!token) return;

    setStatus("loading");
    setMessage("A validar a sua conta...");

    try {
      const response = await apiClient.get(`/verificar-email?token=${token}`);
      setStatus("success");
      setMessage(response.data.message);
    } catch (error) {
      setStatus("error");
      setMessage(
        error.response?.data?.message ||
          "Ocorreu uma falha ao verificar o seu e-mail."
      );
    }
  }, [token]);

  const renderContent = () => {
    switch (status) {
      case "success":
        return (
          <>
            <Icon className="fas fa-check-circle" status="success" />
            <Title>E-mail Verificado com Sucesso!</Title>
            <Message>{message}</Message>
            <ActionButton to="/login">Ir para o Login</ActionButton>
          </>
        );
      case "error":
        return (
          <>
            <Icon className="fas fa-times-circle" status="error" />
            <Title>Falha na Verificação</Title>
            <Message>{message}</Message>
            <ActionButton to="/cadastro">Voltar ao Cadastro</ActionButton>
          </>
        );
      case "loading":
        return (
          <>
            <Icon className="fas fa-spinner fa-spin" status="loading" />
            <Title>A Validar...</Title>
            <Message>{message}</Message>
          </>
        );
      case "idle":
      default:
        return (
          <>
            <Icon className="fas fa-envelope-open-text" status="idle" />
            <Title>Verifique a sua Conta</Title>
            <Message>
              Clique no botão abaixo para confirmar o seu endereço de e-mail e
              ativar a sua conta.
            </Message>
            <ActionButton as="button" onClick={handleVerification}>
              Verificar E-mail
            </ActionButton>
          </>
        );
    }
  };

  return (
    <VerificationPageContainer>
      <VerificationBox>{renderContent()}</VerificationBox>
    </VerificationPageContainer>
  );
};

export default Verification;

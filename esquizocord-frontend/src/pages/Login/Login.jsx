// src/pages/Login/Login.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotification } from "../../context/NotificationContext/NotificationContext.jsx";
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
} from "./styles.js";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addNotification } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Erro ao tentar fazer login.";
      addNotification(errorMessage, "error");
    }
  };

  return (
    <LoginPageContainer>
      <LoginBox>
        <Title>Login</Title>
        <Form onSubmit={handleSubmit}>
          <Label htmlFor="email">Email:</Label>
          <Input
            type="email" /* */
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Digite seu email"
            required
            autoComplete="email"
          />
          <Label htmlFor="password">Senha:</Label>
          <Input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Digite sua senha"
            autoComplete="current-password"
            required
          />
          {/* O link "Esqueceu a senha?" pode ser um <Link> do react-router-dom */}
          <div
            style={{
              textAlign: "right",
              marginTop: "-15px",
              marginBottom: "20px",
            }}
          >
            <Link
              to="/esqueceu-senha"
              style={{
                color: "#e0c8e6",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              Esqueceu a senha?
            </Link>
          </div>
          <Button type="submit">Entrar</Button>
        </Form>
        <BackLink as={Link} to="/">
          Voltar para a Home
        </BackLink>{" "}
        {/* */}
      </LoginBox>
    </LoginPageContainer>
  );
};

export default Login;

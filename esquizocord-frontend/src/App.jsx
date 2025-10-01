// src/App.jsx

import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { themes } from "./styles/themes.js";
import GlobalStyles from "./styles/GlobalStyles.js";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";

// Componentes e Páginas
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home/Home.jsx";
import Login from "./pages/Login/Login.jsx";
import Register from "./pages/Register/Register.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import Verification from "./pages/Verification/Verification.jsx";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword/ResetPassword.jsx"; // <-- Importar o novo componente
import Settings from "./pages/Settings/Settings.jsx";

// Este componente agora lida apenas com a lógica de temas e rotas
function ThemedApp() {
  const { user } = useAuth();
  const currentTheme =
    user && themes[user.id_tema] ? themes[user.id_tema] : themes[1];

  return (
    <ThemeProvider theme={currentTheme}>
      <GlobalStyles />
      <SocketProvider>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />
          <Route path="/esqueceu-senha" element={<ForgotPassword />} />
          <Route path="/redefinir-senha" element={<ResetPassword />} />{" "}
          {/* <-- Adicionar a nova rota */}
          <Route path="/verificar-email" element={<Verification />} />
          {/* Rotas Protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </SocketProvider>
    </ThemeProvider>
  );
}

// O componente App principal agora organiza os provedores de contexto e o roteador
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemedApp />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

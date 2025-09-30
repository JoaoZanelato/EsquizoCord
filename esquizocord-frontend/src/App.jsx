// src/App.jsx

import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { themes } from "./styles/themes";
import GlobalStyles from "./styles/GlobalStyles";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";

// Componentes e Páginas
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import Verification from "./pages/Verification/Verification";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import Settings from "./pages/Settings/Settings";

// Este componente agora lida apenas com a lógica de temas e rotas
function ThemedApp() {
  const { user } = useAuth();
  const currentTheme = (user && themes[user.id_tema]) ? themes[user.id_tema] : themes[1];

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
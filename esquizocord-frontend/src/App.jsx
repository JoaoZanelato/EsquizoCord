// src/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { themes } from './styles/themes';
import GlobalStyles from './styles/GlobalStyles';
import { AuthProvider } from './context/AuthContext';

// Componentes e Páginas
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Verification from './pages/Verification/Verification';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword'

function App() {
  const currentTheme = themes[1];

  return (
    <ThemeProvider theme={currentTheme}>
      <GlobalStyles />
      <BrowserRouter>   
        <AuthProvider>  
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Register />} />
            <Route path="/esqueceu-senha" element={<ForgotPassword />} />
            {/* Rota Única de Verificação */}
              <Route path="/verificar-email" element={<Verification />} />
            {/* Rotas Protegidas */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
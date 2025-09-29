// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { themes } from './styles/themes';
import GlobalStyles from './styles/GlobalStyles';
import { AuthProvider } from './context/AuthContext';

// Componentes e Páginas
import ProtectedRoute from './components/ProtectedRoute'; // <-- 1. Importar o porteiro
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Dashboard from './pages/Dashboard/Dashboard'; // <-- 2. Importar o Dashboard

function App() {
  const currentTheme = themes[1];

  return (
    <ThemeProvider theme={currentTheme}>
      <GlobalStyles />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Register />} />

            {/* Rotas Protegidas */}
            <Route element={<ProtectedRoute />}> {/* <-- 3. Envolver as rotas protegidas */}
              <Route path="/dashboard" element={<Dashboard />} />
              {/* Outras rotas protegidas, como /configuracao, podem ir aqui dentro */}
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
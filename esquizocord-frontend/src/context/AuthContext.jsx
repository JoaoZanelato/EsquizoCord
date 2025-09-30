// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../services/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await apiClient.get('/session');
        if (response.data && response.data.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.log('Nenhuma sessão ativa encontrada.');
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email, senha) => {
    const response = await apiClient.post('/login', { email, senha });
    setUser(response.data);
    return response;
  };

  const register = async (nome, email, senha, confirmar_senha) => {
    return apiClient.post('/cadastro', {
      nome,
      email,
      senha,
      confirmar_senha,
    });
  };

  const logout = async () => {
    await apiClient.post('/sair');
    setUser(null);
    navigate('/login');
  };

  // ---- INÍCIO DA ALTERAÇÃO ----
  // Adicione 'setUser' ao valor compartilhado
  const value = { user, setUser, login, logout, register, loading };
  // ---- FIM DA ALTERAÇÃO ----

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
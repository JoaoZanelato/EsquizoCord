// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../services/api'; // Vamos criar este arquivo a seguir
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Para verificar a sessão inicial
  const navigate = useNavigate();

  useEffect(() => {
    // Verifica se já existe uma sessão no backend quando a app carrega
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
    // A função de login agora vai atualizar nosso estado global
    const response = await apiClient.post('/login', { email, senha });
    setUser(response.data);
    return response;
  };

  const logout = async () => {
    await apiClient.post('/sair');
    setUser(null);
    navigate('/login');
  };

  // O valor que será partilhado com todos os componentes
  const value = { user, login, logout, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar o contexto facilmente
export const useAuth = () => {
  return useContext(AuthContext);
};
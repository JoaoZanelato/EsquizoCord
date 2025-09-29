// src/pages/Dashboard/Dashboard.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext'; // Importamos para aceder ao 'user' e 'logout'

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Bem-vindo ao Dashboard, {user?.Nome}!</h1>
      <p>O seu ID de utilizador é: {user?.id_usuario}</p>
      <button onClick={logout}>Sair da Conta</button>
    </div>
  );
};

export default Dashboard;
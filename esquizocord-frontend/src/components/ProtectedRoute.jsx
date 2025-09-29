// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { user } = useAuth();

  // Se não houver utilizador, redireciona para a página de login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Se houver um utilizador, renderiza o componente filho (a página protegida)
  return <Outlet />;
};

export default ProtectedRoute;
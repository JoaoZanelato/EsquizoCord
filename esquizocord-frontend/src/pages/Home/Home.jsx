// src/pages/Home/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div>
      <h1>Bem-vindo ao EsquizoCord</h1>
      <nav>
        <Link to="/login">Login</Link>
        <br />
        <Link to="/cadastro">Cadastre-se</Link>
      </nav>
    </div>
  );
};

export default Home;
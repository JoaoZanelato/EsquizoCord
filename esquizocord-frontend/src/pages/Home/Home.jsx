// src/pages/Home/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  HomeContainer,
  ContentBox,
  Logo,
  Title,
  Subtitle,
  ButtonGroup,
  Button
} from './styles';

// Importe o 'as' do styled-components para usar com o Link do react-router-dom
import styled from 'styled-components';

const StyledLink = styled(Button)``; // Cria um componente de Link estilizado

const Home = () => {
  return (
    <HomeContainer>
      <ContentBox>
        <Logo src="/images/logo.png" alt="Logo do EsquizoCord" />
        <Title>Bem-vindo ao EsquizoCord</Title>
        <Subtitle>
          Sua nova plataforma de comunicação. Conecte-se agora!
        </Subtitle>
        <ButtonGroup>
          <StyledLink as={Link} to="/login" primary="true">Login</StyledLink>
          <StyledLink as={Link} to="/cadastro">Cadastre-se</StyledLink>
        </ButtonGroup>
      </ContentBox>
    </HomeContainer>
  );
};

export default Home;
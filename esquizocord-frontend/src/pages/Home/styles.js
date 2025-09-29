// src/pages/Home/styles.js
import styled from 'styled-components';

export const HomeContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-image: url("/images/background.png"); // Agora a imagem será encontrada
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
`;

export const ContentBox = styled.div`
  text-align: center;
  background-color: rgba(84, 11, 112, 0.952);
  color: #fff1f1;
  padding: 40px 50px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 90%;
`;

export const Logo = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  margin: 0 auto 25px auto;
  object-fit: cover;
`;

export const Title = styled.h1`
  margin-bottom: 10px;
  font-size: 28px;
  font-weight: 600;
`;

export const Subtitle = styled.p`
  margin-bottom: 30px;
  color: #9757a7;
  font-size: 16px;
`;

export const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

export const Button = styled.a`
  display: inline-block;
  text-decoration: none;
  font-size: 16px;
  font-weight: 600;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: ${({ primary }) => (primary ? '#cc00ff' : '#660080')};
  color: white;

  &:hover {
    background-color: ${({ primary }) => (primary ? '#955ca3' : '#572364')};
    transform: translateY(-2px);
  }
`;
// src/pages/Verification/styles.js
import styled from 'styled-components';
import { Link } from 'react-router-dom';

export const VerificationPageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-image: url('/images/senha-background.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
`;

export const VerificationBox = styled.div`
  background-color: ${({ theme }) => theme.backgroundSecondary};
  padding: 40px;
  border-radius: 8px;
  text-align: center;
  max-width: 450px;
  width: 90%;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
`;

export const Icon = styled.i`
  font-size: 5rem;
  margin-bottom: 20px;
  color: ${({ theme, status }) => {
    if (status === 'success') return theme.greenAccent;
    if (status === 'error') return theme.redDanger;
    return theme.textMuted; // Cor para o estado de loading
  }};
`;

export const Title = styled.h1`
  color: ${({ theme }) => theme.headerPrimary};
  margin-bottom: 15px;
`;

export const Message = styled.p`
  color: ${({ theme }) => theme.textNormal};
  font-size: 1.1rem;
  margin-bottom: 30px;
  line-height: 1.5;
`;

export const ActionButton = styled(Link)`
  display: inline-block;
  background-color: ${({ theme }) => theme.brandExperiment};
  color: white;
  padding: 12px 30px;
  border-radius: 5px;
  text-decoration: none;
  font-weight: bold;
  transition: background-color 0.3s;
  border: none;
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.brandHover};
  }
`;

export const ResendLink = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.purpleAccent};
  cursor: pointer;
  font-size: 14px;
  margin-top: 15px;
  padding: 5px;

  &:hover {
    text-decoration: underline;
  }
`;

export const Input = styled.input`
  width: 100%;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid ${({ theme }) => theme.backgroundTertiary};
  background-color: ${({ theme }) => theme.backgroundTertiary};
  color: ${({ theme }) => theme.textNormal};
  font-size: 16px;
  margin-top: 20px;
  margin-bottom: 10px;
`;
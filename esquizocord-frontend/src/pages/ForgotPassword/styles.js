// src/pages/ForgotPassword/styles.js
import styled from 'styled-components';
import { Link } from 'react-router-dom';

export const ForgotPasswordContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-image: url('/images/senha-background.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
`;

export const AuthBox = styled.div`
  background-color: ${({ theme }) => theme.backgroundSecondary};
  padding: 32px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
  text-align: center;
`;

export const Title = styled.h2`
  color: ${({ theme }) => theme.headerPrimary};
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 24px;
`;

export const Subtitle = styled.p`
  color: ${({ theme }) => theme.textMuted};
  margin-bottom: 24px;
`;

export const Form = styled.form`
    margin-top: 24px;
`;

export const InputGroup = styled.div`
  margin-bottom: 20px;
  text-align: left;
`;

export const Label = styled.label`
  display: block;
  color: ${({ theme }) => theme.textMuted};
  font-weight: bold;
  font-size: 12px;
  margin-bottom: 8px;
  text-transform: uppercase;
`;

export const Input = styled.input`
  width: 100%;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid ${({ theme }) => theme.backgroundTertiary};
  background-color: ${({ theme }) => theme.backgroundTertiary};
  color: ${({ theme }) => theme.textNormal};
  font-size: 16px;
`;

export const Button = styled.button`
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.brandExperiment};
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.brandHover};
  }
`;

export const AuthLinks = styled.div`
  margin-top: 24px;
`;

export const AuthLink = styled(Link)`
  color: ${({ theme }) => theme.purpleAccent};
  text-decoration: none;
  font-size: 14px;

  &:hover {
    text-decoration: underline;
  }
`;

export const FeedbackMessage = styled.div`
    padding: 10px;
    margin-bottom: 20px;
    border-radius: 5px;
    background-color: ${({ success, theme }) => success ? 'rgba(67, 181, 129, 0.2)' : 'rgba(255, 0, 0, 0.2)'};
    border-left: 4px solid ${({ success, theme }) => success ? theme.greenAccent : theme.redDanger};
    color: #fff;
    text-align: center;
    p {
        margin: 0;
        font-weight: 500;
    }
`;
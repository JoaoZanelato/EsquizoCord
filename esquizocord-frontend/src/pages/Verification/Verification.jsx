// src/pages/Verification/Verification.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import apiClient from '../../services/api';
import {
  VerificationPageContainer,
  VerificationBox,
  Icon,
  Title,
  Message,
  ActionButton,
  ResendLink,
  Input
} from './styles';

const Verification = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('A validar a sua conta...');
  
  // Estados para a funcionalidade de reenvio
  const [showResend, setShowResend] = useState(false);
  const [email, setEmail] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [isResending, setIsResending] = useState(false);


  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Token de verificação não encontrado. Se o link veio do seu e-mail, pode estar quebrado.');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await apiClient.get(`/verificar-email?token=${token}`);
        setStatus('success');
        setMessage(response.data.message);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Ocorreu uma falha ao verificar o seu e-mail.');
      }
    };

    verifyToken();
  }, [searchParams]);

  const handleResendSubmit = async (e) => {
    e.preventDefault();
    setResendMessage('');
    setIsResending(true);
    try {
        const response = await apiClient.post('/reenviar-verificacao', { email });
        setResendMessage(response.data.message);
    } catch (error) {
        setResendMessage('Ocorreu um erro ao tentar reenviar o e-mail.');
    } finally {
        setIsResending(false);
    }
  }

  const renderContent = () => {
    switch (status) {
      case 'success':
        return (
          <>
            <Icon className="fas fa-check-circle" status="success" />
            <Title>E-mail Verificado com Sucesso!</Title>
            <Message>Sua conta foi ativada. Agora já pode fazer login.</Message>
            <ActionButton to="/login">Fazer Login</ActionButton>
          </>
        );
      case 'error':
        return (
          <>
            <Icon className="fas fa-times-circle" status="error" />
            <Title>Falha na Verificação</Title>
            <Message>{message}</Message>
            
            {!showResend && (
                 <ResendLink onClick={() => setShowResend(true)}>
                    Reenviar e-mail de verificação
                </ResendLink>
            )}

            {showResend && (
                <form onSubmit={handleResendSubmit} style={{marginTop: '20px'}}>
                    <p style={{fontSize: '0.9rem'}}>Insira o seu e-mail para receber um novo link.</p>
                    <Input 
                        type="email" 
                        placeholder="Seu e-mail de cadastro"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <ActionButton as="button" type="submit" disabled={isResending} style={{width: '100%', fontSize: '15px'}}>
                        {isResending ? 'A Enviar...' : 'Reenviar Link'}
                    </ActionButton>
                </form>
            )}

            {resendMessage && <p style={{marginTop: '15px', color: 'var(--green-accent)'}}>{resendMessage}</p>}

            <div style={{marginTop: '25px'}}>
                <ActionButton to="/cadastro" style={{backgroundColor: 'transparent', border: '1px solid #fff', fontSize: '14px', padding: '8px 20px'}}>
                    Voltar ao Cadastro
                </ActionButton>
            </div>
          </>
        );
      default: // 'loading'
        return (
          <>
            <Icon className="fas fa-spinner fa-spin" status="loading" />
            <Title>A Verificar...</Title>
            <Message>{message}</Message>
          </>
        );
    }
  };

  return (
    <VerificationPageContainer>
      <VerificationBox>
        {renderContent()}
      </VerificationBox>
    </VerificationPageContainer>
  );
};

export default Verification;
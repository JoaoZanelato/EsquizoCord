// src/pages/ForgotPassword/ForgotPassword.jsx
import React, { useState } from 'react';
import apiClient from '../../services/api';
import {
    ForgotPasswordContainer,
    AuthBox,
    Title,
    Subtitle,
    Form,
    InputGroup,
    Label,
    Input,
    Button,
    AuthLinks,
    AuthLink,
    FeedbackMessage
} from './styles';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const response = await apiClient.post('/esqueceu-senha', { email });
            setMessage(response.data.message);
        } catch (err) {
            setError(err.response?.data?.message || 'Ocorreu um erro.');
        }
    };

    return (
        <ForgotPasswordContainer>
            <AuthBox>
                <Title>Esqueceu-se da senha?</Title>
                <Subtitle>
                    Sem problemas. Insira o seu e-mail e enviaremos um link para a redefinir.
                </Subtitle>

                {message && <FeedbackMessage success><p>{message}</p></FeedbackMessage>}
                {error && <FeedbackMessage><p>{error}</p></FeedbackMessage>}

                {!message && (
                     <Form onSubmit={handleSubmit}>
                        <InputGroup>
                            <Label htmlFor="email">E-mail</Label>
                            <Input 
                                type="email" 
                                id="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                            />
                        </InputGroup>
                        <Button type="submit">Enviar Link</Button>
                    </Form>
                )}

                <AuthLinks>
                    <AuthLink to="/login">
                       <i className="fas fa-arrow-left" style={{marginRight: '8px'}}></i>
                       Voltar para o Login
                    </AuthLink>
                </AuthLinks>
            </AuthBox>
        </ForgotPasswordContainer>
    );
};

export default ForgotPassword;''
// src/components/MessageItem/MessageItem.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    MessageContainer,
    Avatar,
    MessageContent,
    MessageHeader,
    AuthorName,
    Timestamp,
    MessageText
} from './styles';

// Função para formatar a hora
const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const MessageItem = ({ message }) => {
    const { user: currentUser } = useAuth();
    const isSentByMe = message.id_usuario === currentUser.id_usuario;

    return (
        <MessageContainer $isSentByMe={isSentByMe}>
            <Avatar src={message.autorFoto || '/images/logo.png'} alt={message.autorNome} />
           
            <MessageContent $isSentByMe={isSentByMe}>
                {/* Oculta o header se a mensagem for sua para não repetir seu nome */}
                {!isSentByMe && (
                    <MessageHeader>
                        <AuthorName>{message.autorNome}</AuthorName>
                        <Timestamp>{formatTime(message.DataHora)}</Timestamp>
                    </MessageHeader>
                )}
                
                <MessageText
                    $isSentByMe={isSentByMe}
                    dangerouslySetInnerHTML={{ __html: message.Conteudo }}
                />
            </MessageContent>
        </MessageContainer>
    );
};

export default MessageItem;
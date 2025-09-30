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

const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const MessageItem = ({ message, onViewProfile }) => { // <-- Recebe a nova prop
    const { user: currentUser } = useAuth();
    const isSentByMe = message.id_usuario === currentUser.id_usuario;

    // Não permite abrir o próprio perfil a partir de uma mensagem
    const handleAvatarClick = () => {
        if (!isSentByMe && onViewProfile) {
            onViewProfile(message.id_usuario);
        }
    };

    return (
        <MessageContainer $isSentByMe={isSentByMe}>
            <Avatar 
                src={message.autorFoto || '/images/logo.png'} 
                alt={message.autorNome} 
                onClick={handleAvatarClick} // <-- Adicionado onClick
                style={{ cursor: isSentByMe ? 'default' : 'pointer' }} // Feedback visual
            />
           
            <MessageContent $isSentByMe={isSentByMe}>
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
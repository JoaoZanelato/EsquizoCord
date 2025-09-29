// src/components/MessageItem/MessageItem.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    MessageContainer,
    Avatar,
    MessageContent,
    AuthorName,
    MessageText
} from './styles';

const MessageItem = ({ message }) => {
    const { user: currentUser } = useAuth();
    const isSentByMe = message.id_usuario === currentUser.id_usuario;

    const formatUserTag = (name, id) => `${name}#${id}`;

    return (
        <MessageContainer isSentByMe={isSentByMe}>
            <Avatar src={message.autorFoto || '/images/logo.png'} alt={message.autorNome} />
            <MessageContent isSentByMe={isSentByMe}>
                {!isSentByMe && (
                    <AuthorName>
                        {formatUserTag(message.autorNome, message.id_usuario)}
                    </AuthorName>
                )}
                {/* Usamos dangerouslySetInnerHTML para renderizar o HTML do 'marked', mas é seguro porque o sanitizamos no backend */}
                <MessageText
                    isSentByMe={isSentByMe}
                    dangerouslySetInnerHTML={{ __html: message.Conteudo }}
                />
            </MessageContent>
        </MessageContainer>
    );
};

export default MessageItem;
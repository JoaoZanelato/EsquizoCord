// src/components/ChatInput/ChatInput.jsx
import React, { useState } from 'react';
import apiClient from '../../services/api';
import {
    InputBarContainer,
    InputWrapper,
    MentionButton,
    InputField
} from './styles';

const ChatInput = ({ chatInfo }) => {
    const [message, setMessage] = useState('');

    const handleSendMessage = async (e) => {
        // Envia a mensagem apenas se a tecla "Enter" for pressionada e a mensagem não estiver vazia
        if (e.key === 'Enter' && message.trim() !== '') {
            e.preventDefault();

            let url = '';
            const body = { content: message.trim() };

            if (chatInfo.type === 'dm') {
                url = `/friends/dm/${chatInfo.user.id_usuario}/messages`;
            }
            // Adicionar lógica para grupos aqui depois

            if (!url) return;

            try {
                // Não precisamos de esperar pela resposta para limpar o input,
                // a mensagem aparecerá em tempo real via Socket.IO
                await apiClient.post(url, body);
                setMessage(''); // Limpa o input
            } catch (error) {
                console.error("Erro ao enviar mensagem:", error);
                alert("Não foi possível enviar a sua mensagem.");
            }
        }
    };

    return (
        <InputBarContainer>
            <InputWrapper>
                {/* O botão de menção pode ser ativado com base no tipo de chat no futuro */}
                {/* <MentionButton><i className="fas fa-robot"></i></MentionButton> */}
                <InputField
                    type="text"
                    placeholder={`Conversar com ${chatInfo.user?.Nome || '...'}`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleSendMessage}
                />
            </InputWrapper>
        </InputBarContainer>
    );
};

export default ChatInput;
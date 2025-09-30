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

            const messageToSend = message.trim(); // 1. Guarda a mensagem a ser enviada
            setMessage(''); // 2. Limpa o campo de texto imediatamente

            let url = '';
            if (chatInfo.type === 'dm') {
                url = `/friends/dm/${chatInfo.user.id_usuario}/messages`;
            }
            // Adicionar lógica para grupos aqui depois

            if (!url) {
                setMessage(messageToSend); // Restaura a mensagem se a URL for inválida
                return;
            }

            try {
                // 3. Envia a requisição para o servidor sem bloquear a UI
                await apiClient.post(url, { content: messageToSend });
            } catch (error) {
                console.error("Erro ao enviar mensagem:", error);
                alert("Não foi possível enviar a sua mensagem.");
                setMessage(messageToSend); // 4. Em caso de erro, restaura a mensagem no input
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
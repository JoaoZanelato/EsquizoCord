// src/components/ChatInput/ChatInput.jsx
import React, { useState } from 'react';
import apiClient from '../../services/api';
import { InputBarContainer, InputWrapper, MentionButton, InputField } from './styles';

const ChatInput = ({ chatInfo }) => {
    const [message, setMessage] = useState('');
    
    // --- INÍCIO DA ALTERAÇÃO ---
    // Define o placeholder e se o input deve estar ativo
    let placeholder = "Selecione uma conversa...";
    let disabled = true;
    if (chatInfo?.type === 'dm') {
        placeholder = `Conversar com ${chatInfo.user.Nome}`;
        disabled = false;
    } else if (chatInfo?.type === 'group' && chatInfo.channelName) {
        placeholder = `Conversar em #${chatInfo.channelName}`;
        disabled = false;
    }
    // --- FIM DA ALTERAÇÃO ---

    const handleSendMessage = async (e) => {
        if (e.key === 'Enter' && message.trim() !== '' && !disabled) {
            e.preventDefault();
            const messageToSend = message.trim();
            setMessage('');
            
            // --- INÍCIO DA ALTERAÇÃO ---
            let url = '';
            if (chatInfo.type === 'dm') {
                url = `/friends/dm/${chatInfo.user.id_usuario}/messages`;
            } else if (chatInfo.type === 'group') {
                url = `/groups/chats/${chatInfo.channelId}/messages`;
            }
            // --- FIM DA ALTERAÇÃO ---

            if (!url) { setMessage(messageToSend); return; }

            try {
                await apiClient.post(url, { content: messageToSend });
            } catch (error) {
                console.error("Erro ao enviar mensagem:", error);
                alert("Não foi possível enviar a sua mensagem.");
                setMessage(messageToSend);
            }
        }
    };

    return (
        <InputBarContainer>
            <InputWrapper>
                <InputField
                    type="text"
                    placeholder={placeholder}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleSendMessage}
                    disabled={disabled}
                />
            </InputWrapper>
        </InputBarContainer>
    );
};

export default ChatInput;
// src/components/AddFriend/AddFriend.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';
import {
    AddFriendContainer,
    StyledListHeader,
    Description,
    SearchInput,
    ResultsContainer,
    ResultItem,
    UserInfo,
    StyledAvatarContainer,
    StyledNameTag,
    AddButton
} from './styles';

const AddFriend = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sentRequests, setSentRequests] = useState({}); // Para rastrear os pedidos enviados

    // Hook para "debouncing": espera que o utilizador pare de digitar para fazer a pesquisa
    useEffect(() => {
        const search = async () => {
            if (query.trim() === '') {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                const response = await apiClient.get(`/friends/search?q=${query}`);
                setResults(response.data);
            } catch (error) {
                console.error("Erro ao procurar amigos:", error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(search, 500); // Espera 500ms
        return () => clearTimeout(timeoutId); // Limpa o timeout se o utilizador continuar a digitar

    }, [query]);

    const handleAddFriend = async (userId) => {
        try {
            await apiClient.post('/friends/request', { requestedId: userId });
            setSentRequests(prev => ({ ...prev, [userId]: true })); // Marca como enviado
        } catch (error) {
            alert(error.response?.data?.message || "Não foi possível enviar o pedido.");
        }
    };

    return (
        <AddFriendContainer>
            <StyledListHeader>Adicionar Amigo</StyledListHeader>
            <Description>
                Procure por um amigo com o seu nome de utilizador.
            </Description>
            <SearchInput 
                type="search"
                placeholder="Digite o nome para buscar..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            <ResultsContainer>
                {loading && <p>A procurar...</p>}
                {!loading && results.map(user => (
                    <ResultItem key={user.id_usuario}>
                        <UserInfo>
                            <StyledAvatarContainer>
                                <img src={user.fotoPerfil || '/images/logo.png'} alt={user.nome} />
                            </StyledAvatarContainer>
                            <StyledNameTag>
                                {user.nome}
                                <span className="user-tag">#{user.id_usuario}</span>
                            </StyledNameTag>
                        </UserInfo>
                        <AddButton 
                            onClick={() => handleAddFriend(user.id_usuario)}
                            disabled={sentRequests[user.id_usuario]}
                        >
                            {sentRequests[user.id_usuario] ? 'Enviado' : 'Adicionar'}
                        </AddButton>
                    </ResultItem>
                ))}
            </ResultsContainer>
        </AddFriendContainer>
    );
};

export default AddFriend;
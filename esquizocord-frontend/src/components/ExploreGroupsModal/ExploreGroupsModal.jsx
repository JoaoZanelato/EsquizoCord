// src/components/ExploreGroupsModal/ExploreGroupsModal.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';
import { ModalOverlay, ModalContent, CloseButton, Title } from '../../pages/Settings/styles';
import {
    SearchInput, ResultsContainer, ResultItem,
    GroupInfo, GroupName, JoinButton
} from './styles';

const ExploreGroupsModal = ({ isOpen, onClose, onGroupJoined }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [joinedGroups, setJoinedGroups] = useState({});

    useEffect(() => {
        if (!isOpen) {
            return; // Não faz a busca se o modal estiver fechado
        }

        const search = async () => {
            setLoading(true);
            try {
                const response = await apiClient.get(`/groups/search?q=${query}`);
                setResults(response.data);
            } catch (error) {
                console.error("Erro ao procurar grupos:", error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        // Debounce: espera 300ms após o utilizador parar de digitar
        const timeoutId = setTimeout(search, 300);
        return () => clearTimeout(timeoutId);

    }, [query, isOpen]);

    const handleJoinGroup = async (groupId) => {
        setJoinedGroups(prev => ({ ...prev, [groupId]: true })); // Desativa o botão imediatamente
        try {
            await apiClient.post(`/groups/${groupId}/join`);
            onGroupJoined(); // Informa o Dashboard para atualizar a lista de grupos
            onClose(); // Fecha o modal após entrar no grupo
        } catch (error) {
            alert(error.response?.data?.message || "Não foi possível entrar no grupo.");
            setJoinedGroups(prev => ({ ...prev, [groupId]: false })); // Reativa o botão em caso de erro
        }
    };

    return (
        <ModalOverlay $isOpen={isOpen} onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()} style={{ minHeight: '400px' }}>
                <CloseButton onClick={onClose}>&times;</CloseButton>
                <Title as="h3" style={{ textAlign: 'center', marginBottom: '20px' }}>Explorar Servidores Públicos</Title>

                <SearchInput
                    type="search"
                    placeholder="Pesquisar grupos públicos..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />

                <ResultsContainer>
                    {loading && <p>A procurar...</p>}
                    {!loading && results.map(group => (
                        <ResultItem key={group.id_grupo}>
                            <GroupInfo>
                                <img src={group.Foto || '/images/default-group-icon.png'} alt={group.Nome} />
                                <GroupName>
                                    {group.Nome}
                                    <span> #{group.id_grupo}</span>
                                </GroupName>
                            </GroupInfo>
                            <JoinButton
                                onClick={() => handleJoinGroup(group.id_grupo)}
                                disabled={joinedGroups[group.id_grupo]}
                            >
                                {joinedGroups[group.id_grupo] ? 'Entrando...' : 'Entrar'}
                            </JoinButton>
                        </ResultItem>
                    ))}
                    {!loading && results.length === 0 && <p>Nenhum grupo encontrado.</p>}
                </ResultsContainer>
            </ModalContent>
        </ModalOverlay>
    );
};

export default ExploreGroupsModal;
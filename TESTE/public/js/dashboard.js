document.addEventListener('DOMContentLoaded', () => {
    // --- INICIALIZAÇÃO ---
    const body = document.querySelector('body');
    const userData = body.dataset.user;
    
    let currentUserId = null;
    let currentUser = null;
    
    // Bloco seguro para inicializar os dados do utilizador
    if (userData) {
        try {
            currentUser = JSON.parse(userData);
            if (currentUser) {
                currentUserId = currentUser.id_usuario;
            }
        } catch (e) {
            console.error("Erro ao processar dados do utilizador a partir do data attribute:", e);
        }
    }

    let currentGroupData = null;
    let activeSearchTab = 'explore-groups'; // Aba ativa no modal de exploração

    // --- SELEÇÃO DE ELEMENTOS DO DOM ---

    // Modais
    const createGroupModal = document.getElementById('create-group-modal');
    const editGroupModal = document.getElementById('edit-group-modal');
    const exploreModal = document.getElementById('explore-modal');
    const friendRequestsModal = document.getElementById('friend-requests-modal');
    
    // Formulários e Inputs
    const createGroupForm = document.getElementById('create-group-form');
    const editGroupForm = document.getElementById('edit-group-form');
    const searchGroupInput = document.getElementById('search-group-input');
    const searchUserInput = document.getElementById('search-user-input');
    const searchGroupResults = document.getElementById('search-group-results');
    const searchUserResults = document.getElementById('search-user-results');

    // Botões de Ação
    const addServerButton = document.getElementById('add-server-button');
    const exploreButton = document.getElementById('explore-button');
    const groupSettingsIcon = document.getElementById('group-settings-icon');
    const deleteGroupButton = document.getElementById('delete-group-btn');
    const tabButtons = document.querySelectorAll('.tab-button');
    const homeButton = document.getElementById('home-button');
    
    // Elementos de Exibição
    const serverIcons = document.querySelectorAll('.server-icon[data-group-id]');
    const groupNameHeader = document.getElementById('group-name-header');
    const channelListContent = document.getElementById('channel-list-content');
    const chatHeader = document.getElementById('chat-header');
    const pendingRequestsList = document.getElementById('pending-requests-list');
    const sentRequestsList = document.getElementById('sent-requests-list');

    // --- FUNÇÕES UTILITÁRIAS ---
    
    function closeModal(modal) {
        if(modal) modal.style.display = 'none';
    }

    function openModal(modal) {
        if(modal) modal.style.display = 'flex';
    }

    // --- LÓGICA DE EVENTOS (EVENT LISTENERS) ---

    // 1. Abrir e Fechar Modais
    if (addServerButton) addServerButton.addEventListener('click', () => openModal(createGroupModal));
    if (exploreButton) {
        exploreButton.addEventListener('click', () => {
            openModal(exploreModal);
            document.querySelector(`#search-${activeSearchTab.split('-')[1]}-input`)?.dispatchEvent(new Event('input'));
        });
    }
    if (groupSettingsIcon) {
        groupSettingsIcon.addEventListener('click', () => {
            if (currentGroupData) {
                document.getElementById('edit-group-id').value = currentGroupData.details.id_grupo;
                document.getElementById('edit-group-name').value = currentGroupData.details.Nome;
                document.getElementById('edit-group-private').checked = currentGroupData.details.IsPrivate;
                openModal(editGroupModal);
            }
        });
    }

    [createGroupModal, editGroupModal, exploreModal, friendRequestsModal].forEach(modal => {
        if (!modal) return;
        modal.querySelector('.cancel-btn').addEventListener('click', () => closeModal(modal));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal);
        });
    });
    
    // 2. Navegação Principal e Gestão de Amigos
    if (homeButton) {
         homeButton.addEventListener('click', () => {
            // Recarregar a página é uma forma simples de voltar ao estado inicial de amigos
            window.location.reload(); 
        });
    }
    
    // Ouve cliques no container da lista de canais para o botão "Pedidos de Amizade"
    channelListContent.addEventListener('click', (e) => {
        if(e.target.id === 'friend-requests-btn') {
            openModal(friendRequestsModal);
        }
    });

    // 3. Submissão de Formulários
    if (createGroupForm) createGroupForm.addEventListener('submit', handleFormSubmit('/groups/criar', 'Erro ao criar grupo.'));
    
    if (editGroupForm) {
        editGroupForm.addEventListener('submit', e => {
            const groupId = editGroupForm.querySelector('#edit-group-id').value;
            handleFormSubmit(`/groups/${groupId}/settings`, 'Erro ao atualizar grupo.')(e);
        });
    }

    if (deleteGroupButton) {
        deleteGroupButton.addEventListener('click', async () => {
            const groupId = document.getElementById('edit-group-id').value;
            const groupName = document.getElementById('edit-group-name').value;
            
            if (confirm(`Tem a certeza de que deseja excluir o grupo "${groupName}"? Esta ação é irreversível.`)) {
                handleAction(deleteGroupButton, `/groups/${groupId}`, 'Excluindo...', 'Excluir Grupo', null, 'DELETE', true);
            }
        });
    }

    // 4. Lógica do Modal de Exploração (Abas e Pesquisa)
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            const activeTabContent = document.getElementById(button.dataset.tab);
            if (activeTabContent) {
                activeTabContent.classList.add('active');
            }
            activeSearchTab = button.dataset.tab;

            const inputToTrigger = document.querySelector(`#${activeSearchTab}`).querySelector('input[type="search"]');
            if(inputToTrigger) {
                inputToTrigger.dispatchEvent(new Event('input'));
            }
        });
    });

    let searchTimeout;
    [searchGroupInput, searchUserInput].forEach(input => {
        if(!input) return;
        input.addEventListener('input', e => {
            clearTimeout(searchTimeout);
            const query = e.target.value;
            searchTimeout = setTimeout(async () => {
                const isGroupSearch = input.id === 'search-group-input';
                const searchUrl = isGroupSearch ? `/groups/search?q=${encodeURIComponent(query)}` : `/friends/search?q=${encodeURIComponent(query)}`;
                const container = isGroupSearch ? searchGroupResults : searchUserResults;
                try {
                    const response = await fetch(searchUrl);
                    const results = await response.json();
                    renderSearchResults(results, container, isGroupSearch);
                } catch (err) {
                    container.innerHTML = '<p>Erro ao pesquisar.</p>';
                }
            }, 300);
        });
    });
    
    // Ação nos resultados da pesquisa (Juntar/Adicionar)
    [searchGroupResults, searchUserResults].forEach(container => {
        container.addEventListener('click', async (e) => {
            const target = e.target;
            if (target.classList.contains('join-btn')) {
                const groupId = target.dataset.groupId;
                handleAction(target, `/groups/${groupId}/join`, 'Entrando...', 'Entrar', null, 'POST', true);
            } else if (target.classList.contains('add-friend-btn')) {
                const userId = target.dataset.userId;
                handleAction(target, '/friends/request', 'Enviando...', 'Adicionar Amigo', { requestedId: userId });
            }
        });
    });
    
    // 5. Ações nos Pedidos de Amizade (no modal)
    if(friendRequestsModal) {
        friendRequestsModal.addEventListener('click', async e => {
            const target = e.target.closest('button');
            if (!target) return;
            const requestItem = target.closest('.search-result-item');
            const requestId = requestItem.dataset.requestId;
            
            if (target.classList.contains('accept-btn') || target.classList.contains('reject-btn')) {
                const action = target.classList.contains('accept-btn') ? 'aceite' : 'recusada';
                handleAction(target, '/friends/respond', '...', '', { requestId, action }, 'POST', true);
            } else if (target.classList.contains('cancel-request-btn')) {
                handleAction(target, '/friends/cancel', 'Cancelando...', 'Cancelar', { requestId }, 'POST', true);
            }
        });
    }

    // 6. Lógica de Interação com a Lista de Servidores
    serverIcons.forEach(icon => {
        icon.addEventListener('click', async () => {
            document.querySelectorAll('.server-icon').forEach(i => i.classList.remove('active'));
            icon.classList.add('active');
            const groupId = icon.dataset.groupId;
            renderGroupView(groupId);
        });
    });

    // --- FUNÇÕES DE RENDERIZAÇÃO E MANIPULAÇÃO DE DADOS ---

    function renderFriendsView() {
        groupNameHeader.textContent = "Amigos";
        groupSettingsIcon.style.display = 'none';
        channelListContent.innerHTML = `
            <div style="padding: 10px;">
                <button id="friend-requests-btn" class="submit-btn" style="width: 100%;">Pedidos de Amizade</button>
            </div>
            <div class="channel-list-header">Amigos - ${friends.length}</div>
        `;
        if (friends && friends.length > 0) {
            friends.forEach(friend => {
                const friendDiv = document.createElement('div');
                friendDiv.className = 'friend-item';
                friendDiv.innerHTML = `<img src="${friend.FotoPerfil || '/images/logo.png'}"> <span>${friend.Nome}</span>`;
                channelListContent.appendChild(friendDiv);
            });
        } else {
            channelListContent.innerHTML += '<p style="padding: 8px; color: var(--text-muted);">A sua lista de amigos está vazia.</p>';
        }
        document.getElementById('friend-requests-btn').addEventListener('click', () => openModal(friendRequestsModal));
    }
    
    async function renderGroupView(groupId) {
        try {
            const response = await fetch(`/groups/${groupId}/details`);
            const data = await response.json();
            currentGroupData = data;
            
            groupNameHeader.textContent = data.details.Nome;
            chatHeader.innerHTML = `<h3><i class="fas fa-hashtag" style="color: var(--text-muted); font-size: 20px; margin-right: 5px;"></i> ${data.details.Nome}</h3><span class="group-id">#${data.details.id_grupo}</span>`;
            if (groupSettingsIcon) groupSettingsIcon.style.display = (currentUserId === data.details.id_criador) ? 'block' : 'none';
            
            channelListContent.innerHTML = '';
            
            const memberHeader = document.createElement('div');
            memberHeader.className = 'channel-list-header';
            memberHeader.textContent = `MEMBROS - ${data.members.length}`;
            channelListContent.appendChild(memberHeader);
            data.members.forEach(member => {
                const memberDiv = document.createElement('div');
                memberDiv.className = 'friend-item';
                let memberHTML = `<img src="${member.FotoPerfil || '/images/logo.png'}" alt="${member.Nome}"><span>${member.Nome}</span>`;
                if (member.isAdmin) {
                    memberHTML += `<i class="fas fa-crown admin-icon" title="Administrador"></i>`;
                }
                memberDiv.innerHTML = memberHTML;
                channelListContent.appendChild(memberDiv);
            });
        } catch (err) {
            if(channelListContent) channelListContent.innerHTML = '<p>Erro ao carregar detalhes.</p>';
        }
    }

    async function handleFormSubmit(url, errorMessage) {
        return async function(event) {
            event.preventDefault();
            const formData = new FormData(event.target);
            try {
                const response = await fetch(url, { method: 'POST', body: formData });
                if (response.ok) window.location.reload();
                else alert(`${errorMessage}: ${(await response.json()).message}`);
            } catch (err) {
                alert('Ocorreu um erro de rede. Tente novamente.');
            }
        }
    }

    function renderSearchResults(results, container, isGroupSearch) {
        container.innerHTML = '';
        if (results.length === 0) {
            container.innerHTML = '<p>Nenhum resultado encontrado.</p>';
            return;
        }
        results.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'search-result-item';
            if (isGroupSearch) {
                itemDiv.innerHTML = `
                    <div class="search-result-info">
                        <img src="${item.Foto || '/images/default-group-icon.png'}" alt="${item.Nome}">
                        <div class="search-result-name">
                            <span>${item.Nome}</span>
                            <span class="group-id-search">#${item.id_grupo}</span>
                        </div>
                    </div>
                    <button class="join-btn" data-group-id="${item.id_grupo}">Entrar</button>
                `;
            } else { // é um utilizador
                itemDiv.innerHTML = `
                    <div class="search-result-info">
                        <img src="${item.FotoPerfil || '/images/logo.png'}" alt="${item.Nome}">
                        <div class="search-result-name"><span>${item.Nome}</span></div>
                    </div>
                    <button class="add-friend-btn" data-user-id="${item.id_usuario}">Adicionar Amigo</button>
                `;
            }
            container.appendChild(itemDiv);
        });
    }

    async function handleAction(button, url, loadingText, defaultText, body = null, method = 'POST', reload = false) {
        button.disabled = true;
        button.textContent = loadingText;
        try {
            const options = { method: method, headers: {} };
            if (body) {
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(body);
            }
            const response = await fetch(url, options);
            
            if (response.ok) {
                 if (reload) {
                    window.location.reload();
                 } else {
                    const data = await response.json();
                    alert(data.message);
                    button.textContent = 'Feito!';
                 }
            } else {
                const data = await response.json();
                alert(data.message);
                button.disabled = false;
                button.textContent = defaultText;
            }
        } catch (err) {
             alert('Ocorreu um erro de rede.');
             button.disabled = false;
             button.textContent = defaultText;
        }
    }
    
    // --- INICIALIZAÇÃO DA VIEW ---
    renderFriendsView();
});

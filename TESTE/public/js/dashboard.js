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
    let activeSearchTab = 'groups'; // Aba ativa no modal de exploração

    // --- SELEÇÃO DE ELEMENTOS DO DOM ---

    // Modais
    const createGroupModal = document.getElementById('create-group-modal');
    const editGroupModal = document.getElementById('edit-group-modal');
    const exploreModal = document.getElementById('explore-modal');
    
    // Formulários e Inputs
    const createGroupForm = document.getElementById('create-group-form');
    const editGroupForm = document.getElementById('edit-group-form');
    const searchInput = document.getElementById('search-input');
    const searchResultsContainer = document.getElementById('search-results');
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
            // Simula um evento de input para carregar a lista inicial da aba ativa
            document.querySelector(`#search-${activeSearchTab}-input`)?.dispatchEvent(new Event('input'));
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

    [createGroupModal, editGroupModal, exploreModal].forEach(modal => {
        if (!modal) return;
        modal.querySelector('.cancel-btn').addEventListener('click', () => closeModal(modal));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal);
        });
    });
    
    // 2. Navegação Principal
    if (homeButton) {
         homeButton.addEventListener('click', () => window.location.reload());
    }

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
            tabContents.forEach(content => content.classList.remove('active'));
            
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
                const searchUrl = activeSearchTab === 'groups' ? `/groups/search?q=${encodeURIComponent(query)}` : `/friends/search?q=${encodeURIComponent(query)}`;
                const container = activeSearchTab === 'groups' ? searchGroupResults : searchUserResults;
                try {
                    const response = await fetch(searchUrl);
                    const results = await response.json();
                    renderSearchResults(results, container);
                } catch (err) {
                    container.innerHTML = '<p>Erro ao pesquisar.</p>';
                }
            }, 300);
        });
    });
    
    // Ação nos resultados da pesquisa
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
    
    // 5. Responder a pedidos de amizade
    if(pendingRequestsList) {
        pendingRequestsList.addEventListener('click', async e => {
            const target = e.target.closest('button');
            if (!target) return;
            const requestItem = target.closest('.search-result-item');
            const requestId = requestItem.dataset.requestId;
            const action = target.classList.contains('accept-btn') ? 'aceite' : 'recusada';
            
            if (action) {
                handleAction(target, '/friends/respond', '...', '', { requestId, action }, 'POST', true);
            }
        });
    }

    // 6. Cancelar pedido de amizade enviado
    if(sentRequestsList) {
        sentRequestsList.addEventListener('click', async e => {
            const target = e.target;
            if (!target.classList.contains('cancel-request-btn')) return;
            const requestItem = target.closest('.search-result-item');
            const requestId = requestItem.dataset.requestId;
            handleAction(target, '/friends/cancel', 'Cancelando...', 'Cancelar', { requestId }, 'POST', true);
        });
    }

    // 7. Lógica de Interação com a Lista de Servidores
    serverIcons.forEach(icon => {
        icon.addEventListener('click', async () => {
            serverIcons.forEach(i => i.classList.remove('active'));
            icon.classList.add('active');
            const groupId = icon.dataset.groupId;
            
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
        });
    });

    // --- FUNÇÕES DE MANIPULAÇÃO DE DADOS ---

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

    function renderSearchResults(results, container) {
        container.innerHTML = '';
        if (results.length === 0) {
            container.innerHTML = '<p>Nenhum resultado encontrado.</p>';
            return;
        }

        if (activeSearchTab === 'groups') {
             results.forEach(group => {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.innerHTML = `
                    <div class="search-result-info">
                        <img src="${group.Foto || '/images/default-group-icon.png'}" alt="${group.Nome}">
                        <div class="search-result-name">
                            <span>${group.Nome}</span>
                            <span class="group-id-search">#${group.id_grupo}</span>
                        </div>
                    </div>
                    <button class="join-btn" data-group-id="${group.id_grupo}">Entrar</button>
                `;
                container.appendChild(item);
            });
        } else { // 'users'
             results.forEach(user => {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.innerHTML = `
                    <div class="search-result-info">
                        <img src="${user.FotoPerfil || '/images/logo.png'}" alt="${user.Nome}">
                        <div class="search-result-name">
                            <span>${user.Nome}</span>
                        </div>
                    </div>
                    <button class="add-friend-btn" data-user-id="${user.id_usuario}">Adicionar Amigo</button>
                `;
                container.appendChild(item);
            });
        }
    }

    async function handleAction(button, url, loadingText, defaultText, body = null, method = 'POST', reload = false) {
        button.disabled = true;
        button.textContent = loadingText;
        try {
            const options = { method: method };
            if (body) {
                options.headers = { 'Content-Type': 'application/json' };
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
});

document.addEventListener('DOMContentLoaded', () => {
    // --- INICIALIZAÇÃO ---
    const body = document.querySelector('body');
    
    // Função segura para fazer o parse dos dados JSON a partir dos data attributes
    const parseJsonData = (attribute) => {
        const data = body.dataset[attribute];
        if (!data) return null;
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error(`Erro ao fazer o parse do atributo de dados: ${attribute}`, e);
            return null;
        }
    };

    const currentUser = parseJsonData('user');
    const groups = parseJsonData('groups') || [];
    const friends = parseJsonData('friends') || [];
    const pendingRequests = parseJsonData('pendingRequests') || [];
    const sentRequests = parseJsonData('sentRequests') || [];
    
    const currentUserId = currentUser ? currentUser.id_usuario : null;
    let currentGroupData = null;

    // --- SELEÇÃO DE ELEMENTOS DO DOM ---
    const createGroupModal = document.getElementById('create-group-modal');
    const editGroupModal = document.getElementById('edit-group-modal');
    const exploreModal = document.getElementById('explore-modal');
    const friendRequestsModal = document.getElementById('friend-requests-modal');
    
    const createGroupForm = document.getElementById('create-group-form');
    const editGroupForm = document.getElementById('edit-group-form');
    const searchGroupInput = document.getElementById('search-group-input');
    const searchUserInput = document.getElementById('search-user-input');
    const searchGroupResults = document.getElementById('search-group-results');
    const searchUserResults = document.getElementById('search-user-results');

    const addServerButton = document.getElementById('add-server-button');
    const exploreButton = document.getElementById('explore-button');
    const homeButton = document.getElementById('home-button');
    const friendsNavContainer = document.getElementById('friends-nav-container');
    const groupNameHeader = document.getElementById('group-name-header');
    const channelListContent = document.getElementById('channel-list-content');
    const groupSettingsIcon = document.getElementById('group-settings-icon');
    const deleteGroupButton = document.getElementById('delete-group-btn');
    const serverIcons = document.querySelectorAll('.server-icon[data-group-id]');
    const chatHeader = document.getElementById('chat-header');

    // --- FUNÇÕES DE RENDERIZAÇÃO ---
    
    function renderFriendsView() {
        if(groupSettingsIcon) groupSettingsIcon.style.display = 'none';
        if(friendsNavContainer) friendsNavContainer.style.display = 'flex';
        if(groupNameHeader) groupNameHeader.textContent = "Amigos";
        if(chatHeader) chatHeader.innerHTML = `<h3>Mensagens Diretas</h3>`;

        // Ativa a aba "Amigos" por defeito
        document.querySelector('.friends-nav-btn[data-tab="friends-list"]')?.classList.add('active');
        renderFriendsList();
    }
    
    function renderFriendsList() {
        if (!channelListContent) return;
        channelListContent.innerHTML = '<div class="channel-list-header">Amigos</div>';
        if (friends.length > 0) {
            friends.forEach(friend => {
                const friendDiv = document.createElement('div');
                friendDiv.className = 'friend-item';
                friendDiv.innerHTML = `<img src="${friend.FotoPerfil || '/images/logo.png'}"> <span>${friend.Nome}</span>`;
                channelListContent.appendChild(friendDiv);
            });
        } else {
            channelListContent.innerHTML += '<p style="padding: 8px; color: var(--text-muted);">A sua lista de amigos está vazia.</p>';
        }
    }

    function renderPendingRequests() {
        if (!channelListContent) return;
        channelListContent.innerHTML = '';
        // Pedidos recebidos
        channelListContent.innerHTML += '<div class="channel-list-header">Pedidos Recebidos</div>';
        if (pendingRequests && pendingRequests.length > 0) {
            pendingRequests.forEach(req => {
                const reqDiv = document.createElement('div');
                reqDiv.className = 'friend-request-item';
                reqDiv.dataset.requestId = req.id_amizade;
                reqDiv.innerHTML = `
                    <div class="friend-item" style="flex-grow: 1;">
                        <img src="${req.FotoPerfil || '/images/logo.png'}"> <span>${req.Nome}</span>
                    </div>
                    <div class="request-actions">
                        <button class="accept-btn" title="Aceitar"><i class="fas fa-check-circle"></i></button>
                        <button class="reject-btn" title="Recusar"><i class="fas fa-times-circle"></i></button>
                    </div>`;
                channelListContent.appendChild(reqDiv);
            });
        } else {
            channelListContent.innerHTML += '<p style="padding: 8px; color: var(--text-muted);">Nenhum pedido recebido.</p>';
        }
        // Pedidos enviados
        channelListContent.innerHTML += '<div class="channel-list-header" style="margin-top: 20px;">Pedidos Enviados</div>';
        if (sentRequests && sentRequests.length > 0) {
            sentRequests.forEach(req => {
                const reqDiv = document.createElement('div');
                reqDiv.className = 'friend-request-item';
                reqDiv.dataset.requestId = req.id_amizade;
                reqDiv.innerHTML = `
                     <div class="friend-item" style="flex-grow: 1;">
                        <img src="${req.FotoPerfil || '/images/logo.png'}"> <span>${req.Nome}</span>
                    </div>
                    <div class="request-actions">
                        <button class="cancel-request-btn" title="Cancelar Pedido"><i class="fas fa-trash"></i></button>
                    </div>`;
                channelListContent.appendChild(reqDiv);
            });
        } else {
             channelListContent.innerHTML += '<p style="padding: 8px; color: var(--text-muted);">Nenhum pedido enviado.</p>';
        }
    }

    function renderAddFriend() {
        if (!channelListContent) return;
        channelListContent.innerHTML = `
            <div class="add-friend-container">
                <div class="channel-list-header">Adicionar Amigo</div>
                <p>Pode adicionar um amigo com o seu nome de utilizador.</p>
                <div class="add-friend-input">
                    <input type="text" id="add-friend-input" placeholder="Digite o nome do utilizador...">
                    <button id="add-friend-submit" class="submit-btn">Enviar Pedido</button>
                </div>
                <div id="add-friend-results" style="margin-top: 10px;"></div>
            </div>`;
    }

    async function renderGroupView(groupId) {
        try {
            const response = await fetch(`/groups/${groupId}/details`);
            const data = await response.json();
            currentGroupData = data;
            
            if (friendsNavContainer) friendsNavContainer.style.display = 'none';
            if (groupNameHeader) groupNameHeader.textContent = data.details.Nome;
            if (chatHeader) chatHeader.innerHTML = `<h3><i class="fas fa-hashtag" style="color: var(--text-muted); font-size: 20px; margin-right: 5px;"></i> ${data.details.Nome}</h3><span class="group-id">#${data.details.id_grupo}</span>`;
            if (groupSettingsIcon) groupSettingsIcon.style.display = (currentUserId === data.details.id_criador) ? 'block' : 'none';
            
            if (!channelListContent) return;
            channelListContent.innerHTML = '';
            
            const memberHeader = document.createElement('div');
            memberHeader.className = 'channel-list-header';
            memberHeader.textContent = `MEMBROS - ${data.members.length}`;
            channelListContent.appendChild(memberHeader);
            data.members.forEach(member => {
                const memberDiv = document.createElement('div');
                memberDiv.className = 'friend-item';
                let memberHTML = `<img src="${member.FotoPerfil || '/images/logo.png'}" alt="${member.Nome}"><span>${member.Nome}</span>`;
                if (member.isAdmin) memberHTML += `<i class="fas fa-crown admin-icon" title="Administrador"></i>`;
                memberDiv.innerHTML = memberHTML;
                channelListContent.appendChild(memberDiv);
            });
        } catch (err) {
            if(channelListContent) channelListContent.innerHTML = '<p>Erro ao carregar detalhes.</p>';
        }
    }

    // --- LÓGICA DE EVENTOS ---
    function closeModal(modal) { if(modal) modal.style.display = 'none'; }
    function openModal(modal) { if(modal) modal.style.display = 'flex'; }

    if (addServerButton) addServerButton.addEventListener('click', () => openModal(createGroupModal));
    if (exploreButton) exploreButton.addEventListener('click', () => {
        openModal(exploreModal);
        const activeTab = exploreModal.querySelector('.tab-button.active').dataset.tab;
        exploreModal.querySelector(`#${activeTab}`).querySelector('input[type="search"]')?.dispatchEvent(new Event('input'));
    });
    if (groupSettingsIcon) groupSettingsIcon.addEventListener('click', () => {
        if (currentGroupData) {
            editGroupModal.querySelector('#edit-group-id').value = currentGroupData.details.id_grupo;
            editGroupModal.querySelector('#edit-group-name').value = currentGroupData.details.Nome;
            editGroupModal.querySelector('#edit-group-private').checked = currentGroupData.details.IsPrivate;
            openModal(editGroupModal);
        }
    });

    [createGroupModal, editGroupModal, exploreModal, friendRequestsModal].forEach(modal => {
        if (!modal) return;
        modal.querySelector('.cancel-btn')?.addEventListener('click', () => closeModal(modal));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal);
        });
    });

    if (homeButton) homeButton.addEventListener('click', () => {
        document.querySelectorAll('.server-icon').forEach(i => i.classList.remove('active'));
        homeButton.classList.add('active');
        renderFriendsView();
    });

    if (friendsNavContainer) {
        friendsNavContainer.addEventListener('click', e => {
            if (e.target.tagName === 'BUTTON') {
                friendsNavContainer.querySelectorAll('.friends-nav-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                const tab = e.target.dataset.tab;
                if (tab === 'friends-list') renderFriendsList();
                else if (tab === 'pending-requests') renderPendingRequests();
                else if (tab === 'add-friend') renderAddFriend();
            }
        });
    }

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

    if (exploreModal) {
        exploreModal.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                exploreModal.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                exploreModal.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                button.classList.add('active');
                const activeTabContent = document.getElementById(button.dataset.tab);
                if (activeTabContent) {
                    activeTabContent.classList.add('active');
                    const inputToTrigger = activeTabContent.querySelector('input[type="search"]');
                    if(inputToTrigger) inputToTrigger.dispatchEvent(new Event('input'));
                }
            });
        });
    }
    
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
    
    document.querySelector('#explore-modal #search-results, #friend-requests-modal')?.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        
        if (target.classList.contains('join-btn')) {
            const groupId = target.dataset.groupId;
            handleAction(target, `/groups/${groupId}/join`, 'Entrando...', 'Entrar', null, 'POST', true);
        } else if (target.classList.contains('add-friend-btn')) {
            const userId = target.dataset.userId;
            handleAction(target, '/friends/request', 'Enviando...', 'Adicionar Amigo', { requestedId: userId });
        } else if (target.classList.contains('accept-btn') || target.classList.contains('reject-btn')) {
            const requestItem = target.closest('.search-result-item');
            const requestId = requestItem.dataset.requestId;
            const action = target.classList.contains('accept-btn') ? 'aceite' : 'recusada';
            handleAction(target, '/friends/respond', '...', '', { requestId, action }, 'POST', true);
        } else if (target.classList.contains('cancel-request-btn')) {
            const requestItem = target.closest('.search-result-item');
            const requestId = requestItem.dataset.requestId;
            handleAction(target, '/friends/cancel', 'Cancelando...', 'Cancelar', { requestId }, 'POST', true);
        }
    });

    serverIcons.forEach(icon => {
        icon.addEventListener('click', () => renderGroupView(icon.dataset.groupId));
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
            } else { 
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

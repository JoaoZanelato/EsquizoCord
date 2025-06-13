document.addEventListener('DOMContentLoaded', () => {
    // --- INICIALIZAÇÃO ---
    const socket = io();
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
    let currentChatId = null;
    let activeSearchTab = 'groups';

    // --- SELEÇÃO DE ELEMENTOS DO DOM ---
    const createGroupModal = document.getElementById('create-group-modal');
    const editGroupModal = document.getElementById('edit-group-modal');
    const exploreModal = document.getElementById('explore-group-modal');
    
    const createGroupForm = document.getElementById('create-group-form');
    const editGroupForm = document.getElementById('edit-group-form');
    const searchGroupInput = document.getElementById('search-group-input');
    const searchGroupResults = document.getElementById('search-group-results');
    const searchUserInput = document.getElementById('search-user-input');
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
    const chatMessagesContainer = document.getElementById('chat-messages-container');
    const chatInput = document.querySelector('.chat-input-bar input');

    // --- LÓGICA DE SOCKET.IO ---
    socket.on('connect', () => console.log('Conectado ao servidor de sockets com ID:', socket.id));
    socket.on('new_group_message', (message) => {
        if (message.id_chat == currentChatId) renderMessage(message);
    });

    // --- FUNÇÕES DE RENDERIZAÇÃO ---
    function renderMessage(message) {
        if (!chatMessagesContainer) return;
        const messageItem = document.createElement('div');
        messageItem.classList.add('message-item');
        if (message.id_usuario === currentUserId) messageItem.classList.add('sent');
        
        messageItem.innerHTML = `
            <img src="${message.autorFoto || '/images/logo.png'}" alt="${message.autorNome}">
            <div class="message-content">
                ${message.id_usuario !== currentUserId ? `<span class="author-name">${message.autorNome}</span>` : ''}
                <p class="message-text">${message.Conteudo}</p>
            </div>`;
        
        if (message.id_usuario === currentUserId) {
             const content = messageItem.querySelector('.message-content');
             const img = messageItem.querySelector('img');
             messageItem.appendChild(content);
             messageItem.insertBefore(img, null);
        }
        chatMessagesContainer.appendChild(messageItem);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }

    async function loadAndRenderMessages(chatId) {
        if (!chatId) {
            if (chatMessagesContainer) chatMessagesContainer.innerHTML = '<p>Selecione um canal para ver as mensagens.</p>';
            return;
        }
        try {
            const response = await fetch(`/groups/chats/${chatId}/messages`);
            const messages = await response.json();
            if (!chatMessagesContainer) return;
            chatMessagesContainer.innerHTML = '';
            if (messages.length === 0) chatMessagesContainer.innerHTML = '<p>Nenhuma mensagem ainda. Seja o primeiro a dizer olá!</p>';
            else messages.forEach(message => renderMessage(message));
        } catch (error) {
            if (chatMessagesContainer) chatMessagesContainer.innerHTML = '<p>Não foi possível carregar as mensagens.</p>';
        }
    }
    
    function renderFriendsView() {
        if(groupSettingsIcon) groupSettingsIcon.style.display = 'none';
        if(friendsNavContainer) friendsNavContainer.style.display = 'flex';
        if(groupNameHeader) groupNameHeader.textContent = "Amigos";
        if(chatHeader) chatHeader.innerHTML = `<h3>Mensagens Diretas</h3>`;
        if(chatInput) chatInput.placeholder = 'Conversar...';
        if(chatMessagesContainer) chatMessagesContainer.innerHTML = '<p>Selecione um amigo para começar a conversar.</p>';
        document.querySelectorAll('.friends-nav-btn').forEach(btn => btn.classList.remove('active'));
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
        channelListContent.innerHTML += '<div class="channel-list-header">Pedidos Recebidos</div>';
        if (pendingRequests && pendingRequests.length > 0) {
            pendingRequests.forEach(req => {
                const reqDiv = document.createElement('div');
                reqDiv.className = 'friend-request-item';
                reqDiv.dataset.requestId = req.id_amizade;
                reqDiv.innerHTML = `<div class="friend-item" style="flex-grow: 1;"> <img src="${req.FotoPerfil || '/images/logo.png'}"> <span>${req.Nome}</span> </div> <div class="request-actions"> <button class="accept-btn" title="Aceitar"><i class="fas fa-check-circle"></i></button> <button class="reject-btn" title="Recusar"><i class="fas fa-times-circle"></i></button> </div>`;
                channelListContent.appendChild(reqDiv);
            });
        } else {
            channelListContent.innerHTML += '<p style="padding: 8px; color: var(--text-muted);">Nenhum pedido recebido.</p>';
        }
        channelListContent.innerHTML += '<div class="channel-list-header" style="margin-top: 20px;">Pedidos Enviados</div>';
        if (sentRequests && sentRequests.length > 0) {
            sentRequests.forEach(req => {
                const reqDiv = document.createElement('div');
                reqDiv.className = 'friend-request-item';
                reqDiv.dataset.requestId = req.id_amizade;
                reqDiv.innerHTML = `<div class="friend-item" style="flex-grow: 1;"> <img src="${req.FotoPerfil || '/images/logo.png'}"> <span>${req.Nome}</span> </div> <div class="request-actions"> <button class="cancel-request-btn" title="Cancelar Pedido"><i class="fas fa-trash"></i></button> </div>`;
                channelListContent.appendChild(reqDiv);
            });
        } else {
             channelListContent.innerHTML += '<p style="padding: 8px; color: var(--text-muted);">Nenhum pedido enviado.</p>';
        }
    }

    function renderAddFriend() {
        if (!channelListContent) return;
        channelListContent.innerHTML = `<div class="add-friend-container"> <div class="channel-list-header">Adicionar Amigo</div> <p>Pode adicionar um amigo com o seu nome de utilizador.</p> <div class="add-friend-input"> <input type="text" id="add-friend-input" placeholder="Digite o nome do utilizador..."> <button id="add-friend-submit" class="submit-btn">Enviar Pedido</button> </div> <div id="add-friend-results" style="margin-top: 10px;"></div> </div>`;
    }

    async function renderGroupView(groupId) {
        try {
            const response = await fetch(`/groups/${groupId}/details`);
            const data = await response.json();
            currentGroupData = data;
            if (friendsNavContainer) friendsNavContainer.style.display = 'none';
            if (groupNameHeader) groupNameHeader.textContent = data.details.Nome;
            if (groupSettingsIcon) groupSettingsIcon.style.display = (currentUserId === data.details.id_criador) ? 'block' : 'none';
            if (!channelListContent) return;
            channelListContent.innerHTML = '';
            const firstChannel = data.channels[0];
            if (firstChannel) {
                currentChatId = firstChannel.id_chat;
                socket.emit('join_group_room', groupId);
                if(chatHeader) chatHeader.innerHTML = `<h3><i class="fas fa-hashtag" style="color: var(--text-muted);"></i> ${firstChannel.Nome}</h3>`;
                if(chatInput) chatInput.placeholder = `Conversar em #${firstChannel.Nome}`;
                loadAndRenderMessages(currentChatId);
            } else {
                currentChatId = null;
                 if(chatHeader) chatHeader.innerHTML = `<h3>Sem canais de texto</h3>`;
                 if(chatInput) chatInput.placeholder = `Crie um canal para começar a conversar.`;
                 if(chatMessagesContainer) chatMessagesContainer.innerHTML = '';
            }
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
    function setupEventListeners() {
        if (addServerButton) addServerButton.addEventListener('click', () => openModal(createGroupModal));
        if (exploreButton) exploreButton.addEventListener('click', () => {
            openModal(exploreModal);
            exploreModal.querySelector('#search-group-input')?.dispatchEvent(new Event('input'));
        });
        if (groupSettingsIcon) groupSettingsIcon.addEventListener('click', () => {
            if (currentGroupData) {
                editGroupModal.querySelector('#edit-group-id').value = currentGroupData.details.id_grupo;
                editGroupModal.querySelector('#edit-group-name').value = currentGroupData.details.Nome;
                editGroupModal.querySelector('#edit-group-private').checked = currentGroupData.details.IsPrivate;
                openModal(editGroupModal);
            }
        });
        [createGroupModal, editGroupModal, exploreModal].forEach(modal => {
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
        
        let searchTimeout;
        if(searchGroupInput){
             searchGroupInput.addEventListener('input', e => {
                clearTimeout(searchTimeout);
                const query = e.target.value;
                searchTimeout = setTimeout(async () => {
                    const searchUrl = `/groups/search?q=${encodeURIComponent(query)}`;
                    try {
                        const response = await fetch(searchUrl);
                        const results = await response.json();
                        renderSearchResults(results, searchGroupResults, true);
                    } catch (err) {
                        searchGroupResults.innerHTML = '<p>Erro ao pesquisar.</p>';
                    }
                }, 300);
            });
        }
        
        document.body.addEventListener('click', async (e) => {
            const target = e.target;
            if (target.classList.contains('join-btn')) {
                const groupId = target.dataset.groupId;
                handleAction(target, `/groups/${groupId}/join`, 'Entrando...', 'Entrar', null, 'POST', true);
            } 
            else if (target.id === 'add-friend-submit') {
                const input = document.getElementById('add-friend-input');
                const username = input.value.trim();
                if (!username) return;
                try {
                    const response = await fetch(`/friends/search?q=${encodeURIComponent(username)}`);
                    const users = await response.json();
                    if(users.length > 0) {
                         handleAction(target, '/friends/request', 'Enviando...', 'Enviar Pedido', { requestedId: users[0].id_usuario });
                    } else {
                        alert('Utilizador não encontrado.');
                    }
                } catch(err) {
                    alert('Erro de rede.');
                }
            } else if (target.closest('.accept-btn') || target.closest('.reject-btn')) {
                const button = target.closest('button');
                const requestItem = button.closest('.friend-request-item');
                const requestId = requestItem.dataset.requestId;
                const action = button.classList.contains('accept-btn') ? 'aceite' : 'recusada';
                handleAction(button, '/friends/respond', '...', '', { requestId, action }, 'POST', true);
            } else if (target.closest('.cancel-request-btn')) {
                const button = target.closest('button');
                const requestItem = button.closest('.friend-request-item');
                const requestId = requestItem.dataset.requestId;
                handleAction(button, '/friends/cancel', 'Cancelando...', 'Cancelar', { requestId }, 'POST', true);
            }
        });

        serverIcons.forEach(icon => {
            icon.addEventListener('click', () => renderGroupView(icon.dataset.groupId));
        });
    }

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
                itemDiv.innerHTML = `<div class="search-result-info"> <img src="${item.Foto || '/images/default-group-icon.png'}" alt="${item.Nome}"> <div class="search-result-name"> <span>${item.Nome}</span> <span class="group-id-search">#${item.id_grupo}</span> </div> </div> <button class="join-btn" data-group-id="${item.id_grupo}">Entrar</button>`;
            } else { 
                itemDiv.innerHTML = `<div class="search-result-info"> <img src="${item.FotoPerfil || '/images/logo.png'}" alt="${item.Nome}"> <div class="search-result-name"><span>${item.Nome}</span></div> </div> <button class="add-friend-btn" data-user-id="${item.id_usuario}">Adicionar Amigo</button>`;
            }
            container.appendChild(itemDiv);
        });
    }

    async function handleAction(button, url, loadingText, defaultText, body = null, method = 'POST', reload = false) {
        button.disabled = true;
        if(button.tagName === 'BUTTON') button.textContent = loadingText;
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
                if(button.tagName === 'BUTTON') button.textContent = defaultText;
            }
        } catch (err) {
             alert('Ocorreu um erro de rede.');
             button.disabled = false;
             if(button.tagName === 'BUTTON') button.textContent = defaultText;
        }
    }
    
    // --- INICIALIZAÇÃO DA VIEW ---
    renderFriendsView();
    setupEventListeners();
});

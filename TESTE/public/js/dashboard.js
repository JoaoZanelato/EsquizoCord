document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Iniciando EsquizoCord...');
    
    // Verificar se Socket.IO está disponível
    if (typeof io === 'undefined') {
        console.error('Socket.IO não encontrado. Verifique se o script está incluído no HTML.');
        return;
    }
    
    // --- INICIALIZAÇÃO ---
    const socket = io();
    const body = document.querySelector('body');
    
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

    // --- SELEÇÃO DE ELEMENTOS DO DOM ---
    const createGroupModal = document.getElementById('create-group-modal');
    const editGroupModal = document.getElementById('edit-group-modal');
    const exploreModal = document.getElementById('explore-group-modal');
    
    const createGroupForm = document.getElementById('create-group-form');
    const editGroupForm = document.getElementById('edit-group-form');
    const searchGroupInput = document.getElementById('search-group-input');
    const searchGroupResults = document.getElementById('search-group-results');

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

    // --- FUNÇÕES DE MODAL (ADICIONADAS) ---
    function openModal(modal) {
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('active');
            console.log('Modal aberto:', modal.id);
        }
    }

    function closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
            console.log('Modal fechado:', modal.id);
        }
    }

    // --- LÓGICA DE SOCKET.IO ---
    socket.on('connect', () => {
        console.log('Conectado ao servidor de sockets com ID:', socket.id);
    });

    socket.on('new_group_message', (message) => {
        if (message.id_chat == currentChatId) {
            renderMessage(message);
        }
    });

    socket.on('disconnect', () => {
        console.log('Desconectado do servidor de sockets');
    });

    // --- FUNÇÕES DE RENDERIZAÇÃO ---
    function renderMessage(message) {
        if (!chatMessagesContainer) return;
        const messageItem = document.createElement('div');
        messageItem.classList.add('message-item');
        if (message.id_usuario === currentUserId) {
            messageItem.classList.add('sent');
        }
        messageItem.innerHTML = `
            <img src="${message.autorFoto || '/images/logo.png'}" alt="${message.autorNome}" style="width: 40px; height: 40px; border-radius: 50%;">
            <div class="message-content">
                ${message.id_usuario !== currentUserId ? `<span class="author-name" style="font-weight: bold; color: var(--brand-experiment); margin-bottom: 4px; display: block;">${message.autorNome}</span>` : ''}
                <p class="message-text" style="margin: 0; word-wrap: break-word;">${message.Conteudo}</p>
            </div>
        `;
        if (message.id_usuario === currentUserId) {
            messageItem.style.flexDirection = 'row-reverse';
            messageItem.style.textAlign = 'right';
        }
        messageItem.style.display = 'flex';
        messageItem.style.alignItems = 'flex-start';
        messageItem.style.gap = '12px';
        messageItem.style.marginBottom = '16px';
        
        chatMessagesContainer.appendChild(messageItem);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }

    async function loadAndRenderMessages(chatId) {
        if (!chatId) {
            if (chatMessagesContainer) chatMessagesContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">Selecione um canal para ver as mensagens.</p>';
            return;
        }
        try {
            const response = await fetch(`/groups/chats/${chatId}/messages`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const messages = await response.json();
            if (!chatMessagesContainer) return;
            chatMessagesContainer.innerHTML = '';
            if (messages.length === 0) {
                chatMessagesContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">Nenhuma mensagem ainda. Seja o primeiro a dizer olá!</p>';
            } else {
                messages.forEach(message => renderMessage(message));
            }
        } catch (error) {
            console.error("Erro ao carregar histórico de mensagens:", error);
            if (chatMessagesContainer) chatMessagesContainer.innerHTML = '<p style="text-align: center; color: var(--red-danger); padding: 20px;">Não foi possível carregar as mensagens.</p>';
        }
    }
    
    function renderFriendsView() {
        console.log('Renderizando view de amigos...');
        
        // Remover classe active de todos os server-icons
        document.querySelectorAll('.server-icon').forEach(icon => icon.classList.remove('active'));
        // Adicionar active ao home button
        if (homeButton) homeButton.classList.add('active');
        
        if(groupSettingsIcon) groupSettingsIcon.style.display = 'none';
        if(friendsNavContainer) friendsNavContainer.style.display = 'flex';
        if(groupNameHeader) groupNameHeader.textContent = "Amigos";
        if(chatHeader) chatHeader.innerHTML = `<h3>Mensagens Diretas</h3>`;
        if(chatInput) chatInput.placeholder = 'Conversar...';
        if(chatMessagesContainer) chatMessagesContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">Selecione um amigo para começar a conversar.</p>';

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
                friendDiv.innerHTML = `<img src="${friend.FotoPerfil || '/images/logo.png'}" alt="${friend.Nome}"> <span>${friend.Nome}</span>`;
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
                reqDiv.innerHTML = `
                    <div class="friend-item" style="flex-grow: 1;">
                        <img src="${req.FotoPerfil || '/images/logo.png'}" alt="${req.Nome}"> <span>${req.Nome}</span>
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
        channelListContent.innerHTML += '<div class="channel-list-header" style="margin-top: 20px;">Pedidos Enviados</div>';
        if (sentRequests && sentRequests.length > 0) {
            sentRequests.forEach(req => {
                const reqDiv = document.createElement('div');
                reqDiv.className = 'friend-request-item';
                reqDiv.dataset.requestId = req.id_amizade;
                reqDiv.innerHTML = `
                     <div class="friend-item" style="flex-grow: 1;">
                        <img src="${req.FotoPerfil || '/images/logo.png'}" alt="${req.Nome}"> <span>${req.Nome}</span>
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
        if (!groupId) {
            console.error('ID do grupo não fornecido');
            return;
        }

        console.log(`Carregando grupo ${groupId}...`);
        
        try {
            const response = await fetch(`/groups/${groupId}/details`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            currentGroupData = data;
            
            // Remover classe active de todos os ícones e adicionar ao selecionado
            document.querySelectorAll('.server-icon').forEach(icon => icon.classList.remove('active'));
            document.querySelector(`[data-group-id="${groupId}"]`)?.classList.add('active');
            
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
            console.error('Erro ao carregar grupo:', err);
            if(channelListContent) channelListContent.innerHTML = `<p style="color: var(--red-danger); padding: 20px;">Erro ao carregar detalhes: ${err.message}</p>`;
        }
    }
    
    // --- LÓGICA DE EVENTOS ---
    function setupEventListeners() {
        console.log('Configurando event listeners...');
        
        // Botões principais
        if (addServerButton) {
            console.log('Configurando botão adicionar servidor');
            addServerButton.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Clique no botão adicionar servidor');
                openModal(createGroupModal);
            });
        }
        
        if (exploreButton) {
            console.log('Configurando botão explorar');
            exploreButton.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Clique no botão explorar');
                openModal(exploreModal);
                exploreModal.querySelector('#search-group-input')?.dispatchEvent(new Event('input'));
            });
        }
        
        if (homeButton) {
            console.log('Configurando botão home');
            homeButton.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Clique no botão home');
                renderFriendsView();
            });
        }
        
        if (groupSettingsIcon) {
            groupSettingsIcon.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Clique nas configurações do grupo');
                if (currentGroupData) {
                    editGroupModal.querySelector('#edit-group-id').value = currentGroupData.details.id_grupo;
                    editGroupModal.querySelector('#edit-group-name').value = currentGroupData.details.Nome;
                    editGroupModal.querySelector('#edit-group-private').checked = currentGroupData.details.IsPrivate;
                    openModal(editGroupModal);
                }
            });
        }
        
        // Modais
        [createGroupModal, editGroupModal, exploreModal].forEach(modal => {
            if (!modal) return;
            
            const cancelBtn = modal.querySelector('.cancel-btn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    closeModal(modal);
                });
            }
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal(modal);
            });
        });
        
        // Navegação de amigos
        if (friendsNavContainer) {
            friendsNavContainer.addEventListener('click', e => {
                if (e.target.tagName === 'BUTTON') {
                    friendsNavContainer.querySelectorAll('.friends-nav-btn').forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');
                    const tab = e.target.dataset.tab;
                    console.log('Mudando para aba:', tab);
                    if (tab === 'friends-list') renderFriendsList();
                    else if (tab === 'pending-requests') renderPendingRequests();
                    else if (tab === 'add-friend') renderAddFriend();
                }
            });
        }
        
        // Formulários
        if (createGroupForm) {
            createGroupForm.addEventListener('submit', handleFormSubmit('/groups/criar', 'Erro ao criar grupo.'));
        }
        
        if (editGroupForm) {
            editGroupForm.addEventListener('submit', e => {
                const groupId = editGroupForm.querySelector('#edit-group-id').value;
                handleFormSubmit(`/groups/${groupId}/settings`, 'Erro ao atualizar grupo.')(e);
            });
        }
        
        if (deleteGroupButton) {
            deleteGroupButton.addEventListener('click', async (e) => {
                e.preventDefault();
                const groupId = document.getElementById('edit-group-id').value;
                const groupName = document.getElementById('edit-group-name').value;
                if (confirm(`Tem a certeza de que deseja excluir o grupo "${groupName}"? Esta ação é irreversível.`)) {
                    handleAction(deleteGroupButton, `/groups/${groupId}`, 'Excluindo...', 'Excluir Grupo', null, 'DELETE', true);
                }
            });
        }
        
        // Pesquisa de grupos
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
                        console.error('Erro ao pesquisar grupos:', err);
                        if (searchGroupResults) searchGroupResults.innerHTML = '<p>Erro ao pesquisar.</p>';
                    }
                }, 300);
            });
        }
        
        // Event delegation para botões dinâmicos
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
                    console.error('Erro ao buscar usuário:', err);
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

        // Server icons
        if (serverIcons && serverIcons.length > 0) {
            console.log('Configurando server icons:', serverIcons.length);
            serverIcons.forEach((icon, index) => {
                if (icon && icon.dataset.groupId) {
                    console.log(`Configurando server icon ${index + 1}:`, icon.dataset.groupId);
                    icon.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Clique no server icon:', icon.dataset.groupId);
                        renderGroupView(icon.dataset.groupId);
                    });
                }
            });
        } else {
            console.warn('Nenhum server-icon encontrado');
        }
        
        // Chat input
        if (chatInput) {
            chatInput.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const message = chatInput.value.trim();
                    if (message && currentChatId) {
                        try {
                            const response = await fetch('/groups/messages', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    chatId: currentChatId,
                                    content: message
                                })
                            });
                            
                            if (response.ok) {
                                chatInput.value = '';
                            } else {
                                console.error('Erro ao enviar mensagem');
                            }
                        } catch (error) {
                            console.error('Erro de rede ao enviar mensagem:', error);
                        }
                    }
                }
            });
        }
    }

    // --- FUNÇÕES DE MANIPULAÇÃO DE DADOS ---
    async function handleFormSubmit(url, errorMessage) {
        return async function(event) {
            event.preventDefault();
            const formData = new FormData(event.target);
            try {
                const response = await fetch(url, { method: 'POST', body: formData });
                if (response.ok) {
                    window.location.reload();
                } else {
                    const data = await response.json();
                    alert(`${errorMessage}: ${data.message}`);
                }
            } catch (err) {
                console.error('Erro no formulário:', err);
                alert('Ocorreu um erro de rede. Tente novamente.');
            }
        }
    }

    function renderSearchResults(results, container, isGroupSearch) {
        if (!container) return;
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
             console.error('Erro na ação:', err);
             alert('Ocorreu um erro de rede.');
             button.disabled = false;
             if(button.tagName === 'BUTTON') button.textContent = defaultText;
        }
    }
    
    // --- FUNÇÃO DE DEBUG ---
    function debugDashboard() {
        console.log('=== DEBUG DASHBOARD ===');
        console.log('currentUser:', currentUser);
        console.log('currentUserId:', currentUserId);
        console.log('groups:', groups);
        console.log('serverIcons count:', serverIcons ? serverIcons.length : 0);
        console.log('addServerButton:', addServerButton);
        console.log('homeButton:', homeButton);
        console.log('exploreButton:', exploreButton);
        console.log('Socket connected:', socket && socket.connected);
        console.log('========================');
    }
    
    // --- INICIALIZAÇÃO DA VIEW ---
    renderFriendsView();
    setupEventListeners();
    
    // Debug após 1 segundo
    setTimeout(debugDashboard, 1000);
    
    console.log('EsquizoCord inicializado com sucesso!');
});
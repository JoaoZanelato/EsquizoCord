document.addEventListener('DOMContentLoaded', () => {
    // --- INICIALIZAÇÃO ---
    const socket = io();
    const body = document.querySelector('body');

    // --- ESTADO GLOBAL ---
    let currentGroupData = null;
    let currentChatId = null;
    let currentDmFriendId = null;
    let currentDmFriendData = null;
    let isCurrentUserAdmin = false;
    let replyingToMessageId = null;


    // --- PARSE DE DADOS INICIAIS ---
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
    const chatHeader = document.getElementById('chat-header');
    const chatMessagesContainer = document.getElementById('chat-messages-container');
    const chatInput = document.querySelector('.chat-input-bar input');
    const chatInputContainer = document.querySelector('.chat-input-bar');
    const replyBar = document.getElementById('reply-bar'); 
    const replyBarText = document.getElementById('reply-bar-text'); 
    const cancelReplyBtn = document.getElementById('cancel-reply-btn'); 

    // --- LÓGICA DE SOCKET.IO (SIMPLIFICADA) ---
    socket.on('connect', () => console.log('Conectado ao servidor de sockets com ID:', socket.id));

    socket.on('new_group_message', (message) => {
        if (message.id_chat == currentChatId) {
            renderMessage(message);
        }
    });

    socket.on('group_message_deleted', (data) => {
    if (data.chatId == currentChatId) {
        const messageElement = chatMessagesContainer.querySelector(`[data-message-id='${data.messageId}']`);
        if (messageElement) {
            messageElement.remove();
        }
    }
});

socket.on('dm_message_deleted', (data) => {
    // Verifica se a DM ativa corresponde à mensagem deletada
    if (currentDmFriendId) {
        const messageElement = chatMessagesContainer.querySelector(`[data-message-id='${data.messageId}']`);
        if (messageElement) {
            messageElement.remove();
        }
    }
});

    socket.on('new_dm', (message) => {
        if (currentDmFriendData &&
            ((message.id_remetente == currentDmFriendId && message.id_destinatario == currentUserId) ||
            (message.id_destinatario == currentDmFriendId && message.id_remetente == currentUserId))) {
            renderMessage({
                ...message,
                id_usuario: message.id_remetente,
                autorNome: message.id_remetente === currentUserId ? currentUser.Nome : currentDmFriendData.nome,
                autorFoto: message.id_remetente === currentUserId ? currentUser.FotoPerfil : currentDmFriendData.foto
            });
        }
    });

    // --- FUNÇÕES DE RENDERIZAÇÃO E UI ---
    function openModal(modal) { if (modal) modal.style.display = 'flex'; }
    function closeModal(modal) { if (modal) modal.style.display = 'none'; }

 // Em public/js/dashboard.js, substitua a função renderMessage
function renderMessage(message) {
    if (!chatMessagesContainer) return;
    const messageItem = document.createElement('div');
    messageItem.classList.add('message-item');
    messageItem.dataset.messageId = message.id_mensagem;
    messageItem.dataset.authorName = message.autorNome; // Guarda o nome do autor
    messageItem.dataset.messageContent = message.Conteudo; // Guarda o conteúdo

    const isSentByMe = message.id_usuario === currentUserId;
    if (isSentByMe) messageItem.classList.add('sent');

    const canDelete = isSentByMe || (currentGroupData && isCurrentUserAdmin);
    
    // Mostra ícones de ação (resposta e exclusão)
    const actionsHTML = `
        <div class="message-actions">
            <i class="fas fa-reply reply-message-btn" title="Responder"></i>
            ${canDelete ? `<i class="fas fa-trash delete-message-btn" title="Excluir mensagem"></i>` : ''}
        </div>`;
        
    // Cria o bloco de citação se for uma resposta
    let replyHTML = '';
    if (message.repliedTo && message.repliedTo.Conteudo) {
        const sanitizedRepliedContent = DOMPurify.sanitize(message.repliedTo.Conteudo);
        replyHTML = `
            <div class="reply-context">
                <span class="reply-author">${message.repliedTo.autorNome}</span>
                <p class="reply-content">${sanitizedRepliedContent}</p>
            </div>`;
    }

    const sanitizedContent = DOMPurify.sanitize(message.Conteudo);

    messageItem.innerHTML = `
        <img src="${message.autorFoto || '/images/logo.png'}" alt="${message.autorNome}">
        <div class="message-content">
            ${replyHTML}
            ${!isSentByMe ? `<span class="author-name">${message.autorNome}</span>` : ''}
            <p class="message-text">${sanitizedContent}</p>
        </div>
        ${actionsHTML}`;

    chatMessagesContainer.appendChild(messageItem);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

    async function loadAndRenderMessages(url) {
        if (!chatMessagesContainer) return;
        chatMessagesContainer.innerHTML = '<p>Carregando mensagens...</p>';
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Falha ao buscar mensagens.");
            const messages = await response.json();
            
            chatMessagesContainer.innerHTML = '';
            if (messages.length === 0) {
                chatMessagesContainer.innerHTML = '<p>Nenhuma mensagem ainda. Seja o primeiro a dizer olá!</p>';
            } else {
                messages.forEach(renderMessage);
            }
        } catch (error) {
            console.error("Erro ao carregar mensagens:", error);
            chatMessagesContainer.innerHTML = '<p>Não foi possível carregar o histórico de mensagens.</p>';
        }
    }
    
    function renderFriendsView() {
        currentGroupData = null; currentChatId = null; currentDmFriendId = null; currentDmFriendData = null;
        if (groupSettingsIcon) groupSettingsIcon.style.display = 'none';
        if (friendsNavContainer) friendsNavContainer.style.display = 'flex';
        if (groupNameHeader) groupNameHeader.textContent = "Amigos";
        if (chatHeader) chatHeader.innerHTML = `<h3>Mensagens Diretas</h3>`;
        if (chatInput) { chatInput.placeholder = 'Selecione um amigo para conversar...'; chatInput.disabled = true; }
        if (chatMessagesContainer) chatMessagesContainer.innerHTML = '<p>Selecione um amigo para começar a conversar.</p>';
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
                friendDiv.dataset.friendId = friend.id_usuario;
                friendDiv.dataset.friendName = friend.Nome;
                friendDiv.dataset.friendPhoto = friend.FotoPerfil || '/images/logo.png';
                friendDiv.innerHTML = `<img src="${friend.FotoPerfil ||'/images/logo.png'}"><span>${friend.Nome}</span>`;
                channelListContent.appendChild(friendDiv);
            });
        } else {
            channelListContent.innerHTML += '<p style="padding: 8px; color: var(--text-muted);">Sua lista de amigos está vazia.</p>';
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
            if (!response.ok) throw new Error('Falha ao buscar detalhes do grupo.');
            
            const data = await response.json();
            currentGroupData = data;
            currentDmFriendId = null;
            
            if (friendsNavContainer) friendsNavContainer.style.display = 'none';
            if (groupNameHeader) groupNameHeader.textContent = data.details.Nome;
            if (groupSettingsIcon) groupSettingsIcon.style.display = data.details.id_criador === currentUserId ? 'block' : 'none';
            if (!channelListContent) return;
            
            const firstChannel = data.channels[0];
            if (firstChannel) {
                currentChatId = firstChannel.id_chat;
                socket.emit('join_group_room', groupId);
                if (chatHeader) chatHeader.innerHTML = `<h3><i class="fas fa-hashtag" style="color: var(--text-muted);"></i> ${firstChannel.Nome}</h3>`;
                if (chatInput) { chatInput.placeholder = `Conversar em #${firstChannel.Nome}`; chatInput.disabled = false; }
                loadAndRenderMessages(`/groups/chats/${currentChatId}/messages`);
            } else {
                currentChatId = null;
                if (chatHeader) chatHeader.innerHTML = `<h3>Sem canais de texto</h3>`;
                if (chatInput) { chatInput.placeholder = `Crie um canal para começar a conversar.`; chatInput.disabled = true; }
                if (chatMessagesContainer) chatMessagesContainer.innerHTML = '';
            }

            channelListContent.innerHTML = '';
            const memberHeader = document.createElement('div');
            memberHeader.className = 'channel-list-header';
            memberHeader.textContent = `MEMBROS - ${data.members.length}`;
            channelListContent.appendChild(memberHeader);
            data.members.forEach(member => {
                const memberDiv = document.createElement('div');
                memberDiv.className = 'friend-item';
                memberDiv.innerHTML = `<img src="${member.FotoPerfil || '/images/logo.png'}" alt="${member.Nome}"><span>${member.Nome}</span>${member.isAdmin ? '<i class="fas fa-crown admin-icon" title="Administrador"></i>' : ''}`;
                channelListContent.appendChild(memberDiv);
            });
            isCurrentUserAdmin = data.members.some(member => member.id_usuario === currentUserId && member.isAdmin);
        } catch (err) {
            console.error('Erro ao carregar grupo:', err);
        }
    }

    function renderDmView(friendId, friendName, friendPhoto) {
        currentChatId = null;
        currentGroupData = null;
        currentDmFriendId = friendId;
        currentDmFriendData = { id: friendId, nome: friendName, foto: friendPhoto };

        socket.emit('join_dm_room', [currentUserId, friendId].sort().join('-'));
        if (chatHeader) chatHeader.innerHTML = `<h3><img src="${friendPhoto}" style="width: 24px; height: 24px; border-radius: 50%; margin-right: 8px;">${friendName}</h3>`;
        if (chatInput) { chatInput.placeholder = `Conversar com ${friendName}`; chatInput.disabled = false; }
        loadAndRenderMessages(`/friends/dm/${friendId}/messages`);
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

    // --- SETUP DE EVENT LISTENERS ---
    function setupEventListeners() {
        const chatHeaderEl = document.getElementById('chat-header');
const serverList = document.querySelector('.server-list');
const channelList = document.querySelector('.channel-list');

if (chatHeaderEl) {
    chatHeaderEl.addEventListener('click', (e) => {
        // Verifica se o clique foi no ícone do menu (renderizado pelo CSS via ::before)
        // e se a tela é pequena.
        if (window.innerWidth <= 768 && e.target === chatHeaderEl) {
             if (window.innerWidth <= 480) {
                 // Em celulares, o menu abre a lista de servidores
                 serverList.classList.toggle('open');
             } else {
                 // Em tablets, o menu abre a lista de canais/amigos
                 channelList.classList.toggle('open');
             }
        }
    });
}

// Fecha os painéis se clicar fora deles
document.body.addEventListener('click', (e) => {
    if (window.innerWidth > 768) return;

    // Se o painel estiver aberto e o clique for fora dele e fora do menu
    if (channelList.classList.contains('open') && !channelList.contains(e.target) && !chatHeaderEl.contains(e.target)) {
        channelList.classList.remove('open');
    }
     if (serverList.classList.contains('open') && !serverList.contains(e.target) && !chatHeaderEl.contains(e.target)) {
        serverList.classList.remove('open');
    }
});
        chatMessagesContainer.addEventListener('click', async (e) => {
    // Manipulador para o botão de RESPONDER
    if (e.target.classList.contains('reply-message-btn')) {
        const messageItem = e.target.closest('.message-item');
        if (!messageItem) return;

        replyingToMessageId = messageItem.dataset.messageId;
        const author = messageItem.dataset.authorName;
        const content = messageItem.dataset.messageContent;
        
        // Atualiza a barra de resposta e a exibe
        replyBarText.innerHTML = `Respondendo a <strong>${author}</strong>: ${content.substring(0, 50)}...`;
        replyBar.style.display = 'flex';
        chatInput.focus();
    }

    // Manipulador para o botão de EXCLUIR
    if (e.target.classList.contains('delete-message-btn')) {
        const messageItem = e.target.closest('.message-item');
        const messageId = messageItem.dataset.messageId;

        if (!messageId) return;

        // Pede confirmação ao usuário
        if (confirm('Tem certeza de que deseja excluir esta mensagem?')) {
            try {
                let url;
                // Determina a URL correta com base no contexto (grupo ou DM)
                if (currentChatId) {
                    url = `/groups/messages/${messageId}`;
                } else if (currentDmFriendId) {
                    url = `/friends/dm/messages/${messageId}`;
                } else {
                    return; // Sai se não estiver em um chat válido
                }

                const response = await fetch(url, { method: 'DELETE' });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.message || 'Falha ao excluir a mensagem.');
                }
                
                // A remoção visual da mensagem será tratada pelo evento do socket
                // para garantir que todos os clientes vejam a atualização.

            } catch (error) {
                console.error('Erro ao excluir mensagem:', error);
                alert(error.message);
            }
        }
    }
});
        if (addServerButton) addServerButton.addEventListener('click', () => openModal(createGroupModal));
        if (exploreButton) {
            exploreButton.addEventListener('click', () => {
                openModal(exploreModal);
                searchGroupInput?.dispatchEvent(new Event('input'));
            });
        }

        [createGroupModal, editGroupModal, exploreModal].forEach(modal => {
            if (!modal) return;
            modal.querySelector('.cancel-btn')?.addEventListener('click', () => closeModal(modal));
            modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });
        });

        document.querySelector('.server-list')?.addEventListener('click', (e) => {
            const serverIcon = e.target.closest('.server-icon[data-group-id]');
            if (serverIcon) {
                document.querySelectorAll('.server-icon').forEach(i => i.classList.remove('active'));
                serverIcon.classList.add('active');
                renderGroupView(serverIcon.dataset.groupId);
            }
        });
        
        if (homeButton) {
            homeButton.addEventListener('click', () => {
                document.querySelectorAll('.server-icon').forEach(i => i.classList.remove('active'));
                homeButton.classList.add('active');
                renderFriendsView();
            });
        }
        
        if(friendsNavContainer) {
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
        
        channelListContent.addEventListener('click', (e) => {
             const friendItem = e.target.closest('.friend-item[data-friend-id]');
             if (friendItem) {
                 renderDmView(friendItem.dataset.friendId, friendItem.dataset.friendName, friendItem.dataset.friendPhoto);
             }
        });

        if (groupSettingsIcon) {
            groupSettingsIcon.addEventListener('click', () => {
                if (currentGroupData) {
                    editGroupModal.querySelector('#edit-group-id').value = currentGroupData.details.id_grupo;
                    editGroupModal.querySelector('#edit-group-name').value = currentGroupData.details.Nome;
                    editGroupModal.querySelector('#edit-group-private').checked = currentGroupData.details.IsPrivate;
                    openModal(editGroupModal);
                }
            });
        }
        
        if (deleteGroupButton) {
            deleteGroupButton.addEventListener('click', async () => {
                const groupId = editGroupModal.querySelector('#edit-group-id').value;
                const groupName = editGroupModal.querySelector('#edit-group-name').value;
                if (!groupId) return;

                if (confirm(`Tem a certeza de que deseja excluir o grupo "${groupName}"? Esta ação é irreversível.`)) {
                    await handleAction(
                        deleteGroupButton,
                        `/groups/${groupId}`,
                        'Excluindo...',
                        'Excluir Grupo',
                        null,
                        'DELETE',
                        true
                    );
                }
            });
        }

        if (chatInput) {
    chatInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && chatInput.value.trim() !== '') {
            e.preventDefault();
            const messageContent = chatInput.value.trim();
            chatInput.value = '';

            const body = { 
                content: messageContent,
                replyingToMessageId: replyingToMessageId // Envia o ID da resposta
            };

            // Resetar o estado de resposta
            replyingToMessageId = null;
            replyBar.style.display = 'none';
            
            let url;
            if (currentChatId) {
                url = `/groups/chats/${currentChatId}/messages`;
            } else if (currentDmFriendId) {
                url = `/friends/dm/${currentDmFriendId}/messages`;
            } else {
                return;
            }
            
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body) // Envia o corpo completo
                });
                if (!response.ok) throw new Error('Server error');
            } catch (error) {
                console.error('ERRO ao enviar mensagem:', error);
                alert("Não foi possível enviar a mensagem.");
                chatInput.value = messageContent; // Devolve o texto em caso de erro
            }
        }
    });
}
        
        if(createGroupForm) createGroupForm.addEventListener('submit', (e) => { e.preventDefault(); handleFormSubmit('/groups/criar', 'Erro ao criar grupo', () => window.location.reload(), e.target) });
        if(editGroupForm) editGroupForm.addEventListener('submit', (e) => { e.preventDefault(); const id = e.target.querySelector('#edit-group-id').value; handleFormSubmit(`/groups/${id}/settings`, 'Erro ao editar', () => window.location.reload(), e.target) });
        
        document.body.addEventListener('click', async (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            if (button.classList.contains('join-btn')) {
                const groupId = button.dataset.groupId;
                handleAction(button, `/groups/${groupId}/join`, 'Entrando...', 'Entrar', null, 'POST', true);
            }
            else if (button.id === 'add-friend-submit') {
                const input = document.getElementById('add-friend-input');
                if (input && input.value.trim()) {
                    // Modificado para enviar o nome do usuário em vez de fazer outra busca
                    handleAction(button, '/friends/request', 'Enviando...', 'Enviar Pedido', { username: input.value.trim() }, 'POST');
                }
            }
            else if (button.classList.contains('accept-btn') || button.classList.contains('reject-btn')) {
                const requestItem = button.closest('.friend-request-item');
                const requestId = requestItem?.dataset.requestId;
                const action = button.classList.contains('accept-btn') ? 'aceite' : 'recusada';
                if (requestId) {
                    handleAction(button, '/friends/respond', '...', '', { requestId, action }, 'POST', true);
                }
            }
            else if (button.classList.contains('cancel-request-btn')) {
                const requestItem = button.closest('.friend-request-item');
                const requestId = requestItem?.dataset.requestId;
                if (requestId) {
                    handleAction(button, '/friends/cancel', 'Cancelando...', '', { requestId }, 'POST', true);
                }
            }
        });

        let searchTimeout;
        if (searchGroupInput) {
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
                        console.error('Erro na pesquisa de grupo:', err);
                        if (searchGroupResults) searchGroupResults.innerHTML = '<p>Erro ao pesquisar.</p>';
                    }
                }, 300);
            });
        }
    }

    async function handleFormSubmit(url, errorMessage, onSuccess, formElement) {
        const formData = new FormData(formElement);
        try {
            const response = await fetch(url, { method: 'POST', body: formData });
            if (response.ok) {
                onSuccess();
            } else {
                const res = await response.json();
                alert(`${errorMessage}: ${res.message}`);
            }
        } catch (err) {
            console.error('Erro de rede:', err);
            alert('Erro de rede.');
        }
    }

    async function handleAction(button, url, loadingText, defaultText, body = null, method = 'POST', reload = false) {
        if (!button) return;
        button.disabled = true;
        const originalText = button.textContent;
        if(button.tagName === 'BUTTON') button.textContent = loadingText;
        
        try {
            const options = { method, headers: {} };
            if (body) {
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(body);
            }
            const response = await fetch(url, options);
            
            if (response.status === 204 || response.headers.get("content-length") === "0") {
                 if (reload) {
                    window.location.reload();
                }
                return;
            }

            const data = await response.json();
            
            if (response.ok) {
                if (reload) {
                    window.location.reload();
                } else if (data.message) {
                    alert(data.message);
                }
            } else {
                throw new Error(data.message || 'Erro desconhecido');
            }
        } catch (err) {
            alert(err.message);
        } finally {
             if(!reload){
                button.disabled = false;
                button.textContent = defaultText || originalText;
            }
        }
    }
    
    // --- INICIALIZAÇÃO DA APLICAÇÃO ---
    function main() {
        renderFriendsView();
        setupEventListeners();
        console.log('Dashboard inicializado.');
    }

    main();
});
document.addEventListener('DOMContentLoaded', () => {
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

    // Elementos dos Modais
    const createGroupModal = document.getElementById('create-group-modal');
    const editGroupModal = document.getElementById('edit-group-modal');
    const searchGroupModal = document.getElementById('search-group-modal');
    
    // Formulários e Inputs
    const createGroupForm = document.getElementById('create-group-form');
    const editGroupForm = document.getElementById('edit-group-form');
    const searchGroupInput = document.getElementById('search-group-input');
    const searchResultsContainer = document.getElementById('search-results');

    // Botões de Ação
    const addServerButton = document.getElementById('add-server-button');
    const searchServerButton = document.getElementById('search-server-button');
    const groupSettingsIcon = document.getElementById('group-settings-icon');
    const deleteGroupButton = document.getElementById('delete-group-btn');

    // Elementos de exibição
    const serverIcons = document.querySelectorAll('.server-icon[data-group-id]');
    const groupNameHeader = document.getElementById('group-name-header');
    const channelListContent = document.getElementById('channel-list-content');
    const chatHeader = document.getElementById('chat-header');

    function closeModal(modal) {
        if(modal) modal.style.display = 'none';
    }

    function openModal(modal) {
        if(modal) modal.style.display = 'flex';
    }

    // --- Event Listeners ---
    addServerButton.addEventListener('click', () => openModal(createGroupModal));
    searchServerButton.addEventListener('click', () => {
        openModal(searchGroupModal);
        // Dispara uma pesquisa inicial para listar todos os grupos públicos
        searchGroupInput.dispatchEvent(new Event('input'));
    });
    groupSettingsIcon.addEventListener('click', () => {
        if (currentGroupData) {
            document.getElementById('edit-group-id').value = currentGroupData.details.id_grupo;
            document.getElementById('edit-group-name').value = currentGroupData.details.Nome;
            document.getElementById('edit-group-private').checked = currentGroupData.details.IsPrivate;
            openModal(editGroupModal);
        }
    });

    [createGroupModal, editGroupModal, searchGroupModal].forEach(modal => {
        if (!modal) return;
        modal.querySelector('.cancel-btn').addEventListener('click', () => closeModal(modal));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal);
        });
    });

    createGroupForm.addEventListener('submit', handleFormSubmit('/groups/criar', 'Erro ao criar grupo.'));
    editGroupForm.addEventListener('submit', e => {
        const groupId = editGroupForm.querySelector('#edit-group-id').value;
        handleFormSubmit(`/groups/${groupId}/settings`, 'Erro ao atualizar grupo.')(e);
    });

    deleteGroupButton.addEventListener('click', async () => {
        const groupId = document.getElementById('edit-group-id').value;
        const groupName = document.getElementById('edit-group-name').value;
        
        if (confirm(`Tem a certeza de que deseja excluir o grupo "${groupName}"? Esta ação é irreversível.`)) {
            try {
                const response = await fetch(`/groups/${groupId}`, { method: 'DELETE' });
                if (response.ok) {
                    alert('Grupo excluído com sucesso.');
                    window.location.reload();
                } else {
                    alert('Erro ao excluir grupo: ' + (await response.json()).message);
                }
            } catch (err) {
                alert('Ocorreu um erro de rede.');
            }
        }
    });

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

    let searchTimeout;
    searchGroupInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value;
        searchTimeout = setTimeout(async () => {
            try {
                const response = await fetch(`/groups/search?q=${encodeURIComponent(query)}`);
                const groups = await response.json();
                renderSearchResults(groups);
            } catch (err) {
                searchResultsContainer.innerHTML = '<p>Erro ao pesquisar.</p>';
            }
        }, 300); // Debounce de 300ms
    });

    function renderSearchResults(groups) {
        searchResultsContainer.innerHTML = '';
        if (groups.length === 0) {
            searchResultsContainer.innerHTML = '<p>Nenhum grupo encontrado.</p>';
            return;
        }
        groups.forEach(group => {
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
            searchResultsContainer.appendChild(item);
        });
    }
    
    searchResultsContainer.addEventListener('click', async (e) => {
        if (e.target.classList.contains('join-btn')) {
            const groupId = e.target.dataset.groupId;
            e.target.disabled = true;
            e.target.textContent = 'Entrando...';
            try {
                const response = await fetch(`/groups/${groupId}/join`, { method: 'POST' });
                if (response.ok) window.location.reload();
                else {
                    alert(`Erro ao entrar no grupo: ${(await response.json()).message}`);
                    e.target.disabled = false;
                    e.target.textContent = 'Entrar';
                }
            } catch (err) {
                 alert('Ocorreu um erro de rede.');
                 e.target.disabled = false;
                 e.target.textContent = 'Entrar';
            }
        }
    });

    // Listar detalhes ao clicar num grupo
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
                groupSettingsIcon.style.display = (currentUserId === data.details.id_criador) ? 'block' : 'none';
                
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
});

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
    
    // Formulários
    const createGroupForm = document.getElementById('create-group-form');
    const editGroupForm = document.getElementById('edit-group-form');

    // Botões de Ação
    const addServerButton = document.getElementById('add-server-button');
    const groupSettingsIcon = document.getElementById('group-settings-icon');

    // Listagem
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

    // Eventos para abrir e fechar modais
    if(addServerButton) {
        addServerButton.addEventListener('click', () => openModal(createGroupModal));
    }
    if(groupSettingsIcon) {
        groupSettingsIcon.addEventListener('click', () => {
            if (currentGroupData) {
                document.getElementById('edit-group-id').value = currentGroupData.details.id_grupo;
                document.getElementById('edit-group-name').value = currentGroupData.details.Nome;
                document.getElementById('edit-group-private').checked = currentGroupData.details.IsPrivate;
                openModal(editGroupModal);
            }
        });
    }

    [createGroupModal, editGroupModal].forEach(modal => {
        if (!modal) return;
        modal.querySelector('.cancel-btn').addEventListener('click', () => closeModal(modal));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal);
        });
    });

    // Submeter formulário de CRIAR grupo
    if(createGroupForm) {
        createGroupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(createGroupForm);
            if (!document.getElementById('group-private-create').checked) {
                formData.delete('isPrivate');
            }
            
            try {
                const response = await fetch('/groups/criar', { method: 'POST', body: formData });
                if (response.ok) window.location.reload();
                else alert('Erro ao criar grupo: ' + (await response.json()).message);
            } catch (err) {
                alert('Ocorreu um erro de rede. Tente novamente.');
            }
        });
    }

    // Submeter formulário de EDITAR grupo
    if(editGroupForm) {
        editGroupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(editGroupForm);
            const groupId = formData.get('groupId');
            
            try {
                const response = await fetch(`/groups/${groupId}/settings`, { method: 'POST', body: formData });
                if (response.ok) window.location.reload();
                else alert('Erro ao atualizar grupo: ' + (await response.json()).message);
            } catch (err) {
                 alert('Ocorreu um erro de rede. Tente novamente.');
            }
        });
    }

    // Listar canais ao clicar num grupo
    serverIcons.forEach(icon => {
        icon.addEventListener('click', async () => {
            serverIcons.forEach(i => i.classList.remove('active'));
            icon.classList.add('active');

            const groupId = icon.dataset.groupId;
            
            try {
                const response = await fetch(`/groups/${groupId}/details`);
                const data = await response.json();
                currentGroupData = data; // Armazena os dados do grupo atual

                // Atualiza os cabeçalhos
                groupNameHeader.textContent = data.details.Nome;
                chatHeader.innerHTML = `<h3># ${data.channels[0]?.Nome || 'geral'}</h3><span class="group-id">#${data.details.id_grupo}</span>`;
                
                // Mostra ou esconde o botão de configurações
                if (groupSettingsIcon) {
                    groupSettingsIcon.style.display = (currentUserId === data.details.id_criador) ? 'block' : 'none';
                }

                // Limpa a lista
                channelListContent.innerHTML = '';
                
                // Popula com canais
                const channelHeaderEl = document.createElement('div');
                channelHeaderEl.className = 'channel-list-header';
                channelHeaderEl.textContent = 'CANAIS DE TEXTO';
                channelListContent.appendChild(channelHeaderEl);
                data.channels.forEach(channel => {
                    const channelDiv = document.createElement('div');
                    channelDiv.className = 'channel-item';
                    channelDiv.innerHTML = `<i class="fas fa-hashtag" style="color: var(--text-muted);"></i> <span>${channel.Nome}</span>`;
                    channelListContent.appendChild(channelDiv);
                });

                // Popula com membros
                const memberHeader = document.createElement('div');
                memberHeader.className = 'channel-list-header';
                memberHeader.style.marginTop = '20px';
                memberHeader.textContent = `MEMBROS - ${data.members.length}`;
                channelListContent.appendChild(memberHeader);
                data.members.forEach(member => {
                    const memberDiv = document.createElement('div');
                    memberDiv.className = 'friend-item';
                    let memberHTML = `
                        <img src="${member.FotoPerfil || '/images/logo.png'}" alt="${member.Nome}">
                        <span>${member.Nome}</span>
                    `;
                    if (member.isAdmin) {
                        memberHTML += `<i class="fas fa-crown admin-icon" title="Administrador"></i>`;
                    }
                    memberDiv.innerHTML = memberHTML;
                    channelListContent.appendChild(memberDiv);
                });

            } catch (err) {
                if(channelListContent) channelListContent.innerHTML = '<p>Erro ao carregar canais.</p>';
            }
        });
    });
});

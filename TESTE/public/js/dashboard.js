console.log("Ficheiro dashboard.js carregado.");

document.addEventListener('DOMContentLoaded', () => {
    console.log("Evento DOMContentLoaded disparado. A iniciar script do dashboard.");

    const body = document.querySelector('body');
    const userData = body.dataset.user;
    
    let currentUserId = null;
    let currentUser = null;
    
    if (userData) {
        try {
            currentUser = JSON.parse(userData);
            if (currentUser) {
                currentUserId = currentUser.id_usuario;
                console.log("Utilizador logado:", currentUserId);
            }
        } catch (e) {
            console.error("Erro ao processar dados do utilizador:", e);
        }
    } else {
        console.warn("Nenhum dado de utilizador encontrado no data attribute.");
    }

    let currentGroupData = null;

    // Elementos dos Modais
    const createGroupModal = document.getElementById('create-group-modal');
    const editGroupModal = document.getElementById('edit-group-modal');
    
    // Formulários
    const createGroupForm = document.getElementById('create-group-form');
    
    // Botões de Ação
    const addServerButton = document.getElementById('add-server-button');
    
    function closeModal(modal) {
        if(modal) modal.style.display = 'none';
    }

    function openModal(modal) {
        if(modal) modal.style.display = 'flex';
    }

    // Eventos para abrir e fechar modais
    if(addServerButton) {
        console.log("Botão 'Adicionar Servidor' encontrado.");
        addServerButton.addEventListener('click', () => {
            console.log("Botão 'Adicionar Servidor' clicado. A abrir modal.");
            openModal(createGroupModal)
        });
    } else {
        console.error("ERRO: Botão 'Adicionar Servidor' não encontrado.");
    }

    if (createGroupModal) {
        createGroupModal.querySelector('.cancel-btn').addEventListener('click', () => closeModal(createGroupModal));
        createGroupModal.addEventListener('click', (e) => {
            if (e.target === createGroupModal) closeModal(createGroupModal);
        });
    }

    // Submeter formulário de CRIAR grupo
    if(createGroupForm) {
        console.log("Formulário de criação de grupo encontrado. A adicionar listener de submit.");
        createGroupForm.addEventListener('submit', async (e) => {
            console.log("Formulário de criação de grupo submetido.");
            e.preventDefault(); // Impede o envio padrão do formulário
            
            const formData = new FormData(createGroupForm);
            
            try {
                console.log("A enviar pedido POST para /groups/criar...");
                const response = await fetch('/groups/criar', { method: 'POST', body: formData });
                
                if (response.ok) {
                    console.log("Grupo criado com sucesso. A recarregar a página.");
                    window.location.reload();
                } else {
                    const errorData = await response.json();
                    console.error("Erro do servidor ao criar grupo:", errorData);
                    alert('Erro ao criar grupo: ' + (errorData.message || 'Erro desconhecido'));
                }
            } catch (err) {
                console.error("Erro de rede ao criar grupo:", err);
                alert('Ocorreu um erro de rede. Tente novamente.');
            }
        });A
    } else {
        console.error("ERRO: Formulário de criação de grupo não encontrado.");
    }
    
    // A lógica para editar grupos e listar canais/membros iria aqui...
    // Esta parte foi omitida para focar no diagnóstico do problema de criação.
});

document.addEventListener("DOMContentLoaded", () => {
  // --- INICIALIZAÇÃO ---
  const socket = io();
  const body = document.querySelector("body");

  // --- FUNÇÃO PARA FORMATAR NOME DE USUÁRIO COM ID ---
  const formatUserTag = (name, id) =>
    `${name}<span class="user-tag">#${id}</span>`;

  // --- ESTADO GLOBAL ---
  let currentGroupData = null,
    currentChatId = null,
    currentDmFriendId = null,
    currentDmFriendData = null;
  let isCurrentUserAdmin = false,
    replyingToMessageId = null;

  // --- PARSE DE DADOS INICIAIS ---
  const parseJsonData = (attribute) => {
    const data = body.dataset[attribute];
    if (!data) return null;
    try {
      const decodedData = new DOMParser().parseFromString(data, "text/html")
        .documentElement.textContent;
      return JSON.parse(decodedData);
    } catch (e) {
      console.error(
        `Erro ao fazer o parse do atributo de dados: ${attribute}`,
        data,
        e
      );
      return null;
    }
  };

  const currentUser = parseJsonData("user");
  const groups = parseJsonData("groups") || [];
  const friends = parseJsonData("friends") || [];
  const pendingRequests = parseJsonData("pendingRequests") || [];
  const sentRequests = parseJsonData("sentRequests") || [];
  const currentUserId = currentUser ? currentUser.id_usuario : null;

  // --- SELEÇÃO DE ELEMENTOS DO DOM ---
  const createGroupModal = document.getElementById("create-group-modal"),
    editGroupModal = document.getElementById("edit-group-modal"),
    exploreModal = document.getElementById("explore-group-modal");
  const createGroupForm = document.getElementById("create-group-form"),
    editGroupForm = document.getElementById("edit-group-form");
  const searchGroupInput = document.getElementById("search-group-input");
  const addServerButton = document.getElementById("add-server-button"),
    exploreButton = document.getElementById("explore-button"),
    homeButton = document.getElementById("home-button");
  const friendsNavContainer = document.getElementById("friends-nav-container");
  const groupNameHeader = document.getElementById("group-name-header"),
    channelListContent = document.getElementById("channel-list-content"),
    groupSettingsIcon = document.getElementById("group-settings-icon");
  const deleteGroupButton = document.getElementById("delete-group-btn");
  const chatArea = document.querySelector(".chat-area");
  const chatHeader = document.getElementById("chat-header"),
    chatMessagesContainer = document.getElementById("chat-messages-container");
  const chatInput = document.querySelector(".chat-input-bar input");
  const replyBar = document.getElementById("reply-bar"),
    replyBarText = document.getElementById("reply-bar-text"),
    cancelReplyBtn = document.getElementById("cancel-reply-btn");
  const serverList = document.querySelector(".server-list"),
    channelList = document.querySelector(".channel-list");
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");

  // --- LÓGICA DE SOCKET.IO ---
  socket.on("connect", () =>
    console.log("Conectado ao servidor de sockets com ID:", socket.id)
  );
  socket.on("new_group_message", (msg) => {
    if (msg.id_chat == currentChatId) renderMessage(msg);
  });
  socket.on("group_message_deleted", (data) => {
    if (data.chatId == currentChatId) {
      const el = chatMessagesContainer.querySelector(
        `[data-message-id='${data.messageId}']`
      );
      if (el) el.remove();
    }
  });
  socket.on("dm_message_deleted", (data) => {
    if (currentDmFriendId) {
      const el = chatMessagesContainer.querySelector(
        `[data-message-id='${data.messageId}']`
      );
      if (el) el.remove();
    }
  });
 socket.on("new_dm", (msg) => {
    // A condição verifica se a mensagem pertence à conversa ativa no momento.
    if (
        currentDmFriendId &&
        ((msg.id_remetente == currentDmFriendId && msg.id_destinatario == currentUserId) ||
        (msg.id_destinatario == currentDmFriendId && msg.id_remetente == currentUserId))
    ) {
        // --- MELHORIA APLICADA AQUI ---
        // A função renderMessage agora recebe o objeto 'msg' diretamente.
        // O objeto já conterá 'autorNome' e 'autorFoto' vindos do servidor.
        renderMessage(msg);
        // --------------------------------
    }
});

  // --- FUNÇÕES DE RENDERIZAÇÃO E UI ---
  function openModal(modal) {
    if (modal) modal.style.display = "flex";
  }
  function closeModal(modal) {
    if (modal) modal.style.display = "none";
  }

  function renderMessage(message) {
    if (!chatMessagesContainer) return;
    const messageItem = document.createElement("div");
    messageItem.classList.add("message-item");
    messageItem.dataset.messageId = message.id_mensagem;
    messageItem.dataset.authorName = message.autorNome;
    messageItem.dataset.authorId = message.id_usuario;
    messageItem.dataset.messageContent = message.Conteudo;

    const isSentByMe = message.id_usuario === currentUserId;
    if (isSentByMe) messageItem.classList.add("sent");

    const canDelete = isSentByMe || (currentGroupData && isCurrentUserAdmin);
    const actionsHTML = `<div class="message-actions"><i class="fas fa-reply reply-message-btn" title="Responder"></i>${
      canDelete
        ? `<i class="fas fa-trash delete-message-btn" title="Excluir mensagem"></i>`
        : ""
    }</div>`;

    let replyHTML = "";
    if (message.repliedTo && message.repliedTo.Conteudo) {
      const sanitizedRepliedContent = DOMPurify.sanitize(
        message.repliedTo.Conteudo
      );
      const replyAuthorTag = formatUserTag(
        message.repliedTo.autorNome,
        message.repliedTo.autorId
      );
      replyHTML = `<div class="reply-context"><span class="reply-author">${replyAuthorTag}</span><p class="reply-content">${sanitizedRepliedContent}</p></div>`;
    }

    const authorTag = formatUserTag(message.autorNome, message.id_usuario);
    const sanitizedContent = DOMPurify.sanitize(message.Conteudo);
    messageItem.innerHTML = `<img src="${
      message.autorFoto || "/images/logo.png"
    }" alt="${message.autorNome}"><div class="message-content">${replyHTML}${
      !isSentByMe ? `<span class="author-name">${authorTag}</span>` : ""
    }<p class="message-text">${sanitizedContent}</p></div>${actionsHTML}`;
    chatMessagesContainer.appendChild(messageItem);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  }

  async function loadAndRenderMessages(url) {
    if (!chatMessagesContainer) return;
    chatMessagesContainer.innerHTML = "<p>Carregando mensagens...</p>";
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Falha ao buscar mensagens.");
      const messages = await response.json();
      chatMessagesContainer.innerHTML = "";
      messages.length === 0
        ? (chatMessagesContainer.innerHTML =
            "<p>Nenhuma mensagem ainda. Seja o primeiro a dizer olá!</p>")
        : messages.forEach(renderMessage);
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
      chatMessagesContainer.innerHTML =
        "<p>Não foi possível carregar o histórico de mensagens.</p>";
    }
  }

  function renderFriendsView() {
    currentGroupData = null;
    currentChatId = null;
    currentDmFriendId = null;
    currentDmFriendData = null;
    if (chatArea) chatArea.classList.add("friends-view-active");
    if (groupSettingsIcon) groupSettingsIcon.style.display = "none";
    if (friendsNavContainer) friendsNavContainer.style.display = "flex";
    if (groupNameHeader) groupNameHeader.textContent = "Amigos";
    if (chatHeader)
      chatHeader.innerHTML = `<h3><i class="fas fa-user-friends"></i> Amigos</h3>`;
    if (chatMessagesContainer)
      chatMessagesContainer.innerHTML =
        "<h2>Selecione um amigo para começar a conversar.</h2>";
    document
      .querySelectorAll(".friends-nav-btn")
      .forEach((btn) => btn.classList.remove("active"));
    document
      .querySelector('.friends-nav-btn[data-tab="friends-list"]')
      ?.classList.add("active");
    renderFriendsList();
  }

  function renderFriendsList() {
    if (!channelListContent) return;
    channelListContent.innerHTML =
      '<div class="channel-list-header">Amigos</div>';

    // ATUALIZAÇÃO: O ID da IA foi alterado para 666.
    const iaFriendId = 666;
    const iaDiv = document.createElement('div');
    iaDiv.className = "friend-item";
    iaDiv.dataset.friendId = iaFriendId;
    iaDiv.dataset.friendName = "EsquizoIA";
    iaDiv.dataset.friendPhoto = "/images/IA.webp";
    iaDiv.innerHTML = `<img src="/images/IA.webp" alt="EsquizoIA"><span>EsquizoIA <i class= "fas fa-robot" title= "Inteligência Artificial" style="font-size: 12px; color: var(--text-muted);"></i></span>`;
    channelListContent.appendChild(iaDiv);

    if (friends.length > 0) {
          friends.forEach((friend) => {
          const friendDiv = document.createElement("div");
          friendDiv.className = "friend-item";
          friendDiv.dataset.friendId = friend.id_usuario;
          friendDiv.dataset.friendName = friend.Nome;
          friendDiv.dataset.friendPhoto =
            friend.FotoPerfil || "/images/logo.png";
          friendDiv.innerHTML = `<img src="${
            friend.FotoPerfil || "/images/logo.png"
          }"><span>${formatUserTag(friend.Nome, friend.id_usuario)}</span>`;
          channelListContent.appendChild(friendDiv);
        })
      } else {
        const noFriendsP = document.createElement('p');
        noFriendsP.style.cssText = "padding: 8px; color: var(--text-muted);";
        noFriendsP.textContent = "Sua lista de amigos está vazia.";
        channelListContent.appendChild(noFriendsP);
      }
  }
  

  function renderPendingRequests() {
    if (!channelListContent) return;
    channelListContent.innerHTML =
      '<div class="channel-list-header">Pedidos Recebidos</div>';
    pendingRequests && pendingRequests.length > 0
      ? pendingRequests.forEach((req) => {
          const reqDiv = document.createElement("div");
          reqDiv.className = "friend-request-item";
          reqDiv.dataset.requestId = req.id_amizade;
          reqDiv.innerHTML = `<div class="friend-item" style="flex-grow: 1;"><img src="${
            req.FotoPerfil || "/images/logo.png"
          }"><span>${formatUserTag(
            req.Nome,
            req.id_usuario
          )}</span></div><div class="request-actions"><button class="accept-btn" title="Aceitar"><i class="fas fa-check-circle"></i></button><button class="reject-btn" title="Recusar"><i class="fas fa-times-circle"></i></button></div>`;
          channelListContent.appendChild(reqDiv);
        })
      : (channelListContent.innerHTML +=
          '<p style="padding: 8px; color: var(--text-muted);">Nenhum pedido recebido.</p>');

    channelListContent.innerHTML +=
      '<div class="channel-list-header" style="margin-top: 20px;">Pedidos Enviados</div>';
    sentRequests && sentRequests.length > 0
      ? sentRequests.forEach((req) => {
          const reqDiv = document.createElement("div");
          reqDiv.className = "friend-request-item";
          reqDiv.dataset.requestId = req.id_amizade;
          reqDiv.innerHTML = `<div class="friend-item" style="flex-grow: 1;"><img src="${
            req.FotoPerfil || "/images/logo.png"
          }"><span>${formatUserTag(
            req.Nome,
            req.id_usuario
          )}</span></div><div class="request-actions"><button class="cancel-request-btn" title="Cancelar Pedido"><i class="fas fa-trash"></i></button></div>`;
          channelListContent.appendChild(reqDiv);
        })
      : (channelListContent.innerHTML +=
          '<p style="padding: 8px; color: var(--text-muted);">Nenhum pedido enviado.</p>');
  }

  function renderAddFriend() {
    if (!channelListContent) return;
    channelListContent.innerHTML = `<div class="add-friend-container"><div class="channel-list-header">Adicionar Amigo</div><p>Procure por um amigo com o seu nome de utilizador.</p><div class="add-friend-input"><input type="search" id="search-friend-input" placeholder="Digite o nome para buscar..."></div><div id="add-friend-results" class="search-results-container" style="margin-top: 10px;"><p style="padding: 8px; color: var(--text-muted);">Digite para buscar usuários.</p></div></div>`;
  }

  async function renderGroupView(groupId) {
    if (chatArea) chatArea.classList.remove("friends-view-active");
    try {
      const response = await fetch(`/groups/${groupId}/details`);
      if (!response.ok) throw new Error("Falha ao buscar detalhes do grupo.");
      const data = await response.json();
      currentGroupData = data;
      currentDmFriendId = null;
      if (friendsNavContainer) friendsNavContainer.style.display = "none";
      if (groupNameHeader) groupNameHeader.textContent = data.details.Nome;
      if (groupSettingsIcon)
        groupSettingsIcon.style.display =
          data.details.id_criador === currentUserId ? "block" : "none";
      if (!channelListContent) return;

      const firstChannel = data.channels[0];
      if (firstChannel) {
        currentChatId = firstChannel.id_chat;
        socket.emit("join_group_room", groupId);
        if (chatHeader)
          chatHeader.innerHTML = `<h3><i class="fas fa-hashtag" style="color: var(--text-muted);"></i> ${firstChannel.Nome}</h3>`;
        if (chatInput) {
          chatInput.placeholder = `Conversar em #${firstChannel.Nome}`;
          chatInput.disabled = false;
        }
        loadAndRenderMessages(`/groups/chats/${currentChatId}/messages`);
      } else {
        currentChatId = null;
        if (chatHeader) chatHeader.innerHTML = `<h3>Sem canais de texto</h3>`;
        if (chatInput) {
          chatInput.placeholder = `Crie um canal para começar a conversar.`;
          chatInput.disabled = true;
        }
        if (chatMessagesContainer) chatMessagesContainer.innerHTML = "";
      }

      channelListContent.innerHTML = "";
      const memberHeader = document.createElement("div");
      memberHeader.className = "channel-list-header";
      memberHeader.textContent = `MEMBROS - ${data.members.length}`;
      channelListContent.appendChild(memberHeader);
      data.members.forEach((member) => {
        const memberDiv = document.createElement("div");
        memberDiv.className = "friend-item";
        memberDiv.innerHTML = `<img src="${
          member.FotoPerfil || "/images/logo.png"
        }" alt="${member.Nome}"><span>${formatUserTag(
          member.Nome,
          member.id_usuario
        )}</span>${
          member.isAdmin
            ? '<i class="fas fa-crown admin-icon" title="Administrador"></i>'
            : ""
        }`;
        channelListContent.appendChild(memberDiv);
      });
      isCurrentUserAdmin = data.members.some(
        (m) => m.id_usuario === currentUserId && m.isAdmin
      );
    } catch (err) {
      console.error("Erro ao carregar grupo:", err);
    }
  }

 function renderDmView(friendId, friendName, friendPhoto) {
    if (chatArea) chatArea.classList.remove("friends-view-active");
    currentChatId = null;
    currentGroupData = null;
    currentDmFriendId = friendId;
    currentDmFriendData = { id: friendId, nome: friendName, foto: friendPhoto };

    // --- CORREÇÃO APLICADA AQUI ---
    // Adiciona o prefixo "dm-" para corresponder ao nome da sala no servidor.
    const roomName = `dm-${[currentUserId, friendId].sort().join("-")}`;
    socket.emit("join_dm_room", roomName);
    // --------------------------------

    if (chatHeader)
      chatHeader.innerHTML = `<h3><img src="${friendPhoto}" style="width: 24px; height: 24px; border-radius: 50%; margin-right: 8px;">${formatUserTag(
        friendName,
        friendId
      )}</h3>`;
    if (chatInput) {
      chatInput.placeholder = `Conversar com ${friendName}`;
      chatInput.disabled = false;
    }
    loadAndRenderMessages(`/friends/dm/${friendId}/messages`);
}

  function renderSearchResults(results, container, isGroupSearch) {
    if (!container) return;
    container.innerHTML = "";
    if (results.length === 0) {
      container.innerHTML =
        "<p style='padding: 8px; color: var(--text-muted);'>Nenhum resultado encontrado.</p>";
      return;
    }
    results.forEach((item) => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "search-result-item";
      itemDiv.innerHTML = isGroupSearch
        ? `<div class="search-result-info"><img src="${
            item.Foto || "/images/default-group-icon.png"
          }" alt="${item.Nome}"><div class="search-result-name"><span>${
            item.Nome
          }</span><span class="group-id-search">#${
            item.id_grupo
          }</span></div></div><button class="join-btn" data-group-id="${
            item.id_grupo
          }">Entrar</button>`
        : `<div class="search-result-info"><img src="${
            item.FotoPerfil || "/images/logo.png"
          }" alt="${item.Nome}"><div class="search-result-name">${formatUserTag(
            item.Nome,
            item.id_usuario
          )}</div></div><button class="add-friend-btn" data-user-id="${
            item.id_usuario
          }">Adicionar</button>`;
      container.appendChild(itemDiv);
    });
  }

  // --- SETUP DE EVENT LISTENERS ---
  function setupEventListeners() {
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener("click", () => {
        channelList.classList.toggle("open");
      });
    }
    serverList?.addEventListener("click", (e) => {
      if (window.innerWidth <= 768) {
        channelList.classList.remove("open");
      }
    });
    if (addServerButton)
      addServerButton.addEventListener("click", () =>
        openModal(createGroupModal)
      );
    if (exploreButton) {
      exploreButton.addEventListener("click", () => {
        openModal(exploreModal);
        searchGroupInput?.dispatchEvent(new Event("input"));
      });
    }
    [createGroupModal, editGroupModal, exploreModal].forEach((modal) => {
      if (!modal) return;
      modal
        .querySelector(".cancel-btn")
        ?.addEventListener("click", () => closeModal(modal));
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal(modal);
      });
    });
    serverList?.addEventListener("click", (e) => {
      const serverIcon = e.target.closest(".server-icon[data-group-id]");
      if (serverIcon) {
        document
          .querySelectorAll(".server-icon")
          .forEach((i) => i.classList.remove("active"));
        serverIcon.classList.add("active");
        renderGroupView(serverIcon.dataset.groupId);
      }
    });
    if (homeButton) {
      homeButton.addEventListener("click", () => {
        document
          .querySelectorAll(".server-icon")
          .forEach((i) => i.classList.remove("active"));
        homeButton.classList.add("active");
        renderFriendsView();
      });
    }
    if (friendsNavContainer) {
      friendsNavContainer.addEventListener("click", (e) => {
        if (e.target.tagName === "BUTTON") {
          friendsNavContainer
            .querySelectorAll(".friends-nav-btn")
            .forEach((btn) => btn.classList.remove("active"));
          e.target.classList.add("active");
          const tab = e.target.dataset.tab;
          if (tab === "friends-list") renderFriendsList();
          else if (tab === "pending-requests") renderPendingRequests();
          else if (tab === "add-friend") renderAddFriend();
        }
      });
    }
    if (channelListContent) {
      channelListContent.addEventListener("click", (e) => {
        const friendItem = e.target.closest(".friend-item[data-friend-id]");
        if (friendItem) {
          renderDmView(
            friendItem.dataset.friendId,
            friendItem.dataset.friendName,
            friendItem.dataset.friendPhoto
          );
          if (window.innerWidth <= 768) {
            channelList.classList.remove("open");
          }
        }
      });
    }
    if (cancelReplyBtn) {
      cancelReplyBtn.addEventListener("click", () => {
        replyingToMessageId = null;
        if (replyBar) replyBar.style.display = "none";
      });
    }
    if (chatMessagesContainer) {
      chatMessagesContainer.addEventListener("click", async (e) => {
        const target = e.target;
        if (target.classList.contains("reply-message-btn")) {
          const messageItem = target.closest(".message-item");
          if (!messageItem) return;
          replyingToMessageId = messageItem.dataset.messageId;
          const author = messageItem.dataset.authorName,
            authorId = messageItem.dataset.authorId;
          const content = messageItem.dataset.messageContent;
          if (replyBar && replyBarText) {
            replyBarText.innerHTML = `Respondendo a <strong>${formatUserTag(
              author,
              authorId
            )}</strong>: ${content.substring(0, 80)}...`;
            replyBar.style.display = "flex";
          }
          chatInput?.focus();
          return;
        }
        if (target.classList.contains("delete-message-btn")) {
          const messageItem = target.closest(".message-item");
          const messageId = messageItem ? messageItem.dataset.messageId : null;
          if (
            !messageId ||
            !confirm("Tem certeza de que deseja excluir esta mensagem?")
          )
            return;
          try {
            let url = currentChatId
              ? `/groups/messages/${messageId}`
              : currentDmFriendId
              ? `/friends/dm/messages/${messageId}`
              : null;
            if (!url) return;
            const response = await fetch(url, { method: "DELETE" });
            if (!response.ok) {
              const err = await response.json();
              throw new Error(err.message || "Falha ao excluir a mensagem.");
            }
          } catch (error) {
            console.error("Erro ao excluir mensagem:", error);
            alert(error.message);
          }
        }
      });
    }
    if (groupSettingsIcon) {
      groupSettingsIcon.addEventListener("click", () => {
        if (currentGroupData) {
          editGroupModal.querySelector("#edit-group-id").value =
            currentGroupData.details.id_grupo;
          editGroupModal.querySelector("#edit-group-name").value =
            currentGroupData.details.Nome;
          editGroupModal.querySelector("#edit-group-private").checked =
            currentGroupData.details.IsPrivate;
          openModal(editGroupModal);
        }
      });
    }
    if (deleteGroupButton) {
      deleteGroupButton.addEventListener("click", async () => {
        const groupId = editGroupModal.querySelector("#edit-group-id").value;
        const groupName =
          editGroupModal.querySelector("#edit-group-name").value;
        if (
          !groupId ||
          !confirm(
            `Tem a certeza de que deseja excluir o grupo "${groupName}"? Esta ação é irreversível.`
          )
        )
          return;
        await handleAction(
          deleteGroupButton,
          `/groups/${groupId}`,
          "Excluindo...",
          "Excluir Grupo",
          null,
          "DELETE",
          true
        );
      });
    }
    if (chatInput) {
      chatInput.addEventListener("keydown", async (e) => {
        if (e.key === "Enter" && chatInput.value.trim() !== "") {
          e.preventDefault();
          const messageContent = chatInput.value.trim();
          const body = {
            content: messageContent,
            replyingToMessageId: replyingToMessageId,
          };
          chatInput.value = "";
          replyingToMessageId = null;
          if (replyBar) replyBar.style.display = "none";
          let url = currentChatId
            ? `/groups/chats/${currentChatId}/messages`
            : currentDmFriendId
            ? `/friends/dm/${currentDmFriendId}/messages`
            : null;
          if (!url) return;
          try {
            await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
          } catch (error) {
            console.error("ERRO ao enviar mensagem:", error);
            alert("Não foi possível enviar a mensagem.");
            chatInput.value = messageContent;
          }
        }
      });
    }
    if (createGroupForm)
      createGroupForm.addEventListener("submit", (e) => {
        e.preventDefault();
        handleFormSubmit(
          "/groups/criar",
          "Erro ao criar grupo",
          () => window.location.reload(),
          e.target
        );
      });
    if (editGroupForm)
      editGroupForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const id = e.target.querySelector("#edit-group-id").value;
        handleFormSubmit(
          `/groups/${id}/settings`,
          "Erro ao editar",
          () => window.location.reload(),
          e.target
        );
      });

    document.body.addEventListener("click", async (e) => {
      const button = e.target.closest("button");
      if (!button) return;
      if (button.classList.contains("join-btn")) {
        const groupId = button.dataset.groupId;
        handleAction(
          button,
          `/groups/${groupId}/join`,
          "Entrando...",
          "Entrar",
          null,
          "POST",
          true
        );
      } else if (button.classList.contains("add-friend-btn")) {
        const userId = button.dataset.userId;
        handleAction(
          button,
          "/friends/request",
          "Enviando...",
          "Adicionar",
          { requestedId: userId },
          "POST"
        );
        button.textContent = "Enviado";
        button.disabled = true;
      } else if (
        button.classList.contains("accept-btn") ||
        button.classList.contains("reject-btn")
      ) {
        const requestItem = button.closest(".friend-request-item");
        const requestId = requestItem?.dataset.requestId;
        const action = button.classList.contains("accept-btn")
          ? "aceite"
          : "recusada";
        if (requestId)
          handleAction(
            button,
            "/friends/respond",
            "...",
            "",
            { requestId, action },
            "POST",
            true
          );
      } else if (button.classList.contains("cancel-request-btn")) {
        const requestItem = button.closest(".friend-request-item");
        const requestId = requestItem?.dataset.requestId;
        if (requestId)
          handleAction(
            button,
            "/friends/cancel",
            "Cancelando...",
            "",
            { requestId },
            "POST",
            true
          );
      }
    });

    let searchTimeout;
    document.body.addEventListener("input", (e) => {
      const target = e.target;
      if (
        target.id === "search-group-input" ||
        target.id === "search-friend-input"
      ) {
        clearTimeout(searchTimeout);
        const query = target.value;
        const isGroupSearch = target.id === "search-group-input";
        searchTimeout = setTimeout(async () => {
          if (!query.trim() && !isGroupSearch) {
            const container = document.getElementById("add-friend-results");
            if (container)
              container.innerHTML =
                "<p style='padding: 8px; color: var(--text-muted);'>Digite para buscar usuários.</p>";
            return;
          }
          const searchUrl = isGroupSearch
            ? `/groups/search?q=${encodeURIComponent(query)}`
            : `/friends/search?q=${encodeURIComponent(query)}`;
          const resultsContainer = document.getElementById(
            isGroupSearch ? "search-group-results" : "add-friend-results"
          );
          if (!resultsContainer) return;
          try {
            const response = await fetch(searchUrl);
            const results = await response.json();
            renderSearchResults(results, resultsContainer, isGroupSearch);
          } catch (err) {
            console.error("Erro na pesquisa:", err);
            if (resultsContainer)
              resultsContainer.innerHTML = "<p>Erro ao pesquisar.</p>";
          }
        }, 300);
      }
    });
  }

  async function handleFormSubmit(url, errorMessage, onSuccess, formElement) {
    const formData = new FormData(formElement);
    try {
      const response = await fetch(url, { method: "POST", body: formData });
      if (response.ok) {
        onSuccess();
      } else {
        const res = await response.json();
        alert(`${errorMessage}: ${res.message}`);
      }
    } catch (err) {
      console.error("Erro de rede:", err);
      alert("Erro de rede.");
    }
  }
  async function handleAction(
    button,
    url,
    loadingText,
    defaultText,
    body = null,
    method = "POST",
    reload = false
  ) {
    if (!button) return;
    button.disabled = true;
    const originalText = button.textContent;
    if (button.tagName === "BUTTON") button.textContent = loadingText;
    try {
      const options = { method, headers: {} };
      if (body) {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
      }
      const response = await fetch(url, options);
      if (
        response.status === 204 ||
        response.headers.get("content-length") === "0"
      ) {
        if (reload) window.location.reload();
        return;
      }
      const data = await response.json();
      if (response.ok) {
        if (reload) window.location.reload();
        else if (data.message) alert(data.message);
      } else {
        throw new Error(data.message || "Erro desconhecido");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      if (!reload) {
        button.disabled = false;
        button.textContent = defaultText || originalText;
      }
    }
  }

  // --- INICIALIZAÇÃO DA APLICAÇÃO ---
  function main() {
    renderFriendsView();
    setupEventListeners();
    console.log("Dashboard inicializado com as novas melhorias.");
  }
  main();
});

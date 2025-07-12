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
    currentGroupId = null,
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
  let friends = parseJsonData("friends") || [];
  let pendingRequests = parseJsonData("pendingRequests") || [];
  let sentRequests = parseJsonData("sentRequests") || [];
  const onlineUserIds = new Set(parseJsonData("onlineUserIds") || []);
  const currentUserId = currentUser ? currentUser.id_usuario : null;
  const viewProfileModal = document.getElementById('view-profile-modal');
  const profileModalAvatar = document.getElementById('profile-modal-avatar');
  const profileModalName = document.getElementById('profile-modal-name');
  const profileModalBio = document.getElementById('profile-modal-bio');

  const aiUser = friends.find((f) => f.Nome === "EsquizoIA");
  const AI_USER_ID = aiUser ? aiUser.id_usuario : null;

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
  const chatInputBar = document.querySelector(".chat-input-bar");
  const chatInput = chatInputBar.querySelector("input");
  const replyBar = document.getElementById("reply-bar"),
    replyBarText = document.getElementById("reply-bar-text"),
    cancelReplyBtn = document.getElementById("cancel-reply-btn");
  const serverList = document.querySelector(".server-list"),
    channelList = document.querySelector(".channel-list");
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const removeFriendModal = document.getElementById("remove-friend-modal");
  const removeFriendModalTitle = document.getElementById(
    "remove-friend-modal-title"
  );
  const removeFriendModalText = document.getElementById(
    "remove-friend-modal-text"
  );
  const cancelRemoveFriendBtn = document.getElementById(
    "cancel-remove-friend-btn"
  );
  const confirmRemoveFriendBtn = document.getElementById(
    "confirm-remove-friend-btn"
  );
  const deleteTrigger = document.getElementById("delete-account-trigger");
  const deleteContainer = document.getElementById(
    "delete-confirmation-container"
  );
  const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
  const passwordInput = document.getElementById("delete-password-input");

  // --- LÓGICA DE SOCKET.IO ---
  socket.on("connect", () => {
    console.log(
      "[CLIENTE] Conectado ao servidor de sockets com ID:",
      socket.id
    );
    if (currentUser) {
      socket.emit("join_user_room", `user-${currentUser.id_usuario}`);
    }
  });

  socket.on("new_group_message", (msg) => {
    if (msg.id_chat == currentChatId) {
      renderMessage(msg);
    } else {
      showNotification(msg.groupId);
    }
  });

  socket.on("new_dm", (msg) => {
    // CORREÇÃO: Verifica se a mensagem pertence à conversa ativa no momento
    const isCorrectConversation =
      currentDmFriendId &&
      ((msg.id_remetente == currentUserId &&
        msg.id_destinatario == currentDmFriendId) ||
        (msg.id_remetente == currentDmFriendId &&
          msg.id_destinatario == currentUserId));

    if (isCorrectConversation) {
      renderMessage(msg);
    } else if (msg.id_remetente !== currentUserId) {
      // Mostra notificação apenas para mensagens recebidas em outras conversas
      showNotification(null, true);
    }
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

  socket.on("user_online", ({ userId }) => {
    onlineUserIds.add(userId);
    updateUserStatus(userId, true);
  });

  socket.on("user_offline", ({ userId }) => {
    onlineUserIds.delete(userId);
    updateUserStatus(userId, false);
  });

  socket.on("friend_request_received", (newRequest) => {
    pendingRequests.push(newRequest);
    if (
      document.querySelector(
        '.friends-nav-btn[data-tab="pending-requests"].active'
      )
    ) {
      renderPendingRequests();
    }
    showNotification(null, true);
  });

  socket.on("friend_request_accepted", ({ newFriend, requestId }) => {
    sentRequests = sentRequests.filter((req) => req.id_amizade !== requestId);
    friends.push(newFriend);

    if (
      document.querySelector('.friends-nav-btn[data-tab="friends-list"].active')
    ) {
      renderFriendsList();
    }
    if (
      document.querySelector(
        '.friends-nav-btn[data-tab="pending-requests"].active'
      )
    ) {
      renderPendingRequests();
    }
    showNotification(null, true);
  });

  socket.on("friend_removed", ({ removerId }) => {
    const friendIndex = friends.findIndex((f) => f.id_usuario === removerId);
    if (friendIndex > -1) {
      friends.splice(friendIndex, 1)[0];
      if (currentDmFriendId === removerId) {
        renderFriendsView();
      } else {
        if (
          document.querySelector(
            '.friends-nav-btn[data-tab="friends-list"].active'
          )
        ) {
          renderFriendsList();
        }
      }
    }
  });

  socket.on("request_cancelled", ({ requestId }) => {
    const pendingIndex = pendingRequests.findIndex(
      (req) => req.id_amizade === requestId
    );
    if (pendingIndex > -1) {
      pendingRequests.splice(pendingIndex, 1);
      if (
        document.querySelector(
          '.friends-nav-btn[data-tab="pending-requests"].active'
        )
      ) {
        renderPendingRequests();
      }
    }
  });

  // --- FUNÇÕES DE NOTIFICAÇÃO E UI ---
  function showNotification(targetId, isDm = false) {
    const targetElement = isDm
      ? homeButton
      : document.querySelector(`.server-icon[data-group-id="${targetId}"]`);

    if (targetElement && !targetElement.querySelector(".notification-badge")) {
      const badge = document.createElement("span");
      badge.className = "notification-badge";
      targetElement.appendChild(badge);
    }
  }

  function removeNotification(targetId, isDm = false) {
    const targetElement = isDm
      ? homeButton
      : document.querySelector(`.server-icon[data-group-id="${targetId}"]`);

    const badge = targetElement?.querySelector(".notification-badge");
    if (badge) {
      badge.remove();
    }
  }

  function openModal(modal) {
    if (modal) modal.style.display = "flex";
  }
  function closeModal(modal) {
    if (modal) modal.style.display = "none";
  }

  function updateUserStatus(userId, isOnline) {
    const userElements = document.querySelectorAll(
      `.friend-item[data-friend-id="${userId}"]`
    );
    userElements.forEach((el) => {
      const statusIndicator = el.querySelector(".status-indicator");
      if (statusIndicator) {
        statusIndicator.className = `status-indicator ${
          isOnline ? "online" : "offline"
        }`;
      }
    });
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
      const parsedRepliedContent = marked.parse(message.repliedTo.Conteudo);
      const sanitizedRepliedContent = DOMPurify.sanitize(parsedRepliedContent);
      const replyAuthorTag = formatUserTag(
        message.repliedTo.autorNome,
        message.repliedTo.autorId
      );
      replyHTML = `<div class="reply-context"><span class="reply-author">${replyAuthorTag}</span><div class="reply-content">${sanitizedRepliedContent}</div></div>`;
    }

    const authorTag = formatUserTag(message.autorNome, message.id_usuario);
    const parsedContent = marked.parse(message.Conteudo);
    const sanitizedContent = DOMPurify.sanitize(parsedContent);

    messageItem.innerHTML = `<img src="${
      message.autorFoto || "/images/logo.png"
    }" alt="${message.autorNome}"><div class="message-content">${replyHTML}${
      !isSentByMe ? `<span class="author-name">${authorTag}</span>` : ""
    }<div class="message-text">${sanitizedContent}</div></div>${actionsHTML}`;
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
    removeNotification(null, true);

    if (currentGroupId) {
      socket.emit("leave_group_room", `group-${currentGroupId}`);
    }
    if (currentDmFriendId) {
      const oldRoomName = `dm-${[currentUserId, currentDmFriendId]
        .sort()
        .join("-")}`;
      socket.emit("leave_dm_room", oldRoomName);
    }
    currentGroupData = null;
    currentChatId = null;
    currentDmFriendId = null;
    currentDmFriendData = null;
    currentGroupId = null;

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
    const mentionBtn = document.getElementById("mention-ai-btn");
    if (mentionBtn) mentionBtn.style.display = "none";
  }

  let friendToRemove = { id: null, name: null, element: null };

  function openRemoveFriendModal(friendId, friendName, element) {
    friendToRemove = { id: friendId, name: friendName, element };

    if (removeFriendModalTitle)
      removeFriendModalTitle.innerHTML = `Remover '${friendName}'`;
    if (removeFriendModalText)
      removeFriendModalText.innerHTML = `Tem certeza de que deseja remover <strong>${friendName}</strong> da sua lista de amigos?`;

    openModal(removeFriendModal);
  }

  function closeRemoveFriendModal() {
    closeModal(removeFriendModal);
    friendToRemove = { id: null, name: null, element: null };
  }

  function renderFriendsList() {
    if (!channelListContent) return;
    channelListContent.innerHTML =
      '<div class="channel-list-header">Amigos</div>';

    if (friends.length > 0) {
      friends.forEach((friend) => {
        const friendDiv = document.createElement("div");
        friendDiv.className = "friend-item";
        friendDiv.dataset.friendId = friend.id_usuario;
        friendDiv.dataset.friendName = friend.Nome;
        friendDiv.dataset.friendPhoto = friend.FotoPerfil || "/images/logo.png";

        const isOnline = onlineUserIds.has(friend.id_usuario);

        const nameHTML =
          friend.id_usuario === AI_USER_ID
            ? `${friend.Nome} <i class="fas fa-robot" title="Inteligência Artificial" style="font-size: 12px; color: var(--text-muted);"></i>`
            : formatUserTag(friend.Nome, friend.id_usuario);

        friendDiv.innerHTML = `
          <div class="friend-info">
            <div class="avatar-container">
              <img src="${friend.FotoPerfil || "/images/logo.png"}">
              <span class="status-indicator ${isOnline ? "online" : "offline"}"></span>
            </div>
            <span>${nameHTML}</span>
          </div>
          <div class="friend-actions">
            <button class="view-profile-btn" title="Ver Perfil" data-friend-id="${friend.id_usuario}"><i class="fas fa-eye"></i></button>
            <button class="remove-friend-btn" title="Remover Amigo"><i class="fas fa-user-minus"></i></button>
          </div>`;
        channelListContent.appendChild(friendDiv);
      });
    } else {
      const noFriendsP = document.createElement("p");
      noFriendsP.style.cssText = "padding: 8px; color: var(--text-muted);";
      noFriendsP.textContent = "Sua lista de amigos está vazia.";
      channelListContent.appendChild(noFriendsP);
    }
  }

  function renderPendingRequests() {
    if (!channelListContent) return;
    channelListContent.innerHTML =
      '<div class="channel-list-header">PEDIDOS RECEBIDOS</div>';
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
      '<div class="channel-list-header" style="margin-top: 20px;">PEDIDOS ENVIADOS</div>';
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
    removeNotification(groupId);

    if (currentDmFriendId) {
      const oldRoomName = `dm-${[currentUserId, currentDmFriendId]
        .sort()
        .join("-")}`;
      socket.emit("leave_dm_room", oldRoomName);
    }
    if (currentGroupId && currentGroupId !== groupId) {
      const oldRoomName = `group-${currentGroupId}`;
      socket.emit("leave_group_room", oldRoomName);
    }

    if (chatArea) chatArea.classList.remove("friends-view-active");
    try {
      const response = await fetch(`/groups/${groupId}/details`);
      if (!response.ok) throw new Error("Falha ao buscar detalhes do grupo.");
      const data = await response.json();

      currentGroupData = data;
      currentGroupId = groupId;
      currentDmFriendId = null;
      if (friendsNavContainer) friendsNavContainer.style.display = "none";
      if (groupNameHeader) groupNameHeader.textContent = data.details.Nome;
      if (groupSettingsIcon)
        groupSettingsIcon.style.display =
          data.details.id_criador === currentUserId ? "block" : "none";
      if (!channelListContent) return;

      const firstChannel = data.channels[0];
      currentChatId = firstChannel ? firstChannel.id_chat : null;

      const newRoomName = `group-${groupId}`;
      socket.emit("join_group_room", newRoomName);

      if (currentChatId) {
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

      const mentionBtn = document.getElementById("mention-ai-btn");
      if (mentionBtn) mentionBtn.style.display = "block";

      channelListContent.innerHTML = "";
      const memberHeader = document.createElement("div");
      memberHeader.className = "channel-list-header";
      memberHeader.textContent = `MEMBROS - ${data.members.length}`;
      channelListContent.appendChild(memberHeader);
      data.members.forEach((member) => {
        const memberDiv = document.createElement("div");
        memberDiv.className = "friend-item";
        memberDiv.dataset.friendId = member.id_usuario;

        const isOnline = onlineUserIds.has(member.id_usuario);

        const memberNameHTML =
          member.id_usuario === AI_USER_ID
            ? `<span>${member.Nome} <i class="fas fa-robot" title="Inteligência Artificial" style="color: var(--text-muted);"></i></span>`
            : `<span>${formatUserTag(member.Nome, member.id_usuario)}</span>`;

        const adminIconHTML = member.isAdmin
          ? '<i class="fas fa-crown admin-icon" title="Administrador"></i>'
          : "";

        const memberPhoto = member.FotoPerfil || "/images/logo.png";

        memberDiv.innerHTML = `
            <div class="avatar-container">
              <img src="${memberPhoto}" alt="${member.Nome}">
              <span class="status-indicator ${
                isOnline ? "online" : "offline"
              }"></span>
            </div>
            ${memberNameHTML}${adminIconHTML}`;

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
    removeNotification(null, true);

    if (currentGroupId) {
      const oldRoomName = `group-${currentGroupId}`;
      socket.emit("leave_group_room", oldRoomName);
    }
    if (currentDmFriendId && currentDmFriendId !== friendId) {
      const oldRoomName = `dm-${[currentUserId, currentDmFriendId]
        .sort()
        .join("-")}`;
      socket.emit("leave_dm_room", oldRoomName);
    }

    if (chatArea) chatArea.classList.remove("friends-view-active");

    currentChatId = null;
    currentGroupData = null;
    currentGroupId = null;
    currentDmFriendId = friendId;
    currentDmFriendData = { id: friendId, nome: friendName, foto: friendPhoto };

    const roomName = `dm-${[currentUserId, friendId].sort().join("-")}`;
    socket.emit("join_dm_room", roomName);

    if (chatHeader)
      chatHeader.innerHTML = `<h3><img src="${friendPhoto}" style="width: 24px; height: 24px; border-radius: 50%; margin-right: 8px;">${formatUserTag(
        friendName,
        friendId
      )}</h3>`;
    if (chatInput) {
      chatInput.placeholder = `Conversar com ${friendName}`;
      chatInput.disabled = false;
    }

    const mentionBtn = document.getElementById("mention-ai-btn");
    if (mentionBtn) mentionBtn.style.display = "none";

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
        handleAction(
          deleteGroupButton,
          `/groups/${groupId}`,
          "Excluindo...",
          "Excluir Grupo",
          null,
          "DELETE",
          () => window.location.reload()
        );
      });
    }

    if (chatInputBar) {
      const inputWrapper = document.createElement("div");
      inputWrapper.className = "input-wrapper";

      const mentionButton = document.createElement("button");
      mentionButton.id = "mention-ai-btn";
      mentionButton.className = "mention-ai-btn";
      mentionButton.title = "Mencionar EsquizoIA";
      mentionButton.innerHTML = '<i class="fas fa-robot"></i>';
      mentionButton.style.display = "none";

      if (chatInput) {
        inputWrapper.appendChild(mentionButton);
        inputWrapper.appendChild(chatInput);
        chatInputBar.appendChild(inputWrapper);

        mentionButton.addEventListener("click", () => {
          chatInput.value = `@EsquizoIA ${chatInput.value}`;
          chatInput.focus();
        });
      }
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
            const response = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            if (!response.ok) {
              console.error("Falha ao enviar mensagem para o servidor.");
              chatInput.value = messageContent;
            }
          } catch (error) {
            console.error("ERRO ao enviar mensagem:", error);
            alert("Não foi possível enviar a mensagem.");
            chatInput.value = messageContent;
          }
        }
      });
    }

    if (createGroupForm) {
      createGroupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const submitBtn = createGroupForm.querySelector(".submit-btn");
        if (!submitBtn) return;

        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Criando...";

        try {
          const formData = new FormData(e.target);
          const response = await fetch("/groups/criar", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            window.location.reload();
          } else {
            // ** ALTERAÇÃO: MELHORIA NO TRATAMENTO DE ERRO **
            const contentType = response.headers.get("content-type");
            let errorMsg;
            if (contentType && contentType.indexOf("application/json") !== -1) {
              const err = await response.json();
              errorMsg = err.message;
            } else {
              errorMsg = await response.text();
              console.error("Erro não-JSON recebido do servidor:", errorMsg);
            }
            alert(`Erro ao criar grupo: ${errorMsg}`);
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }
        } catch (err) {
          console.error("Erro de rede:", err);
          alert("Erro de rede ao tentar criar o grupo.");
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      });
    }

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
      const friendInfo = e.target.closest(".friend-info");
      if (friendInfo) {
        const friendItem = friendInfo.closest(".friend-item");
        if (friendItem) {
          const friendId = friendItem.dataset.friendId;
          const friendName = friendItem.dataset.friendName;
          const friendPhoto = friendItem.dataset.friendPhoto;
          renderDmView(friendId, friendName, friendPhoto);
          if (window.innerWidth <= 768) {
            channelList.classList.remove("open");
          }
        }
        return;
      }

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
          () => window.location.reload()
        );
      } else if (button.classList.contains("add-friend-btn")) {
        const userId = button.dataset.userId;
        const onSuccess = (data) => {
          if (data.sentRequest) {
            sentRequests.push(data.sentRequest);
          }
          if (
            document.querySelector(
              '.friends-nav-btn[data-tab="pending-requests"].active'
            )
          ) {
            renderPendingRequests();
          }
          button.textContent = "Enviado";
          button.disabled = true;
        };
        handleAction(
          button,
          "/friends/request",
          "Enviando...",
          "Adicionar",
          { requestedId: userId },
          "POST",
          onSuccess
        );
      } else if (
        button.classList.contains("accept-btn") ||
        button.classList.contains("reject-btn")
      ) {
        const requestItem = button.closest(".friend-request-item");
        const requestId = requestItem?.dataset.requestId;
        const action = button.classList.contains("accept-btn")
          ? "aceite"
          : "recusada";
        const onSuccess = () => {
          pendingRequests = pendingRequests.filter(
            (req) => req.id_amizade !== parseInt(requestId)
          );
          if (action === "aceite") window.location.reload();
          else requestItem.remove();
        };
        if (requestId)
          handleAction(
            button,
            "/friends/respond",
            "...",
            "",
            { requestId, action },
            "POST",
            onSuccess
          );
      } else if (button.classList.contains("cancel-request-btn")) {
        const requestItem = button.closest(".friend-request-item");
        const requestId = requestItem?.dataset.requestId;
        const onSuccess = () => {
          sentRequests = sentRequests.filter(
            (req) => req.id_amizade !== parseInt(requestId)
          );
          requestItem.remove();
        };
        if (requestId)
          handleAction(
            button,
            "/friends/cancel",
            "Cancelando...",
            "",
            { requestId },
            "POST",
            onSuccess
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
    onSuccess = null
  ) {
    if (!button) return;
    const isButtonStillAttached = () => document.body.contains(button);
    if (isButtonStillAttached()) button.disabled = true;
    const originalText = button.textContent;
    if (isButtonStillAttached() && button.tagName === "BUTTON")
      button.textContent = loadingText;
    try {
      const options = { method, headers: {} };
      if (body) {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
      }
      const response = await fetch(url, options);

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      }

      if (response.ok) {
        if (onSuccess && typeof onSuccess === "function") {
          onSuccess(data);
        }
      } else {
        throw new Error(data ? data.message : `Erro ${response.status}`);
      }
    } catch (err) {
      if (!onSuccess) alert(err.message);
      if (isButtonStillAttached()) {
        button.disabled = false;
        button.textContent = defaultText || originalText;
      }
    } finally {
      if (!onSuccess && isButtonStillAttached()) {
        button.disabled = false;
        button.textContent = defaultText || originalText;
      }
    }
  }

  channelListContent.addEventListener("click", async (e) => {
    const removeButton = e.target.closest(".remove-friend-btn");
    if (removeButton) {
      const friendItem = removeButton.closest(".friend-item");
      const friendId = friendItem.dataset.friendId;
      const friendName = friendItem.dataset.friendName;

      openRemoveFriendModal(friendId, friendName, friendItem);
    }
  });

  // --- EVENT LISTENERS PARA OS BOTÕES DO MODAL (CONFIRMAR E CANCELAR) ---
  if (cancelRemoveFriendBtn) {
    cancelRemoveFriendBtn.addEventListener("click", closeRemoveFriendModal);
  }

  if (confirmRemoveFriendBtn) {
    confirmRemoveFriendBtn.addEventListener("click", async () => {
      const { id, element } = friendToRemove;
      if (!id) return;

      const originalText = confirmRemoveFriendBtn.textContent;
      confirmRemoveFriendBtn.disabled = true;
      confirmRemoveFriendBtn.textContent = "Removendo...";

      try {
        const response = await fetch(`/friends/${id}`, {
          method: "DELETE",
        });

        const data = await response.json();
        if (response.ok) {
          closeRemoveFriendModal();
          if (element) element.remove();
          friends = friends.filter((f) => f.id_usuario !== parseInt(id));
          if (currentDmFriendId == id) {
            renderFriendsView();
          }
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        console.error("Erro ao remover amigo:", error);
        alert(`Não foi possível remover o amigo: ${error.message}`);
      } finally {
        if (document.body.contains(confirmRemoveFriendBtn)) {
          confirmRemoveFriendBtn.disabled = false;
          confirmRemoveFriendBtn.textContent = originalText;
        }
      }
    });
  }

  // Mostra/oculta a área de confirmação
  if (deleteTrigger) {
    deleteTrigger.addEventListener("click", (e) => {
      e.preventDefault();
      const isVisible = deleteContainer.style.display === "block";
      deleteContainer.style.display = isVisible ? "none" : "block";
    });
  }

  // Lida com o clique final de exclusão
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", async () => {
      const senha = passwordInput.value;
      if (!senha) {
        alert("Por favor, insira sua senha para confirmar.");
        return;
      }

      // Confirmação final para evitar acidentes
      if (
        !confirm(
          "Você tem ABSOLUTA CERTEZA? Esta ação é permanente e todos os seus dados serão apagados."
        )
      ) {
        return;
      }

      try {
        const response = await fetch("/users/me", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ senha: senha }),
        });

        const result = await response.json();
        alert(result.message);

        if (response.ok) {
          window.location.href = "/"; // Redireciona para a home
        }
      } catch (err) {
        alert("Ocorreu um erro ao tentar excluir a conta.");
        console.error(err);
      }
    });
  }

  // Função para buscar e mostrar o perfil do usuário
async function showUserProfile(userId) {
    try {
        const response = await fetch(`/users/${userId}/profile`);
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Não foi possível buscar o perfil.');
        }
        const profileData = await response.json();

        // Popula o modal com os dados do usuário
        profileModalAvatar.src = profileData.FotoPerfil || '/images/logo.png';
        profileModalName.innerHTML = formatUserTag(profileData.Nome, profileData.id_usuario);
        profileModalBio.textContent = profileData.Biografia || 'Este usuário ainda não escreveu nada sobre si...';

        openModal(viewProfileModal);

    } catch (error) {
        console.error('Erro ao exibir perfil:', error);
        alert(error.message);
    }
}

// Adicionar um event listener para fechar o modal
viewProfileModal.addEventListener('click', (e) => {
    if (e.target === viewProfileModal || e.target.closest('.close-profile-btn')) {
        closeModal(viewProfileModal);
    }
});

// Altere o event listener de 'channelListContent' para incluir a nova ação
channelListContent.addEventListener('click', async (e) => {
    const removeButton = e.target.closest(".remove-friend-btn");
    const viewProfileButton = e.target.closest(".view-profile-btn"); // <- Adicione esta linha

    if (removeButton) {
        const friendItem = removeButton.closest(".friend-item");
        const friendId = friendItem.dataset.friendId;
        const friendName = friendItem.dataset.friendName;
        openRemoveFriendModal(friendId, friendName, friendItem);
    } else if (viewProfileButton) { // <- Adicione este bloco
        const friendId = viewProfileButton.dataset.friendId;
        showUserProfile(friendId);
    }
});

  // --- INICIALIZAÇÃO DA APLICAÇÃO ---
  function main() {
    renderFriendsView();
    setupEventListeners();
  }
  main();
});

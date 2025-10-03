// src/components/PendingRequests/PendingRequests.jsx
import React from "react";
import {
  PendingContainer,
  StyledListHeader,
  RequestItem,
  UserInfo,
  StyledAvatarContainer,
  StyledNameTag,
  Actions,
} from "./styles";

const PendingRequests = ({ pending, sent, onAction }) => {
  return (
    <PendingContainer>
      <StyledListHeader>Pedidos Recebidos - {pending.length}</StyledListHeader>
      {pending.length > 0 ? (
        pending.map((req) => (
          <RequestItem key={req.id_amizade}>
            <UserInfo>
              <StyledAvatarContainer>
                <img
                  src={req.foto_perfil || "/images/logo.png"}
                  alt={req.nome}
                />
              </StyledAvatarContainer>
              <StyledNameTag>
                {req.nome}
                <span className="user-tag">#{req.id_usuario}</span>
              </StyledNameTag>
            </UserInfo>
            <Actions>
              <button
                onClick={() => onAction("accept", req.id_amizade)}
                className="accept"
                title="Aceitar"
              >
                <i className="fas fa-check-circle"></i>
              </button>
              <button
                onClick={() => onAction("reject", req.id_amizade)}
                className="reject"
                title="Recusar"
              >
                <i className="fas fa-times-circle"></i>
              </button>{" "}
            </Actions>
          </RequestItem>
        ))
      ) : (
        <p style={{ padding: "8px", color: "var(--text-muted)" }}>
          Nenhum pedido recebido.
        </p>
      )}

      <StyledListHeader style={{ marginTop: "20px" }}>
        Pedidos Enviados - {sent.length}
      </StyledListHeader>
      {sent.length > 0 ? (
        sent.map((req) => (
          <RequestItem key={req.id_amizade}>
            <UserInfo>
              <StyledAvatarContainer>
                <img
                  src={req.foto_perfil || "/images/logo.png"}
                  alt={req.nome}
                />
              </StyledAvatarContainer>
              <StyledNameTag>
                {req.nome}
                <span className="user-tag">#{req.id_usuario}</span>
              </StyledNameTag>
            </UserInfo>
            <Actions>
              {/* CORREÇÃO APLICADA AQUI */}
              <button
                onClick={() => onAction("cancel", req.id_amizade)}
                className="cancel"
                title="Cancelar Pedido"
              >
                <i className="fas fa-trash"></i>
              </button>
            </Actions>
          </RequestItem>
        ))
      ) : (
        <p style={{ padding: "8px", color: "var(--text-muted)" }}>
          Nenhum pedido enviado.
        </p>
      )}
    </PendingContainer>
  );
};

export default PendingRequests;

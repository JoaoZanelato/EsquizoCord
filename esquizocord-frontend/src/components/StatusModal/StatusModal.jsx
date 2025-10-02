// src/components/StatusModal/StatusModal.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../services/api";
import {
  ModalOverlay,
  ModalContent,
  CloseButton,
  Title,
} from "../../pages/Settings/styles";
import {
  SubmitButton,
  CancelButton,
  ModalActions,
} from "../CreateGroupModal/styles";
import {
  StatusMenu,
  StatusOption,
  StatusIndicator,
  CustomStatusInput,
} from "./styles";

const STATUS_OPTIONS = {
  online: { label: "Online", color: "#43b581", icon: "fa-circle" },
  ausente: { label: "Ausente", color: "#faa61a", icon: "fa-moon" },
  ocupado: { label: "Ocupado", color: "#f04747", icon: "fa-minus-circle" },
  invisivel: { label: "Invisível", color: "#747f8d", icon: "fa-circle-notch" },
};

const StatusModal = ({ isOpen, onClose }) => {
  const { user, setUser } = useAuth();
  const [status, setStatus] = useState(user?.status || "online");
  const [customStatus, setCustomStatus] = useState(
    user?.status_personalizado || ""
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setStatus(user.status || "online");
      setCustomStatus(user.status_personalizado || "");
    }
  }, [user, isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiClient.post("/users/status", {
        status: status,
        status_personalizado: customStatus,
      });
      // Atualiza o contexto do utilizador localmente para refletir a mudança imediatamente
      setUser((prevUser) => ({
        ...prevUser,
        status: status,
        status_personalizado: customStatus,
      }));
      onClose();
    } catch (error) {
      alert("Não foi possível atualizar o seu status.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalOverlay $isOpen={isOpen} onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <Title as="h3">Definir Status</Title>

        <StatusMenu>
          {Object.entries(STATUS_OPTIONS).map(([key, value]) => (
            <StatusOption
              key={key}
              selected={status === key}
              onClick={() => setStatus(key)}
            >
              <i
                className={`fas ${value.icon}`}
                style={{ color: value.color }}
              ></i>
              <span>{value.label}</span>
            </StatusOption>
          ))}
        </StatusMenu>

        <CustomStatusInput
          type="text"
          placeholder="O que se passa?"
          value={customStatus}
          onChange={(e) => setCustomStatus(e.target.value)}
          maxLength={128}
        />

        <ModalActions>
          <CancelButton type="button" onClick={onClose}>
            Cancelar
          </CancelButton>
          <SubmitButton type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "A Guardar..." : "Guardar"}
          </SubmitButton>
        </ModalActions>
      </ModalContent>
    </ModalOverlay>
  );
};

export default StatusModal;

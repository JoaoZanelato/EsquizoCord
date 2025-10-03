// src/components/ManageMemberRolesModal/ManageMemberRolesModal.jsx
import React, { useState, useEffect } from "react";
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
import { RolesListContainer, RoleCheckboxItem } from "./styles";

const ManageMemberRolesModal = ({
  isOpen,
  onClose,
  member,
  groupDetails,
  onRolesUpdated,
}) => {
  const [allRoles, setAllRoles] = useState([]);
  const [memberRoleIds, setMemberRoleIds] = useState(new Set());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && groupDetails && member) {
      // Carrega todos os cargos disponíveis no grupo
      apiClient
        .get(`/groups/${groupDetails.id_grupo}/roles`)
        .then((response) => {
          setAllRoles(response.data);
        });

      // Define os cargos que o membro já possui
      const currentRoleIds = new Set(
        member.cargos?.map((r) => r.id_cargo) || []
      );
      setMemberRoleIds(currentRoleIds);
    }
  }, [isOpen, groupDetails, member]);

  const handleRoleToggle = (roleId) => {
    const newRoleIds = new Set(memberRoleIds);
    if (newRoleIds.has(roleId)) {
      newRoleIds.delete(roleId);
    } else {
      newRoleIds.add(roleId);
    }
    setMemberRoleIds(newRoleIds);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiClient.put(
        `/groups/${groupDetails.id_grupo}/members/${member.id_usuario}/roles`,
        {
          roles: Array.from(memberRoleIds),
        }
      );
      onRolesUpdated(); // Pede ao Dashboard para recarregar os dados
      onClose();
    } catch (error) {
      alert("Erro ao atualizar os cargos do membro.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay $isOpen={isOpen} onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <Title as="h3">Gerir Cargos de {member?.nome}</Title>
        <RolesListContainer>
          {allRoles.map((role) => (
            <RoleCheckboxItem key={role.id_cargo} color={role.cor}>
              <input
                type="checkbox"
                checked={memberRoleIds.has(role.id_cargo)}
                onChange={() => handleRoleToggle(role.id_cargo)}
                // Não permite remover o cargo "Dono"
                disabled={role.nome_cargo === "Dono"}
              />
              <span>{role.icone}</span>
              <span>{role.nome_cargo}</span>
            </RoleCheckboxItem>
          ))}
        </RolesListContainer>
        <ModalActions style={{ marginTop: "20px" }}>
          <CancelButton onClick={onClose}>Cancelar</CancelButton>
          <SubmitButton onClick={handleSave} disabled={isSaving}>
            {isSaving ? "A guardar..." : "Guardar"}
          </SubmitButton>
        </ModalActions>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ManageMemberRolesModal;

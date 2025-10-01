// src/components/RolesManagerModal/RolesManagerModal.jsx
import React, { useState, useEffect } from "react";
import apiClient from "../../services/api";
import {
  ModalOverlay,
  ModalContent,
  CloseButton,
  Title,
} from "../../pages/Settings/styles";
import {
  Form,
  FormGroup,
  Label,
  Input,
  ModalActions,
  SubmitButton,
} from "../CreateGroupModal/styles";
import {
  RolesLayout,
  RoleList,
  RoleItem,
  RoleEditor,
  PermissionGroup,
  PermissionItem,
  SwitchLabel,
  SwitchInput,
  Slider,
  RoleColorDot,
  RoleName,
  DeleteRoleButton,
  ColorInput,
} from "./styles";

const PERMISSIONS = {
  GERIR_CARGOS: 1,
  EXPULSAR_MEMBROS: 2,
  APAGAR_MENSAGENS: 4,
};

const PermissionToggle = ({ label, checked, onChange, disabled }) => (
  <PermissionItem>
    <span>{label}</span>
    <SwitchLabel>
      <SwitchInput
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <Slider />
    </SwitchLabel>
  </PermissionItem>
);

const RolesManagerModal = ({
  isOpen,
  onClose,
  groupDetails,
  onRoleUpdated,
}) => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Para o carregamento inicial
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // <-- NOVO ESTADO PARA A AÇÃO DE SALVAR

  useEffect(() => {
    if (isOpen && groupDetails) {
      const fetchRoles = async () => {
        setIsLoading(true);
        try {
          const response = await apiClient.get(
            `/groups/${groupDetails.id_grupo}/roles`
          );
          setRoles(response.data);
          if (response.data.length > 0) {
            setSelectedRole(response.data[0]);
          }
        } catch (error) {
          console.error("Erro ao buscar cargos:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchRoles();
    } else {
      setRoles([]);
      setSelectedRole(null);
      setIsCreating(false);
    }
  }, [isOpen, groupDetails]);

  const handlePermissionChange = (permission) => {
    if (!selectedRole || selectedRole.nome_cargo === "Dono") return;
    const currentPermissions = selectedRole.permissoes || 0;
    const newPermissions =
      (currentPermissions & permission) > 0
        ? currentPermissions ^ permission
        : currentPermissions | permission;

    handleFieldChange("permissoes", newPermissions);
  };

  const handleSaveRole = async () => {
    if (!selectedRole) return;
    setIsSaving(true); // <-- Ativa o estado de "a salvar"
    const { id_grupo, ...roleData } = selectedRole;

    try {
      if (isCreating) {
        const response = await apiClient.post(
          `/groups/${groupDetails.id_grupo}/roles`,
          roleData
        );
        const newRole = response.data;
        setRoles((prev) => [...prev, newRole]);
        setSelectedRole(newRole);
        setIsCreating(false);
        if (onRoleUpdated) onRoleUpdated(newRole);
      } else {
        await apiClient.put(
          `/groups/${groupDetails.id_grupo}/roles/${selectedRole.id_cargo}`,
          roleData
        );
        if (onRoleUpdated) onRoleUpdated(selectedRole);
      }
    } catch (error) {
      alert("Erro ao guardar o cargo.");
    } finally {
      setIsSaving(false); // <-- Desativa o estado de "a salvar" no final
    }
  };

  const handleNewRoleClick = () => {
    setIsCreating(true);
    setSelectedRole({
      nome_cargo: "novo cargo",
      cor: "#99aab5",
      icone: "⭐",
      permissoes: 0,
    });
  };

  const handleDeleteRole = async (e, roleIdToDelete) => {
    e.stopPropagation();
    if (
      window.confirm(
        "Tem a certeza de que deseja apagar este cargo? Esta ação é irreversível."
      )
    ) {
      try {
        await apiClient.delete(
          `/groups/${groupDetails.id_grupo}/roles/${roleIdToDelete}`
        );
        const newRoles = roles.filter((r) => r.id_cargo !== roleIdToDelete);
        setRoles(newRoles);
        setSelectedRole(newRoles.length > 0 ? newRoles[0] : null);
      } catch (error) {
        alert("Erro ao apagar o cargo.");
      }
    }
  };

  const handleFieldChange = (field, value) => {
    if (!selectedRole) return;
    const updatedSelectedRole = { ...selectedRole, [field]: value };
    setSelectedRole(updatedSelectedRole);

    if (!isCreating) {
      setRoles((prevRoles) =>
        prevRoles.map((role) =>
          role.id_cargo === selectedRole.id_cargo ? updatedSelectedRole : role
        )
      );
    }
  };

  if (!isOpen) return null;

  const isOwnerRoleSelected =
    selectedRole?.nome_cargo === "Dono" && !isCreating;

  return (
    <ModalOverlay $isOpen={isOpen} onClick={onClose}>
      <ModalContent
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "800px", minHeight: "500px" }}
      >
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <Title as="h3">Gerir Cargos</Title>

        {/* Agora, o conteúdo só some durante o carregamento inicial */}
        {isLoading ? (
          <p>A carregar cargos...</p>
        ) : (
          <RolesLayout>
            <RoleList>
              <SubmitButton
                type="button"
                onClick={handleNewRoleClick}
                style={{ marginBottom: "10px" }}
              >
                Criar Cargo
              </SubmitButton>
              {roles.map((role) => (
                <RoleItem
                  key={role.id_cargo}
                  $active={
                    selectedRole?.id_cargo === role.id_cargo && !isCreating
                  }
                  onClick={() => {
                    setIsCreating(false);
                    setSelectedRole(role);
                  }}
                >
                  <RoleColorDot color={role.cor} />
                  <span>{role.icone}</span>
                  <RoleName>{role.nome_cargo}</RoleName>
                  {role.nome_cargo !== "Dono" && (
                    <DeleteRoleButton
                      onClick={(e) => handleDeleteRole(e, role.id_cargo)}
                    >
                      <i className="fas fa-trash"></i>
                    </DeleteRoleButton>
                  )}
                </RoleItem>
              ))}
            </RoleList>
            <RoleEditor>
              {selectedRole && (
                <Form onSubmit={(e) => e.preventDefault()}>
                  <FormGroup>
                    <Label>NOME DO CARGO</Label>
                    <Input
                      value={selectedRole.nome_cargo}
                      onChange={(e) =>
                        handleFieldChange("nome_cargo", e.target.value)
                      }
                      disabled={isOwnerRoleSelected}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>ÍCONE (EMOJI)</Label>
                    <Input
                      value={selectedRole.icone || ""}
                      onChange={(e) =>
                        handleFieldChange("icone", e.target.value)
                      }
                      maxLength={2}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>COR DO CARGO</Label>
                    <ColorInput
                      type="color"
                      value={selectedRole.cor || "#99aab5"}
                      onChange={(e) => handleFieldChange("cor", e.target.value)}
                    />
                  </FormGroup>
                  <PermissionGroup>
                    <h4>Permissões</h4>
                    {Object.entries(PERMISSIONS).map(([key, value]) => (
                      <PermissionToggle
                        key={key}
                        label={key.replace(/_/g, " ")}
                        checked={(selectedRole.permissoes & value) > 0}
                        onChange={() => handlePermissionChange(value)}
                        disabled={isOwnerRoleSelected}
                      />
                    ))}
                  </PermissionGroup>
                  <ModalActions style={{ justifyContent: "flex-end" }}>
                    <SubmitButton
                      type="button"
                      onClick={handleSaveRole}
                      disabled={isSaving}
                    >
                      {isSaving
                        ? "A guardar..."
                        : isCreating
                        ? "Criar Cargo"
                        : "Guardar Alterações"}
                    </SubmitButton>
                  </ModalActions>
                </Form>
              )}
            </RoleEditor>
          </RolesLayout>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

export default RolesManagerModal;

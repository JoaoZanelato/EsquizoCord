// src/components/EditGroupModal/EditGroupModal.jsx
import React, { useState, useEffect, useRef } from "react";
import apiClient from "../../services/api";
import { useAuth } from "../../context/AuthContext";
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
  CheckboxContainer,
  CancelButton,
  SubmitButton,
} from "../CreateGroupModal/styles";
import { ModalActions, DeleteButton, AnalyticsButton } from "./styles";
import ImageCropModal from "../ImageCropModal/ImageCropModal";
import {
  HiddenFileInput,
  CustomFileUploadButton,
  PreviewImage,
} from "../ImageCropModal/styles";
import RolesManagerModal from "../RolesManagerModal/RolesManagerModal";
import AnalyticsModal from "../AnalyticsModal/AnalyticsModal";

const PERMISSIONS = {
  VISUALIZAR_RELATORIOS: 16,
};

const EditGroupModal = ({
  isOpen,
  onClose,
  groupDetails,
  currentUserPermissions,
  onGroupUpdated,
  onGroupDeleted,
  onRoleUpdated,
}) => {
  const { user: currentUser } = useAuth();
  const [nome, setNome] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const [fotoOriginal, setFotoOriginal] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoRecortadaBlob, setFotoRecortadaBlob] = useState(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (groupDetails) {
      setNome(groupDetails.nome || "");
      setIsPrivate(groupDetails.is_private || false);
      setFotoPreview(groupDetails.foto || null);
      setIsOwner(currentUser.id_usuario === groupDetails.id_criador);
    }
  }, [groupDetails, currentUser.id_usuario]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("nome", nome);
    formData.append("isPrivate", isPrivate ? "on" : "off");
    if (fotoRecortadaBlob) {
      formData.append("foto", fotoRecortadaBlob, "group-photo.png");
    }
    try {
      await apiClient.post(
        `/groups/${groupDetails.id_grupo}/settings`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      onGroupUpdated();
      onClose();
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao atualizar o grupo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Tem a certeza de que deseja apagar o servidor "${nome}"? Esta ação é irreversível.`
      )
    )
      return;
    setIsSubmitting(true);
    try {
      await apiClient.delete(`/groups/${groupDetails.id_grupo}`);
      onGroupDeleted();
      onClose();
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao apagar o grupo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () =>
        setFotoOriginal(reader.result.toString() || "")
      );
      reader.readAsDataURL(e.target.files[0]);
      setIsCropModalOpen(true);
      e.target.value = null;
    }
  };

  const onCropComplete = (croppedBlob) => {
    setFotoRecortadaBlob(croppedBlob);
    setFotoPreview(URL.createObjectURL(croppedBlob));
  };

  const canViewAnalytics =
    (currentUserPermissions & PERMISSIONS.VISUALIZAR_RELATORIOS) > 0;

  return (
    <>
      <ModalOverlay $isOpen={isOpen} onClick={onClose}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <CloseButton onClick={onClose}>&times;</CloseButton>
          <Title as="h3" style={{ textAlign: "center", marginBottom: "20px" }}>
            Configurações do Grupo
          </Title>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="edit-group-name">Nome do Servidor</Label>
              <Input
                id="edit-group-name"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                disabled={!isOwner}
              />
            </FormGroup>
            <FormGroup>
              <Label>Foto do Servidor</Label>
              <HiddenFileInput
                type="file"
                onChange={handleFileSelect}
                accept="image/*"
                ref={fileInputRef}
                disabled={!isOwner}
              />
              <CustomFileUploadButton
                type="button"
                onClick={() => fileInputRef.current.click()}
                disabled={!isOwner}
              >
                <i className="fas fa-camera"></i> Alterar Foto
              </CustomFileUploadButton>
              {fotoPreview && <PreviewImage src={fotoPreview} alt="Prévia" />}
            </FormGroup>
            <CheckboxContainer>
              <Input
                type="checkbox"
                id="edit-group-private"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                style={{ width: "auto" }}
                disabled={!isOwner}
              />
              <label htmlFor="edit-group-private">Grupo Privado</label>
            </CheckboxContainer>
            <SubmitButton
              type="button"
              onClick={() => setIsRolesModalOpen(true)}
              style={{
                marginTop: "20px",
                backgroundColor: "var(--background-secondary-alt, #202225)",
              }}
            >
              Gerir Cargos e Permissões
            </SubmitButton>

            {canViewAnalytics && (
              <AnalyticsButton
                type="button"
                onClick={() => setIsAnalyticsModalOpen(true)}
              >
                Ver Relatórios
              </AnalyticsButton>
            )}

            <ModalActions>
              {isOwner && (
                <DeleteButton
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  Apagar Grupo
                </DeleteButton>
              )}
              <div>
                <CancelButton type="button" onClick={onClose}>
                  Cancelar
                </CancelButton>
                <SubmitButton type="submit" disabled={isSubmitting || !isOwner}>
                  {isSubmitting ? "A Guardar..." : "Guardar"}
                </SubmitButton>
              </div>
            </ModalActions>
          </Form>
        </ModalContent>
      </ModalOverlay>

      <RolesManagerModal
        isOpen={isRolesModalOpen}
        onClose={() => setIsRolesModalOpen(false)}
        groupDetails={groupDetails}
        onRoleUpdated={onRoleUpdated}
      />

      <AnalyticsModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
        groupDetails={groupDetails}
      />

      <ImageCropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        imageSrc={fotoOriginal}
        onCropComplete={onCropComplete}
        aspect={1}
      />
    </>
  );
};

export default EditGroupModal;

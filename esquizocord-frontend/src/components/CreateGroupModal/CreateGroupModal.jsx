// src/components/CreateGroupModal/CreateGroupModal.jsx
import React, { useState, useRef } from "react";
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
  CheckboxContainer,
  ModalActions,
  CancelButton,
  SubmitButton,
} from "./styles";
import ImageCropModal from "../ImageCropModal/ImageCropModal";
import {
  HiddenFileInput,
  CustomFileUploadButton,
  PreviewImage,
} from "../ImageCropModal/styles";

const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
  const [nome, setNome] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [fotoOriginal, setFotoOriginal] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoRecortadaBlob, setFotoRecortadaBlob] = useState(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("nome", nome);
    formData.append("isPrivate", isPrivate ? "on" : "off");
    if (fotoRecortadaBlob) {
      formData.append("foto", fotoRecortadaBlob);
    }
    try {
      await apiClient.post("/groups/criar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onGroupCreated();
      handleClose();
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao criar o grupo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setNome("");
    setIsPrivate(false);
    setFotoOriginal(null);
    setFotoPreview(null);
    setFotoRecortadaBlob(null);
    onClose();
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

  return (
    <>
      <ModalOverlay $isOpen={isOpen} onClick={handleClose}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <CloseButton onClick={handleClose}>&times;</CloseButton>
          <Title as="h3" style={{ textAlign: "center", marginBottom: "20px" }}>
            Crie o seu servidor
          </Title>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="group-name">Nome do Servidor</Label>
              <Input
                id="group-name"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="group-photo">Foto do Servidor (Opcional)</Label>
              <HiddenFileInput
                type="file"
                id="group-photo"
                name="foto"
                onChange={handleFileSelect}
                accept="image/*"
                ref={fileInputRef}
              />
              <CustomFileUploadButton
                type="button"
                onClick={() => fileInputRef.current.click()}
              >
                <i className="fas fa-camera"></i> Selecionar Foto
                {fotoPreview && <img src={fotoPreview} alt="Preview" />}
              </CustomFileUploadButton>
              {fotoPreview && (
                <PreviewImage src={fotoPreview} alt="Prévia da foto do grupo" />
              )}
            </FormGroup>
            <CheckboxContainer>
              <Input
                type="checkbox"
                id="group-private"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                style={{ width: "auto" }}
              />
              <label htmlFor="group-private">Grupo Privado</label>
            </CheckboxContainer>
            <ModalActions>
              <CancelButton type="button" onClick={handleClose}>
                Cancelar
              </CancelButton>
              <SubmitButton
                type="submit"
                disabled={isSubmitting || !nome.trim()}
              >
                {isSubmitting ? "A Criar..." : "Criar"}
              </SubmitButton>
            </ModalActions>
          </Form>
        </ModalContent>
      </ModalOverlay>
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

export default CreateGroupModal;

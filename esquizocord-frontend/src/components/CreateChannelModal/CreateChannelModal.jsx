// src/components/CreateChannelModal/CreateChannelModal.jsx
import React, { useState } from "react";
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
  CancelButton,
  SubmitButton,
} from "./styles";

const CreateChannelModal = ({
  isOpen,
  onClose,
  groupDetails,
  onChannelCreated,
}) => {
  const [channelName, setChannelName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!channelName.trim()) return;
    setIsSaving(true);
    try {
      const response = await apiClient.post(
        `/groups/${groupDetails.id_grupo}/channels`,
        { channelName }
      );
      onChannelCreated(response.data);
      handleClose();
    } catch (error) {
      alert(error.response?.data?.message || "Não foi possível criar o canal.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setChannelName("");
    onClose();
  };

  return (
    <ModalOverlay $isOpen={isOpen} onClick={handleClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={handleClose}>&times;</CloseButton>
        <Title as="h3" style={{ textAlign: "center", marginBottom: "20px" }}>
          Criar Canal de Texto
        </Title>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="channel-name">NOME DO CANAL</Label>
            <Input
              id="channel-name"
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="novo-canal"
              required
            />
          </FormGroup>
          <ModalActions>
            <CancelButton type="button" onClick={handleClose}>
              Cancelar
            </CancelButton>
            <SubmitButton
              type="submit"
              disabled={isSaving || !channelName.trim()}
            >
              {isSaving ? "A criar..." : "Criar Canal"}
            </SubmitButton>
          </ModalActions>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default CreateChannelModal;

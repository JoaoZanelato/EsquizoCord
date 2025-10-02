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
  ChannelTypeSelector, // <-- IMPORTAR
  RadioLabel, // <-- IMPORTAR
} from "./styles";

const CreateChannelModal = ({
  isOpen,
  onClose,
  groupDetails,
  onChannelCreated,
}) => {
  const [channelName, setChannelName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  // --- INÍCIO DA ALTERAÇÃO ---
  const [channelType, setChannelType] = useState("TEXTO"); // Estado para o tipo de canal
  // --- FIM DA ALTERAÇÃO ---

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!channelName.trim()) return;
    setIsSaving(true);
    try {
      // --- INÍCIO DA ALTERAÇÃO ---
      const response = await apiClient.post(
        `/groups/${groupDetails.id_grupo}/channels`,
        { channelName, channelType } // Enviar o tipo de canal
      );
      // --- FIM DA ALTERAÇÃO ---
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
    setChannelType("TEXTO"); // Resetar o estado ao fechar
    onClose();
  };

  return (
    <ModalOverlay $isOpen={isOpen} onClick={handleClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={handleClose}>&times;</CloseButton>
        <Title as="h3" style={{ textAlign: "center", marginBottom: "20px" }}>
          Criar Canal
        </Title>
        <Form onSubmit={handleSubmit}>
          {/* --- INÍCIO DA ALTERAÇÃO --- */}
          <FormGroup>
            <Label>TIPO DE CANAL</Label>
            <ChannelTypeSelector>
              <RadioLabel className={channelType === "TEXTO" ? "selected" : ""}>
                <input
                  type="radio"
                  name="channelType"
                  value="TEXTO"
                  checked={channelType === "TEXTO"}
                  onChange={() => setChannelType("TEXTO")}
                />
                <i className="fas fa-hashtag"></i>
                <span>Texto</span>
              </RadioLabel>
              <RadioLabel className={channelType === "VOZ" ? "selected" : ""}>
                <input
                  type="radio"
                  name="channelType"
                  value="VOZ"
                  checked={channelType === "VOZ"}
                  onChange={() => setChannelType("VOZ")}
                />
                <i className="fas fa-volume-up"></i>
                <span>Voz</span>
              </RadioLabel>
            </ChannelTypeSelector>
          </FormGroup>
          {/* --- FIM DA ALTERAÇÃO --- */}

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

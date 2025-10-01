// src/pages/Settings/Settings.jsx
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext/NotificationContext"; 
import apiClient from "../../services/api";

import ImageCropModal from "../../components/ImageCropModal/ImageCropModal";
import {
  HiddenFileInput,
  CustomFileUploadButton,
} from "../../components/ImageCropModal/styles";

import {
  SettingsPageContainer,
  SettingsCard,
  BackLink,
  Title,
  Form,
  ProfilePhotoContainer,
  FormGroup,
  Label,
  Input,
  Textarea,
  Select,
  SubmitButton,
  FooterActions,
  ActionLink,
  DeleteContainer,
  ModalOverlay,
  ModalContent,
  CloseButton,
} from "./styles";

const Settings = () => {
  const { user, setUser, logout } = useAuth();
  const { addNotification } = useNotification();

  // --- CORREÇÃO 1: Usar snake_case para o estado inicial ---
  const [formData, setFormData] = useState({
    nome: user.nome,
    biografia: user.biografia || "",
    id_tema: user.id_tema || "1",
  });

  const [themes, setThemes] = useState([]);
  const [preview, setPreview] = useState(
    user.foto_perfil || "/images/logo.png"
  );
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const response = await apiClient.get("/users/temas");
        setThemes(response.data);
      } catch (error) {
        console.error("Erro ao buscar temas:", error);
        addNotification("Não foi possível carregar os temas.", "error");
      }
    };
    fetchThemes();
  }, [addNotification]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () =>
        setImageToCrop(reader.result.toString() || "")
      );
      reader.readAsDataURL(e.target.files[0]);
      setIsCropModalOpen(true);
      e.target.value = null;
    }
  };

  const onCropComplete = (croppedBlob) => {
    setSelectedFile(croppedBlob);
    setPreview(URL.createObjectURL(croppedBlob));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("nome", formData.nome);
    data.append("biografia", formData.biografia);
    data.append(
      "id_tema",
      formData.id_tema === "1" ? "null" : formData.id_tema
    );
    if (selectedFile) {
      data.append("fotoPerfil", selectedFile, "profile-photo.png");
    }
    try {
      const response = await apiClient.post("/users/configuracao", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser(response.data);
      addNotification("Perfil atualizado com sucesso!", "success");
    } catch (error) {
      addNotification(
        error.response?.data?.message || "Erro ao atualizar o perfil.",
        "error"
      );
    }
  };

  // ... (Restante das funções: handlePasswordChange, handlePasswordSubmit, handleDeleteAccount) ...
  // Nenhuma alteração necessária nessas funções

  return (
    <>
      <SettingsPageContainer>
        <SettingsCard>
          <BackLink to="/dashboard" title="Voltar ao Dashboard">
            <i className="fas fa-arrow-left"></i>
          </BackLink>
          <Title>Configurações de {user.nome}</Title>

          {/* --- CORREÇÃO 2: Adicionar os campos que faltavam ao formulário --- */}
          <Form onSubmit={handleProfileSubmit}>
            <ProfilePhotoContainer>
              <img src={preview} alt="Prévia" />
              <HiddenFileInput
                type="file"
                onChange={handleFileSelect}
                accept="image/*"
                ref={fileInputRef}
              />
              <CustomFileUploadButton
                type="button"
                onClick={() => fileInputRef.current.click()}
              >
                <i className="fas fa-camera"></i> Alterar Foto
              </CustomFileUploadButton>
            </ProfilePhotoContainer>

            <FormGroup>
              <Label htmlFor="nome">Nome</Label>
              <Input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                required
              />
            </FormGroup>

            {/* CAMPO DE BIOGRAFIA ADICIONADO */}
            <FormGroup>
              <Label htmlFor="biografia">Biografia</Label>
              <Textarea
                id="biografia"
                name="biografia"
                value={formData.biografia}
                onChange={handleInputChange}
                placeholder="Fale um pouco sobre você..."
              />
            </FormGroup>

            {/* CAMPO DE TEMAS ADICIONADO */}
            <FormGroup>
              <Label htmlFor="id_tema">Tema</Label>
              <Select
                id="id_tema"
                name="id_tema"
                value={formData.id_tema}
                onChange={handleInputChange}
              >
                {themes.map((theme) => (
                  <option key={theme.id_tema} value={theme.id_tema}>
                    {theme.nome_tema}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <SubmitButton type="submit">Salvar Alterações</SubmitButton>
          </Form>

          <FooterActions>
          </FooterActions>
        </SettingsCard>
      </SettingsPageContainer>

      {/* ... (Modais sem alterações) ... */}
    </>
  );
};

export default Settings;

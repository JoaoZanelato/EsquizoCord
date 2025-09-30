// src/pages/Settings/Settings.jsx
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
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
  SectionDivider,
  ModalOverlay,
  ModalContent,
  CloseButton,
} from "./styles";

const Settings = () => {
  const { user, setUser, logout } = useAuth();
  const [formData, setFormData] = useState({
    nome: user.Nome,
    biografia: user.Biografia || "",
    id_tema: user.id_tema || "1",
  });
  const [themes, setThemes] = useState([]);
  const [preview, setPreview] = useState(user.FotoPerfil || "/images/logo.png");
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState({
    type: "",
    text: "",
  });
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const response = await apiClient.get("/temas");
        setThemes(response.data);
      } catch (error) {
        console.error("Erro ao buscar temas:", error);
      }
    };
    fetchThemes();
  }, []);

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
      data.append("fotoPerfil", selectedFile);
    }
    try {
      const response = await apiClient.post("/configuracao", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser(response.data);
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao atualizar o perfil.");
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: "", text: "" });
    try {
      const response = await apiClient.post(
        "/users/change-password",
        passwordData
      );
      setPasswordMessage({ type: "success", text: response.data.message });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordMessage({ type: "", text: "" });
      }, 2000);
    } catch (error) {
      setPasswordMessage({
        type: "error",
        text: error.response?.data?.message || "Erro ao alterar a senha.",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        "Você tem ABSOLUTA CERTEZA? Esta ação é permanente e todos os seus dados serão apagados."
      )
    ) {
      return;
    }
    try {
      const response = await apiClient.delete("/users/me", {
        data: { senha: deletePassword },
      });
      alert(response.data.message);
      logout();
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao excluir a conta.");
    }
  };

  return (
    <>
      <SettingsPageContainer>
        <SettingsCard>
          <BackLink to="/dashboard" title="Voltar ao Dashboard">
            <i className="fas fa-arrow-left"></i>
          </BackLink>
          <Title>Configurações de {user.Nome}</Title>
          <Form onSubmit={handleProfileSubmit}>
            <ProfilePhotoContainer>
              <img src={preview} alt="Prévia" />
              <HiddenFileInput
                type="file"
                id="fotoPerfil"
                name="fotoPerfil"
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
            <ActionLink onClick={logout}>Sair da Conta</ActionLink>
            <div>
              <ActionLink onClick={() => setIsPasswordModalOpen(true)}>
                Alterar Senha
              </ActionLink>
              <ActionLink $danger onClick={() => setShowDelete(!showDelete)}>
                Excluir Conta
              </ActionLink>
            </div>
          </FooterActions>
          {showDelete && (
            <DeleteContainer>
              <p>
                <b>Ação Irreversível.</b> Para confirmar a exclusão, digite sua
                senha.
              </p>
              <Input
                type="password"
                placeholder="Sua senha"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
              <SubmitButton
                style={{
                  backgroundColor: "var(--red-danger)",
                  marginTop: "10px",
                }}
                onClick={handleDeleteAccount}
              >
                Confirmar Exclusão
              </SubmitButton>
            </DeleteContainer>
          )}
        </SettingsCard>
      </SettingsPageContainer>
      <ModalOverlay
        $isOpen={isPasswordModalOpen}
        onClick={() => setIsPasswordModalOpen(false)}
      >
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <CloseButton onClick={() => setIsPasswordModalOpen(false)}>
            &times;
          </CloseButton>
          <Title
            as="h3"
            style={{
              fontSize: "20px",
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            Alterar Senha
          </Title>
          <Form onSubmit={handlePasswordSubmit}>
            <FormGroup>
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <Input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
              />
            </FormGroup>
            {passwordMessage.text && (
              <p
                style={{
                  color:
                    passwordMessage.type === "error"
                      ? "var(--red-danger)"
                      : "var(--green-accent)",
                  textAlign: "center",
                  marginBottom: "15px",
                }}
              >
                {passwordMessage.text}
              </p>
            )}
            <SubmitButton type="submit">Alterar Senha</SubmitButton>
          </Form>
        </ModalContent>
      </ModalOverlay>
      <ImageCropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        imageSrc={imageToCrop}
        onCropComplete={onCropComplete}
        aspect={1}
      />
    </>
  );
};

export default Settings;

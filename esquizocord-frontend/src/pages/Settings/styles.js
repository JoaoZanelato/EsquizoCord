// src/pages/Settings/styles.js
import styled from "styled-components";
import { Link } from "react-router-dom";

// --- IMPORTAÇÃO DOS ESTILOS PARTILHADOS ---
export {
  ModalOverlay,
  ModalContent,
  CloseButton,
  Title,
  Form,
  FormGroup,
  Label,
  Input,
  SubmitButton,
} from "../../components/CreateGroupModal/styles";

export const SettingsPageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
  padding: 40px 20px;
  background-image: url("/images/background.png");
  background-size: cover;
  background-attachment: fixed;
  overflow-y: auto;
`;

export const SettingsCard = styled.div`
  position: relative;
  background-color: ${({ theme }) => theme.backgroundPrimary};
  padding: 24px;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;
`;

export const BackLink = styled(Link)`
  position: absolute;
  top: 20px;
  left: 20px;
  background-color: ${({ theme }) => theme.backgroundSecondary};
  color: ${({ theme }) => theme.textNormal};
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  z-index: 1;
  &:hover {
    background-color: ${({ theme }) => theme.backgroundTertiary};
  }
`;

export const ProfilePhotoContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;

  img {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
    margin-bottom: 12px;
    border: 2px solid ${({ theme }) => theme.brandExperiment};
  }

  .change-photo-btn {
    background: none;
    border: none;
    color: ${({ theme }) => theme.purpleAccent};
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
  }
`;

export const Textarea = styled.textarea`
  width: 100%;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid ${({ theme }) => theme.backgroundSecondary};
  background-color: ${({ theme }) => theme.backgroundSecondary};
  color: ${({ theme }) => theme.textNormal};
  font-size: 14px;
  min-height: 80px;
  resize: vertical;
`;

export const Select = styled.select`
  width: 100%;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid ${({ theme }) => theme.backgroundSecondary};
  background-color: ${({ theme }) => theme.backgroundSecondary};
  color: ${({ theme }) => theme.textNormal};
  font-size: 14px;
`;

export const FooterActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid ${({ theme }) => theme.backgroundSecondary};

  > div {
    display: flex;
    gap: 10px;
  }
`;

export const ActionLink = styled.button`
  background-color: ${({ theme, $danger }) =>
    $danger ? "transparent" : theme.backgroundSecondary};
  border: 1px solid
    ${({ theme, $danger }) =>
      $danger ? theme.redDanger : theme.backgroundTertiary};
  color: ${({ theme, $danger }) =>
    $danger ? theme.redDanger : theme.textNormal};
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme, $danger }) =>
      $danger ? theme.redDanger : theme.backgroundModifierHover};
    border-color: ${({ theme, $danger }) =>
      $danger ? theme.redDanger : theme.backgroundTertiary};
    color: #fff;
    text-decoration: none;
  }
`;

export const DeleteContainer = styled.div`
  width: 100%;
  margin-top: 20px;
  padding: 16px;
  background-color: ${({ theme }) => theme.backgroundTertiary};
  border-radius: 5px;
  border: 1px solid ${({ theme }) => theme.redDanger};
`;

export const SectionDivider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.backgroundSecondary};
  margin: 24px 0;
`;

// src/pages/Settings/styles.js
import styled from "styled-components";
import { Link } from "react-router-dom";

export const SettingsPageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start; /* Alinha no topo para scroll */
  min-height: 100vh;
  padding: 40px 20px;
  background-image: url("/images/background.png");
  background-size: cover;
  background-attachment: fixed;
  overflow-y: auto;
`;

export const SettingsCard = styled.div`
  position: relative;
  /* ALTERAÇÃO: Usando a cor secundária para contraste */
  background-color: ${({ theme }) => theme.backgroundPrimary};
  padding: 24px;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
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
  &:hover {
    background-color: ${({ theme }) => theme.backgroundTertiary};
  }
`;

export const Title = styled.h2`
  margin-top: 0;
  margin-bottom: 24px;
  color: ${({ theme }) => theme.headerPrimary};
  text-align: center;
`;

export const Form = styled.form``;

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

export const FormGroup = styled.div`
  margin-bottom: 20px;
`;

export const Label = styled.label`
  display: block;
  color: ${({ theme }) => theme.textMuted};
  font-weight: bold;
  font-size: 12px;
  margin-bottom: 8px;
  text-transform: uppercase;
`;

export const Input = styled.input`
  width: 100%;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid ${({ theme }) => theme.backgroundSecondary};
  background-color: ${({ theme }) => theme.backgroundSecondary};
  color: ${({ theme }) => theme.textNormal};
  font-size: 14px;
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

export const SubmitButton = styled.button`
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.brandExperiment};
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
  &:hover {
    background-color: ${({ theme }) => theme.brandHover};
  }
`;

export const FooterActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid ${({ theme }) => theme.backgroundSecondary};
`;

export const ActionLink = styled.a`
  color: ${({ theme, $danger }) => ($danger ? theme.redDanger : theme.textMuted)};
  text-decoration: none;
  font-size: 14px;
  padding: 8px;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
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
export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.75);
  display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

export const ModalContent = styled.div`
  background-color: ${({ theme }) => theme.backgroundSecondary};
  padding: 24px;
  border-radius: 8px;
  width: 90%;
  max-width: 440px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  position: relative;
`;

export const CloseButton = styled.button`
    position: absolute;
    top: 10px;
    right: 15px;
    background: none;
    border: none;
    color: ${({ theme }) => theme.textMuted};
    font-size: 28px;
    cursor: pointer;
    line-height: 1;

    &:hover {
        color: ${({ theme }) => theme.headerPrimary};
    }
`;
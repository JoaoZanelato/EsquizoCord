// src/components/CreateGroupModal/styles.js
import styled from "styled-components";

// --- ESTILOS GLOBAIS DE MODAL E FORMULÁRIO CENTRALIZADOS AQUI ---
export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.75);
  display: ${({ $isOpen }) => ($isOpen ? "flex" : "none")};
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
  max-height: 90vh;
  overflow-y: auto;
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

export const Title = styled.h2`
  margin-top: 0;
  margin-bottom: 24px;
  color: ${({ theme }) => theme.headerPrimary};
  text-align: center;
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const FormGroup = styled.div``;

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
  border: 1px solid ${({ theme }) => theme.backgroundTertiary};
  background-color: ${({ theme }) => theme.backgroundTertiary};
  color: ${({ theme }) => theme.textNormal};
  font-size: 16px;
`;

export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
`;

export const CancelButton = styled.button`
  padding: 10px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  background: none;
  color: ${({ theme }) => theme.headerPrimary};

  &:hover {
    text-decoration: underline;
  }
`;

export const SubmitButton = styled.button`
  padding: 10px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  background-color: ${({ theme }) => theme.brandExperiment};
  color: white;

  &:hover {
    background-color: ${({ theme }) => theme.brandHover};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.backgroundTertiary};
    cursor: not-allowed;
  }
`;
// --- FIM DOS ESTILOS CENTRALIZADOS ---

// Estilos específicos do CreateGroupModal
export const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  label {
    margin: 0;
    font-size: 14px;
    color: ${({ theme }) => theme.textNormal};
    font-weight: 500;
    cursor: pointer;
  }
`;

// src/components/CreateGroupModal/styles.js
import styled from 'styled-components';

// Nota: Estamos reutilizando os componentes de Modal que já criamos.
// Se eles não estiverem em um local global, você pode copiar os estilos
// de 'src/pages/Settings/styles.js' para cá.

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
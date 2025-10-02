// src/components/CreateChannelModal/styles.js
import styled from "styled-components";

export {
  Form,
  FormGroup,
  Label,
  Input,
  ModalActions,
  CancelButton,
  SubmitButton,
} from "../CreateGroupModal/styles";

// --- INÍCIO DA NOVA ALTERAÇÃO ---
export const ChannelTypeSelector = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: ${({ theme }) => theme.backgroundTertiary};
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background-color 0.2s, border-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.backgroundModifierHover};
  }

  &.selected {
    background-color: ${({ theme }) => theme.backgroundModifierHover};
    border-color: ${({ theme }) => theme.brandExperiment};
  }

  input {
    margin-right: 12px;
  }

  i {
    margin-right: 10px;
    color: ${({ theme }) => theme.textMuted};
  }

  span {
    font-weight: 500;
    color: ${({ theme }) => theme.textNormal};
  }
`;
// --- FIM DA NOVA ALTERAÇÃO ---

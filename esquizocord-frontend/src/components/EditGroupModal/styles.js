// src/components/EditGroupModal/styles.js
import styled from "styled-components";
import { SubmitButton } from "../CreateGroupModal/styles"; // Importe o botão base

export const ModalActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid ${({ theme }) => theme.backgroundTertiary};
`;
export const LeaveButton = styled(DeleteButton)``;
export const DeleteButton = styled.button`
  background-color: ${({ theme }) => theme.redDanger};
  color: white;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background-color: #a6262e;
  }

  &:disabled {
    background-color: #5c5f67;
    cursor: not-allowed;
  }
`;

export const AnalyticsButton = styled(SubmitButton)`
  margin-top: 10px;
  background-color: ${({ theme }) => theme.greenAccent};

  &:hover {
    background-color: #3caa78;
  }
`;

// src/components/ManageMemberRolesModal/styles.js
import styled from "styled-components";

export const RolesListContainer = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const RoleCheckboxItem = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  background-color: ${({ theme }) => theme.backgroundPrimary};
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.backgroundModifierHover};
  }

  input {
    width: 18px;
    height: 18px;
  }

  span {
    color: ${({ color, theme }) => color || theme.textNormal};
  }
`;

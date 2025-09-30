// src/components/RolesManagerModal/styles.js
import styled from "styled-components";

export const RolesLayout = styled.div`
  display: flex;
  gap: 20px;
  min-height: 400px;
`;

export const RoleList = styled.div`
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid ${({ theme }) => theme.backgroundPrimary};
  padding-right: 20px;
  display: flex;
  flex-direction: column;
`;

export const RoleItem = styled.div`
  padding: 8px 12px;
  margin-bottom: 5px;
  border-radius: 4px;
  cursor: pointer;
  color: ${({ theme }) => theme.textNormal};
  border: 1px solid ${({ theme }) => theme.backgroundTertiary};
  background-color: ${({ theme, $active }) =>
    $active ? theme.backgroundModifierHover : "transparent"};
  font-weight: ${({ $active }) => ($active ? "bold" : "normal")};
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background-color: ${({ theme }) => theme.backgroundModifierHover};
  }
`;

export const RoleColorDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${(props) => props.color};
  flex-shrink: 0;
`;

export const RoleName = styled.span`
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const DeleteRoleButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.textMuted};
  cursor: pointer;
  visibility: hidden;
  opacity: 0;
  transition: opacity 0.2s;
  font-size: 14px;

  ${RoleItem}:hover & {
    visibility: visible;
    opacity: 1;
  }

  &:hover {
    color: ${({ theme }) => theme.redDanger};
  }
`;

export const RoleEditor = styled.div`
  flex-grow: 1;
`;

export const PermissionGroup = styled.div`
  margin-bottom: 20px;
  h4 {
    margin-bottom: 10px;
    color: ${({ theme }) => theme.headerPrimary};
    text-transform: uppercase;
    font-size: 12px;
  }
`;

export const PermissionItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  color: ${({ theme }) => theme.textNormal};
`;

// Switch (toggle) de permissão
export const SwitchLabel = styled.label`
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
`;

export const SwitchInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background-color: ${({ theme }) => theme.greenAccent};
  }

  &:checked + span:before {
    transform: translateX(20px);
  }
`;

export const Slider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme }) => theme.backgroundTertiary};
  transition: 0.4s;
  border-radius: 24px;

  &:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }
`;
export const ColorInput = styled.input`
  width: 100%;
  height: 40px;
  border-radius: 4px;
  border: 1px solid ${({ theme }) => theme.backgroundTertiary};
  background-color: transparent;
  cursor: pointer;

  /* Remove a borda padrão do seletor de cor no Chrome/Edge */
  &::-webkit-color-swatch-wrapper {
    padding: 2px;
  }
  &::-webkit-color-swatch {
    border: none;
    border-radius: 2px;
  }
`;

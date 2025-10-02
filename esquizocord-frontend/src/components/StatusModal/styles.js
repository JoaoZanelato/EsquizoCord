// src/components/StatusModal/styles.js
import styled from "styled-components";

export const StatusMenu = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 15px;
`;

export const StatusOption = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 4px;
  border: none;
  background-color: ${({ theme, selected }) =>
    selected ? theme.backgroundModifierHover : "transparent"};
  cursor: pointer;
  text-align: left;
  color: ${({ theme }) => theme.textNormal};

  &:hover {
    background-color: ${({ theme }) => theme.backgroundModifierHover};
  }

  i {
    width: 20px;
    text-align: center;
  }
`;

export const StatusIndicator = styled.span`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${({ color }) => color};
`;

export const CustomStatusInput = styled.input`
  width: 100%;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid ${({ theme }) => theme.backgroundTertiary};
  background-color: ${({ theme }) => theme.backgroundTertiary};
  color: ${({ theme }) => theme.textNormal};
  font-size: 14px;
  margin-top: 10px;
`;

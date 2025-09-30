// src/components/ImageCropModal/styles.js
import styled from 'styled-components';

// Reutilizamos os estilos base do modal de Settings
// Se preferir, pode mover ModalOverlay, ModalContent, CloseButton para um local mais global (ex: src/styles/sharedModals.js)

export const StyledImageCropModalOverlay = styled.div`
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

export const StyledImageCropModalContent = styled.div`
  background-color: ${({ theme }) => theme.backgroundSecondary};
  padding: 24px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px; /* Um pouco maior para o crop */
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  position: relative;
  max-height: 90vh;
  overflow-y: auto; /* Para permitir scroll se a imagem for muito grande */
`;

export const StyledImageCropModalCloseButton = styled.button`
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

// Estilos para o input de arquivo personalizado
export const HiddenFileInput = styled.input`
    display: none;
`;

export const CustomFileUploadButton = styled.button`
    background-color: ${({ theme }) => theme.backgroundPrimary};
    color: ${({ theme }) => theme.textNormal};
    border: 1px solid ${({ theme }) => theme.backgroundTertiary};
    padding: 10px 15px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    
    &:hover {
        background-color: ${({ theme }) => theme.backgroundModifierHover};
    }

    /* Estilo para um preview de imagem pequena ao lado do botão */
    img {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      object-fit: cover;
      margin-left: 8px;
    }
`;

export const PreviewImage = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
  margin-top: 10px;
  border: 1px solid ${({ theme }) => theme.backgroundTertiary};
`;
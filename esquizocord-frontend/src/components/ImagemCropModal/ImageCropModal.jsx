// src/components/ImageCropModal/ImageCropModal.jsx
import React, { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import { Title } from '../../pages/Settings/styles'; // Reutiliza o Title
import { SubmitButton } from '../CreateGroupModal/styles'; // Reutiliza o SubmitButton

import { 
    StyledImageCropModalOverlay, StyledImageCropModalContent, StyledImageCropModalCloseButton
} from './styles';

export function getCroppedImg(image, crop, fileName) {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
    );

    return new Promise((resolve) => {
        canvas.toBlob(blob => {
            if (!blob) {
                console.error('Canvas is empty');
                return;
            }
            blob.name = fileName;
            resolve(blob);
        }, 'image/png');
    });
}

const ImageCropModal = ({ isOpen, onClose, imageSrc, onCropComplete, aspect = 1 }) => {
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const imgRef = useRef(null);

    // Quando a imagem é carregada no componente de recorte
    const onImageLoad = (e) => {
        const { width, height } = e.currentTarget;
        const newCrop = centerCrop(
            makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
            width,
            height
        );
        setCrop(newCrop);
    };

    const handleSaveCrop = async () => {
        if (completedCrop?.width && completedCrop?.height && imgRef.current) {
            const croppedImageBlob = await getCroppedImg(
                imgRef.current,
                completedCrop,
                'croppedImage.png'
            );
            onCropComplete(croppedImageBlob);
            onClose(); // Fecha o modal após o recorte
            setCrop(undefined); // Reseta o crop para a próxima vez
            setCompletedCrop(null);
        }
    };

    return (
        <StyledImageCropModalOverlay $isOpen={isOpen} onClick={onClose}>
            <StyledImageCropModalContent onClick={(e) => e.stopPropagation()}>
                <StyledImageCropModalCloseButton onClick={onClose}>&times;</StyledImageCropModalCloseButton>
                <Title as="h3" style={{ fontSize: '20px', textAlign: 'center', marginBottom: '20px' }}>Recortar Imagem</Title>
                
                {imageSrc && (
                    <ReactCrop
                        crop={crop}
                        onChange={c => setCrop(c)}
                        onComplete={c => setCompletedCrop(c)}
                        aspect={aspect}
                    >
                        <img ref={imgRef} src={imageSrc} onLoad={onImageLoad} alt="Recorte" style={{ maxHeight: '70vh', maxWidth: '100%' }}/>
                    </ReactCrop>
                )}
                <SubmitButton onClick={handleSaveCrop} style={{ marginTop: '20px' }} disabled={!completedCrop}>
                    Salvar Recorte
                </SubmitButton>
            </StyledImageCropModalContent>
        </StyledImageCropModalOverlay>
    );
};

export default ImageCropModal;
import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Check, X, Crop } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';

interface AvatarCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob, previewUrl: string) => void;
}

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Reset zoom & pan when a new image is loaded
  useEffect(() => {
    if (imageSrc) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        imgRef.current = img;
        drawCropPreview();
      };
    }
  }, [imageSrc]);

  useEffect(() => {
    drawCropPreview();
  }, [zoom, offset]);

  const drawCropPreview = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 260; // Preview Canvas Square Size
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);

    // Draw background image scaled by zoom and offset
    const aspect = img.width / img.height;
    let drawW = size * zoom;
    let drawH = (size / aspect) * zoom;

    if (aspect < 1) {
      drawH = size * zoom;
      drawW = size * aspect * zoom;
    }

    const drawX = (size - drawW) / 2 + offset.x;
    const drawY = (size - drawH) / 2 + offset.y;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    // Draw Grid Overlays (Rule of Thirds)
    ctx.strokeStyle = 'rgba(255, 251, 237, 0.4)';
    ctx.lineWidth = 1;

    // Vertical grid lines
    ctx.beginPath();
    ctx.moveTo(size / 3, 0);
    ctx.lineTo(size / 3, size);
    ctx.moveTo((size / 3) * 2, 0);
    ctx.lineTo((size / 3) * 2, size);
    // Horizontal grid lines
    ctx.moveTo(0, size / 3);
    ctx.lineTo(size, size/ 3);
    ctx.moveTo(0, (size / 3) * 2);
    ctx.lineTo(size, (size / 3) * 2);
    ctx.stroke();

    // Circular profile guide outline
    ctx.strokeStyle = '#FFFBED';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
    ctx.stroke();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleConfirmCrop = () => {
    const img = imgRef.current;
    if (!img) return;

    // Create export canvas forced at 200x200px
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 200;
    exportCanvas.height = 200;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    const scale = 200 / 260;
    const aspect = img.width / img.height;
    let drawW = 260 * zoom * scale;
    let drawH = (260 / aspect) * zoom * scale;

    if (aspect < 1) {
      drawH = 260 * zoom * scale;
      drawW = 260 * aspect * zoom * scale;
    }

    const drawX = (200 - drawW) / 2 + offset.x * scale;
    const drawY = (200 - drawH) / 2 + offset.y * scale;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    exportCanvas.toBlob(
      (blob) => {
        if (blob) {
          const previewUrl = URL.createObjectURL(blob);
          onCropComplete(blob, previewUrl);
          onClose();
        }
      },
      'image/webp',
      0.8
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#FFFBED] border border-[#400404]/20 text-[#400404] max-w-sm rounded-2xl p-6 shadow-xl select-none">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-[#400404] tracking-tight flex items-center gap-2">
            <Crop className="w-4 h-4 text-[#400404]" />
            <span>Ajuste de Foto de Perfil (1:1)</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#5C1212]/80 font-normal">
            Arraste a imagem para enquadrar o rosto e use o zoom. O resultado será cortado em 1:1.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center space-y-4 py-2">
          {/* Canvas Crop Area */}
          <div className="relative rounded-2xl overflow-hidden shadow-md border-2 border-[#400404] bg-[#400404] cursor-grab active:cursor-grabbing">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="block"
            />
          </div>

          {/* Zoom Slider Controls */}
          <div className="flex items-center gap-3 w-full px-2">
            <ZoomOut className="w-4 h-4 text-[#400404]/70 shrink-0" />
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-[#400404] cursor-pointer"
            />
            <ZoomIn className="w-4 h-4 text-[#400404]/70 shrink-0" />
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs font-medium border-[#400404]/20 rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirmCrop}
            className="bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] font-medium text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Aplicar Recorte</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

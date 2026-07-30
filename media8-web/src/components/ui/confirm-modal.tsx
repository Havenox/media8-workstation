import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './dialog';
import { Button } from './button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'archive' | 'danger' | 'restore';
  countdownSeconds?: number;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  countdownSeconds = 0,
  isLoading = false,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(countdownSeconds);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(countdownSeconds);
      return;
    }

    setTimeLeft(countdownSeconds);
    if (countdownSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, countdownSeconds]);

  const isButtonDisabled = isLoading || timeLeft > 0;

  const getPrimaryButtonClass = () => {
    if (variant === 'danger' || variant === 'archive') {
      return 'bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-xs';
    }
    return 'bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] shadow-xs';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-[440px] bg-[#FFFBED] border border-[#400404]/20 text-[#400404] shadow-2xl rounded-2xl p-6">
        <DialogHeader className="gap-1.5 text-left">
          <DialogTitle className="text-base font-bold text-[#400404] tracking-tight">
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#400404]/80 leading-relaxed font-normal pt-0.5">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-3 pt-5 flex flex-row items-center justify-center">
          <Button
            type="button"
            onClick={async () => {
              if (isButtonDisabled) return;
              await onConfirm();
            }}
            disabled={isButtonDisabled}
            className={`${getPrimaryButtonClass()} font-medium rounded-xl px-5 py-2 text-xs transition-all min-w-[130px] border-none cursor-pointer`}
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processando...
              </span>
            ) : timeLeft > 0 ? (
              `Iniciar Exclusão (${timeLeft}s)`
            ) : (
              confirmText
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="border border-[#400404]/30 bg-transparent text-[#400404] hover:bg-[#400404]/5 font-medium rounded-xl px-5 py-2 text-xs cursor-pointer"
          >
            {cancelText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

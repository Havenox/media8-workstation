import React, { useState, useEffect } from 'react';
import { AlertTriangle, Archive, Trash2, RotateCcw, ShieldAlert, Loader2 } from 'lucide-react';
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

  const renderIcon = () => {
    switch (variant) {
      case 'danger':
        return <ShieldAlert className="w-8 h-8 text-red-500 animate-pulse" />;
      case 'archive':
        return <Archive className="w-8 h-8 text-amber-500" />;
      case 'restore':
        return <RotateCcw className="w-8 h-8 text-emerald-500" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-[#FFFBED]" />;
    }
  };

  const getButtonClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white border-red-500 shadow-lg shadow-red-900/30';
      case 'archive':
        return 'bg-amber-600 hover:bg-amber-700 text-white border-amber-500 shadow-lg shadow-amber-900/30';
      case 'restore':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-lg shadow-emerald-900/30';
      default:
        return 'bg-[#400404] hover:bg-[#580606] text-[#FFFBED] border-[#580606]';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-[480px] bg-[#1a0808] border-[#400404] text-[#FFFBED] shadow-2xl backdrop-blur-xl">
        <DialogHeader className="gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#2a0c0c] border border-[#400404] flex items-center justify-center">
              {renderIcon()}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-[#FFFBED]">
                {title}
              </DialogTitle>
              {variant === 'danger' && (
                <span className="inline-block mt-1 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-red-400 bg-red-950/60 border border-red-800/60 rounded-md">
                  ⚠️ Ação Irreversível
                </span>
              )}
            </div>
          </div>
          <DialogDescription className="text-sm text-[#FFFBED]/70 leading-relaxed pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-[#300505]">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="border-[#400404] text-[#FFFBED]/80 hover:bg-[#2a0c0c] hover:text-[#FFFBED]"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={async () => {
              if (isButtonDisabled) return;
              await onConfirm();
            }}
            disabled={isButtonDisabled}
            className={`${getButtonClass()} transition-all duration-200 min-w-[140px]`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Processando...
              </span>
            ) : timeLeft > 0 ? (
              `Aguarde (${timeLeft}s)...`
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

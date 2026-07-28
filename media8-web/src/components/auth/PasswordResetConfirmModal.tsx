import React, { useState, useEffect } from 'react';
import { ShieldAlert, Key, Check, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';

interface PasswordResetConfirmModalProps {
  isOpen: boolean;
  userName: string;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export const PasswordResetConfirmModal: React.FC<PasswordResetConfirmModalProps> = ({
  isOpen,
  userName,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  const [countdown, setCountdown] = useState<number>(3);

  // Reset 3-second countdown when modal opens
  useEffect(() => {
    if (isOpen) {
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#FFFBED] border border-[#400404]/20 text-[#400404] max-w-md rounded-2xl p-6 shadow-xl select-none">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 text-amber-950 flex items-center justify-center mb-2">
            <ShieldAlert className="w-6 h-6 text-amber-800" />
          </div>
          <DialogTitle className="text-lg font-semibold text-[#400404] tracking-tight">
            Confirmação de Redefinição Forçada de Senha
          </DialogTitle>
          <DialogDescription className="text-xs text-[#5C1212]/80 font-normal">
            Verificação de segurança em 2 passos para alteração administrativa de credenciais.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2 text-xs text-amber-950 font-normal">
          <p className="font-semibold text-amber-950 flex items-center gap-1.5">
            <Key className="w-4 h-4 text-amber-800 shrink-0" />
            <span>Atenção: Redefinição de Acesso</span>
          </p>
          <p>
            Você está prestes a redefinir a senha do usuário <strong className="font-semibold">{userName}</strong>.
            Esta ação invalidará imediatamente a senha anterior do usuário.
          </p>
        </div>

        <DialogFooter className="pt-3 flex items-center justify-between sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs font-medium border-[#400404]/20 rounded-xl"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={onConfirm}
            disabled={countdown > 0 || isSubmitting}
            className={`text-xs font-medium py-2 px-4 rounded-xl cursor-pointer transition-all flex items-center gap-2 ${
              countdown > 0 || isSubmitting
                ? 'bg-gray-300 text-gray-600 border border-gray-300 cursor-not-allowed'
                : 'bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] shadow-xs'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processando...</span>
              </>
            ) : countdown > 0 ? (
              <span>Aguarde ({countdown}s)</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Confirmar Redefinição</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

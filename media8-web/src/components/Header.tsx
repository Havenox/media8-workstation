import React from 'react';
import { Shield, PlusCircle, LogOut, User as UserIcon } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import type { AuthResponse } from '../types';

interface HeaderProps {
  currentUser: AuthResponse | null;
  onOpenIngestModal: () => void;
  onLogout: () => void;
  selectedOrderTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenIngestModal,
  onLogout,
  selectedOrderTitle,
}) => {
  return (
    <header className="glass-panel border-b border-wine-vibrant/30 px-6 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-xl backdrop-blur-xl">
      {/* Brand Logo & Order Breadcrumb */}
      <div className="flex items-center gap-6">
        <BrandLogo size="md" />

        {selectedOrderTitle && (
          <div className="hidden md:flex items-center gap-2 pl-6 border-l border-wine-vibrant/30">
            <span className="text-[11px] text-cream-soft/50 font-mono uppercase tracking-wider">Order Ativa:</span>
            <span className="text-xs font-semibold text-cream-soft bg-wine-deep/60 border border-wine-vibrant/40 px-3 py-1 rounded-lg">
              {selectedOrderTitle}
            </span>
          </div>
        )}
      </div>

      {/* Action Bar & User Profile */}
      <div className="flex items-center gap-4">
        {currentUser && (
          <div className="flex items-center gap-3 bg-[#0C0101] px-3.5 py-1.5 rounded-xl border border-wine-vibrant/40 text-xs text-cream-soft/90 shadow-inner">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-wine-deep to-wine-vibrant flex items-center justify-center border border-wine-vibrant/50 shadow-sm">
                <UserIcon className="w-3.5 h-3.5 text-cream-soft" />
              </div>
              <span className="font-semibold text-cream-soft tracking-wide">{currentUser.Name}</span>
            </div>
            <span className="text-wine-vibrant/60">|</span>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-wine-vibrant" />
              <span className="text-cream-soft/70">
                Perfil: <strong className="text-cream-soft font-mono uppercase text-[11px]">{currentUser.Role}</strong>
              </span>
            </div>
          </div>
        )}

        <button
          onClick={onOpenIngestModal}
          className="flex items-center gap-2 bg-gradient-to-r from-wine-deep via-wine-warm to-wine-vibrant hover:from-wine-warm hover:to-wine-vibrant text-cream-soft font-semibold text-xs px-4 py-2 rounded-xl shadow-lg border border-wine-vibrant/50 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-cream-soft" />
          <span>Ingest Mídia (Link External)</span>
        </button>

        <button
          onClick={onLogout}
          title="Encerrar Sessão"
          className="flex items-center gap-1.5 bg-red-950/50 hover:bg-red-900/80 text-red-200 font-semibold text-xs px-3.5 py-2 rounded-xl border border-red-800/50 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sair</span>
        </button>
      </div>
    </header>
  );
};

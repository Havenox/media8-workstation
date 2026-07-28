import React from 'react';
import { Film, Shield, PlusCircle, LogOut, User as UserIcon } from 'lucide-react';
import type { AuthResponse } from '../types';

interface HeaderProps {
  currentUser: AuthResponse | null;
  onOpenIngestModal: () => void;
  onLogout: () => void;
  selectedOrderTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onOpenIngestModal, onLogout, selectedOrderTitle }) => {
  return (
    <header className="glass-panel border-b border-wine-vibrant/30 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-wine-deep to-wine-vibrant flex items-center justify-center shadow-lg border border-wine-vibrant/40">
          <Film className="w-5 h-5 text-cream-soft" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-lg text-cream-soft tracking-wide">Media 8</h1>
            <span className="text-xs bg-wine-warm/60 border border-wine-vibrant/50 text-cream-soft px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
              Workstation PAM
            </span>
          </div>
          <p className="text-xs text-cream-soft/60">
            {selectedOrderTitle ? `Order: ${selectedOrderTitle}` : 'Production Asset Management'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {currentUser && (
          <div className="flex items-center gap-3 bg-dark-surface px-3.5 py-1.5 rounded-lg border border-dark-border text-xs text-cream-soft/80">
            <div className="flex items-center gap-1.5">
              <UserIcon className="w-4 h-4 text-wine-vibrant" />
              <span className="font-semibold text-cream-soft">{currentUser.Name}</span>
            </div>
            <span className="text-dark-border">|</span>
            <div className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-wine-vibrant" />
              <span className="text-cream-soft/70">Role: <strong className="text-cream-soft">{currentUser.Role}</strong></span>
            </div>
          </div>
        )}

        <button
          onClick={onOpenIngestModal}
          className="flex items-center gap-2 bg-gradient-to-r from-wine-deep to-wine-vibrant hover:from-wine-warm hover:to-wine-vibrant text-cream-soft font-semibold text-xs px-4 py-2 rounded-lg shadow-md border border-wine-vibrant/50 transition-all duration-200 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Ingest Mídia (Link External)</span>
        </button>

        <button
          onClick={onLogout}
          title="Encerrar Sessão"
          className="flex items-center gap-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-200 font-semibold text-xs px-3 py-2 rounded-lg border border-red-800/60 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair</span>
        </button>
      </div>
    </header>
  );
};

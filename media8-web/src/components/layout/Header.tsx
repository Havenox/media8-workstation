import React from 'react';
import { LogOut, User as UserIcon, Shield } from 'lucide-react';
import type { User } from '../../types';
import { Button } from '../ui/button';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onLogout }) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FFFBED]/95 backdrop-blur-sm border-b border-[#400404]/15 px-6 py-3.5 flex items-center justify-between shadow-sm">
      <div>
        <p className="text-[11px] uppercase font-mono tracking-wider text-[#5C1212]/60">
          Painel da Produtora
        </p>
        <h1 className="text-lg font-bold text-[#400404]">Media 8 | Workstation</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* User Profile Pill */}
        <div className="flex items-center gap-3 bg-white px-3.5 py-1.5 rounded-lg border border-[#400404]/15 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-[#400404] text-[#FFFBED] font-bold text-xs flex items-center justify-center">
            {currentUser.Name ? currentUser.Name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold text-[#400404] leading-tight">{currentUser.Name}</p>
            <p className="text-[10px] text-[#5C1212]/70 font-mono">
              {currentUser.Role === 'Admin' ? '👑 Admin' : '🎬 Editor'}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <Button
          onClick={onLogout}
          variant="outline"
          size="sm"
          className="border-[#400404]/20 hover:bg-[#400404] hover:text-[#FFFBED] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </header>
  );
};

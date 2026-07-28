import React from 'react';
import { LogOut, Crown, Video } from 'lucide-react';
import type { User } from '../../types';
import { Button } from '../ui/button';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onLogout }) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FFFBED]/95 backdrop-blur-sm border-b border-[#400404]/15 px-6 py-3 flex items-center justify-between shadow-xs">
      <div>
        <p className="text-[10px] uppercase font-mono font-semibold tracking-wider text-[#5C1212]/80">
          Painel da Produtora
        </p>
        <h1 className="text-base font-semibold text-[#400404] tracking-tight">Media 8 | Workstation</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* User Profile Pill */}
        <div className="flex items-center gap-2.5 bg-white px-3 py-1.5 rounded-xl border border-[#400404]/15 shadow-xs">
          <div className="w-7 h-7 rounded-lg bg-[#400404] text-[#FFFBED] font-semibold text-xs flex items-center justify-center overflow-hidden border border-[#400404]/20 shadow-xs">
            {currentUser.AvatarUrl ? (
              <img src={currentUser.AvatarUrl} alt={currentUser.Name} className="w-full h-full object-cover" />
            ) : (
              currentUser.Name ? currentUser.Name.charAt(0).toUpperCase() : 'U'
            )}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-[#400404] leading-tight">{currentUser.Name}</p>
            <div className="text-[11px] text-[#5C1212]/90 font-medium flex items-center gap-1 mt-0.5">
              {currentUser.Role === 'Admin' ? (
                <span className="inline-flex items-center gap-1 text-[#400404]">
                  <Crown className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>Admin</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[#400404]">
                  <Video className="w-3 h-3 text-[#400404]/70 shrink-0" />
                  <span>Editor</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <Button
          onClick={onLogout}
          variant="outline"
          size="sm"
          className="border-[#400404]/20 hover:bg-[#400404] hover:text-[#FFFBED] text-xs font-medium flex items-center gap-1.5 rounded-xl transition-colors cursor-pointer text-[#400404] py-1.5 px-3"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </header>
  );
};

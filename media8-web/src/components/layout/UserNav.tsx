import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  CreditCard,
  Settings,
  LogOut,
  HelpCircle,
  Crown,
  Video,
} from 'lucide-react';

import type { User } from '../../types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { AuthService } from '../../services/api';

interface UserNavProps {
  currentUser: User;
  onLogout: () => void;
  className?: string;
}

export const UserNav: React.FC<UserNavProps> = ({ currentUser, onLogout, className }) => {
  const navigate = useNavigate();
  const [imgFailed, setImgFailed] = React.useState(false);

  if (!currentUser) return null;

  const avatarSrc = !imgFailed && currentUser.AvatarUrl ? AuthService.getProtectedMediaUrl(currentUser.AvatarUrl) : undefined;

  const initials = currentUser.Name
    ? currentUser.Name.split(' ')
        .filter(Boolean)
        .map((n) => n.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#400404]/30 cursor-pointer ${className || ''}`}
          aria-label="Menu do usuário"
        >
          <div className="w-9 h-9 rounded-full bg-[#400404] text-[#FFFBED] font-semibold text-sm flex items-center justify-center overflow-hidden ring-2 ring-[#400404]/20 hover:ring-[#400404]/40 transition-all shadow-xs shrink-0 cursor-pointer">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={currentUser.Name}
                className="w-full h-full object-cover"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-64 bg-[#FFFBED] border border-[#400404]/25 text-[#400404] shadow-xl rounded-2xl p-1"
        align="end"
        sideOffset={8}
      >
        {/* User Info Header */}
        <DropdownMenuLabel className="font-normal p-3 bg-[#400404]/5 rounded-xl border border-[#400404]/10 mb-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#400404] text-[#FFFBED] font-semibold text-sm flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={currentUser.Name}
                  className="w-full h-full object-cover"
                  onError={() => setImgFailed(true)}
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            <div className="flex flex-col space-y-0.5 overflow-hidden">
              <p className="text-xs font-semibold text-[#400404] truncate">
                {currentUser.Name}
              </p>
              <p className="text-[11px] text-[#5C1212]/80 truncate font-mono">
                {currentUser.Email}
              </p>
              <div className="flex items-center gap-1 pt-0.5">
                {currentUser.Role === 'Admin' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-900 bg-amber-500/15 border border-amber-500/25 px-1.5 py-0.2 rounded-full">
                    <Crown className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                    <span>Admin</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#400404] bg-[#400404]/10 border border-[#400404]/15 px-1.5 py-0.2 rounded-full">
                    <Video className="w-2.5 h-2.5 text-[#400404]/70 shrink-0" />
                    <span>Editor</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-[#400404]/15 my-1" />

        {/* Navigation Group */}
        <DropdownMenuGroup className="space-y-0.5">
          <DropdownMenuItem
            onClick={() => navigate('/settings')}
            className="cursor-pointer text-xs font-medium text-[#400404] hover:bg-[#400404]/10 rounded-lg p-2 transition-colors flex items-center gap-2.5"
          >
            <UserIcon className="w-4 h-4 text-[#400404]/80 shrink-0" />
            <span>Meu Perfil</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate('/settings')}
            className="cursor-pointer text-xs font-medium text-[#400404] hover:bg-[#400404]/10 rounded-lg p-2 transition-colors flex items-center gap-2.5"
          >
            <CreditCard className="w-4 h-4 text-[#400404]/80 shrink-0" />
            <span>Minha Assinatura</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate('/settings')}
            className="cursor-pointer text-xs font-medium text-[#400404] hover:bg-[#400404]/10 rounded-lg p-2 transition-colors flex items-center gap-2.5"
          >
            <Settings className="w-4 h-4 text-[#400404]/80 shrink-0" />
            <span>Configurações</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-[#400404]/15 my-1" />

        {/* Help */}
        <DropdownMenuItem
          onClick={() => window.open('https://media8.com.br', '_blank')}
          className="cursor-pointer text-xs font-medium text-[#400404] hover:bg-[#400404]/10 rounded-lg p-2 transition-colors flex items-center gap-2.5"
        >
          <HelpCircle className="w-4 h-4 text-[#400404]/80 shrink-0" />
          <span>Ajuda & Suporte</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-[#400404]/15 my-1" />

        {/* Logout */}
        <DropdownMenuItem
          onClick={onLogout}
          className="cursor-pointer text-xs font-semibold text-red-700 hover:bg-red-500/15 hover:text-red-900 rounded-lg p-2 transition-colors flex items-center gap-2.5"
        >
          <LogOut className="w-4 h-4 text-red-700 shrink-0" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserNav;

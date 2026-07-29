import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FolderKanban, Users, Bell, Settings, LayoutDashboard, Video } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import type { User } from '../../types';

interface GlobalSearchProps {
  currentUser: User;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ currentUser }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const isAdmin = currentUser.Role === 'Admin';

  // Keyboard shortcut to open search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-between w-48 sm:w-64 px-3 py-1.5 bg-white border border-[#400404]/20 hover:border-[#400404] rounded-xl text-xs text-[#5C1212]/70 transition-all shadow-xs cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-[#400404]/70 shrink-0" />
          <span className="font-normal text-[#400404]/70">Buscar...</span>
        </span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-[#400404] bg-[#400404]/5 border border-[#400404]/15 rounded-md">
          <span>⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="bg-[#FFFBED] text-[#400404] border border-[#400404]/20 rounded-2xl overflow-hidden shadow-2xl">
          <CommandInput
            placeholder="Buscar páginas, projetos, esteiras..."
            className="border-b border-[#400404]/15 text-xs text-[#400404] placeholder:text-[#5C1212]/50"
          />
          <CommandList className="p-2 max-h-80 overflow-y-auto">
            <CommandEmpty className="p-4 text-center text-xs text-[#5C1212]/60">
              Nenhum resultado encontrado.
            </CommandEmpty>

            {/* Quick Navigation */}
            <CommandGroup heading="Navegação Rápida" className="text-[10px] uppercase font-mono font-semibold text-[#5C1212]/70 px-2 py-1">
              <CommandItem
                onSelect={() => handleSelect('/')}
                className="cursor-pointer text-xs font-medium text-[#400404] hover:bg-[#400404]/10 rounded-lg p-2 flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4 text-[#400404] shrink-0" />
                <span>Dashboard</span>
              </CommandItem>

              <CommandItem
                onSelect={() => handleSelect('/projects')}
                className="cursor-pointer text-xs font-medium text-[#400404] hover:bg-[#400404]/10 rounded-lg p-2 flex items-center gap-2"
              >
                <FolderKanban className="w-4 h-4 text-[#400404] shrink-0" />
                <span>Projetos</span>
              </CommandItem>

              <CommandItem
                onSelect={() => handleSelect('/workstation')}
                className="cursor-pointer text-xs font-medium text-[#400404] hover:bg-[#400404]/10 rounded-lg p-2 flex items-center gap-2"
              >
                <Video className="w-4 h-4 text-[#400404] shrink-0" />
                <span>Workstation PAM</span>
              </CommandItem>

              <CommandItem
                onSelect={() => handleSelect('/jobs')}
                className="cursor-pointer text-xs font-medium text-[#400404] hover:bg-[#400404]/10 rounded-lg p-2 flex items-center gap-2"
              >
                <Search className="w-4 h-4 text-[#400404] shrink-0" />
                <span>Esteira de Ingestão</span>
              </CommandItem>

              {isAdmin && (
                <CommandItem
                  onSelect={() => handleSelect('/users')}
                  className="cursor-pointer text-xs font-medium text-[#400404] hover:bg-[#400404]/10 rounded-lg p-2 flex items-center gap-2"
                >
                  <Users className="w-4 h-4 text-[#400404] shrink-0" />
                  <span>Usuários</span>
                </CommandItem>
              )}

              <CommandItem
                onSelect={() => handleSelect('/notifications')}
                className="cursor-pointer text-xs font-medium text-[#400404] hover:bg-[#400404]/10 rounded-lg p-2 flex items-center gap-2"
              >
                <Bell className="w-4 h-4 text-[#400404] shrink-0" />
                <span>Notificações</span>
              </CommandItem>

              <CommandItem
                onSelect={() => handleSelect('/settings')}
                className="cursor-pointer text-xs font-medium text-[#400404] hover:bg-[#400404]/10 rounded-lg p-2 flex items-center gap-2"
              >
                <Settings className="w-4 h-4 text-[#400404] shrink-0" />
                <span>Configurações</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </div>
      </CommandDialog>
    </>
  );
};

export default GlobalSearch;

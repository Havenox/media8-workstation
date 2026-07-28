import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileVideo, User, Bell, Settings, CreditCard } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

// Mock data - would come from API in real implementation
const mockOrders = [
  { id: '1234', title: 'Vídeo Institucional - Empresa ABC', status: 'Em Edição' },
  { id: '1235', title: 'Reels Instagram - Campanha Verão', status: 'Aguardando Aprovação' },
  { id: '1236', title: 'YouTube Shorts - Tutorial Produto', status: 'Concluído' },
  { id: '1237', title: 'TikTok - Trend Dance Challenge', status: 'Em Edição' },
  { id: '1238', title: 'Vídeo Corporativo - Relatório Anual', status: 'Aguardando Briefing' },
];

const mockUsers = [
  { id: '1', name: 'João Silva', email: 'joao@email.com', role: 'Cliente' },
  { id: '2', name: 'Maria Santos', email: 'maria@email.com', role: 'Editor' },
  { id: '3', name: 'Carlos Oliveira', email: 'carlos@email.com', role: 'Admin' },
];

const GlobalSearch: React.FC = () => {
const [open, setOpen] = useState(false);
const navigate = useNavigate();
const { user } = useAuth();

// PascalCase: user.Role
const isStaff = user?.Role === 'Admin' || user?.Role === 'Editor';

  // Keyboard shortcut to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
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
      <Button
        variant="outline"
        className="relative h-9 w-64 justify-start text-sm text-muted-foreground bg-muted/50 border-0 hover:bg-muted"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span>Buscar...</span>
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar pedidos, usuários, páginas..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

          {/* Quick Navigation */}
          <CommandGroup heading="Navegação Rápida">
            <CommandItem onSelect={() => handleSelect('/dashboard')}>
              <Search className="mr-2 h-4 w-4" />
              Dashboard
            </CommandItem>
            <CommandItem onSelect={() => handleSelect('/orders')}>
              <FileVideo className="mr-2 h-4 w-4" />
              Pedidos
            </CommandItem>
            <CommandItem onSelect={() => handleSelect('/orders/new')}>
              <FileVideo className="mr-2 h-4 w-4" />
              Novo Pedido
            </CommandItem>
            <CommandItem onSelect={() => handleSelect('/notifications')}>
              <Bell className="mr-2 h-4 w-4" />
              Notificações
            </CommandItem>
            <CommandItem onSelect={() => handleSelect('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </CommandItem>
            {isStaff && (
              <>
                <CommandItem onSelect={() => handleSelect('/users')}>
                  <User className="mr-2 h-4 w-4" />
                  Usuários
                </CommandItem>
                <CommandItem onSelect={() => handleSelect('/credits')}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Créditos
                </CommandItem>
              </>
            )}
          </CommandGroup>

          {/* Orders */}
          <CommandGroup heading="Pedidos Recentes">
            {mockOrders.map((order) => (
              <CommandItem
                key={order.id}
                onSelect={() => handleSelect(`/orders/${order.id}`)}
              >
                <FileVideo className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>{order.title}</span>
                  <span className="text-xs text-muted-foreground">
                    #{order.id} • {order.status}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>

          {/* Users (Admin only) */}
          {isStaff && (
            <CommandGroup heading="Usuários">
              {mockUsers.map((u) => (
                <CommandItem
                  key={u.id}
                  onSelect={() => handleSelect(`/users`)}
                >
                  <User className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{u.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {u.email} • {u.role}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default GlobalSearch;

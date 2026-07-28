import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ExternalLink, HelpCircle, Scissors, Package, ShoppingBag, FileText } from 'lucide-react';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  CreditCard,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import UserNav from './UserNav';
import { BrandLogo } from '../BrandLogo';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  roles?: string[];
  external?: boolean;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: FolderKanban, label: 'Pedidos', path: '/orders', roles: ['Admin', 'Client'] },
  { icon: ShoppingBag, label: 'Serviços', path: '/services', roles: ['Admin', 'Client'] },
  { icon: Scissors, label: 'Edições', path: '/edits', roles: ['Admin', 'Editor'] },
  { icon: Users, label: 'Usuários', path: '/users', roles: ['Admin'] },
  { icon: Package, label: 'Ofertas', path: '/admin/offers', roles: ['Admin'] },
  { icon: CreditCard, label: 'Pagamentos', path: '/admin/payments', roles: ['Admin'] },
  { icon: FileText, label: 'Contratos', path: '/contracts', roles: ['Admin', 'Client'] },
  { icon: Settings, label: 'Configurações', path: '/settings' },
  { icon: ExternalLink, label: 'Contratar Mais', path: '/', external: true, roles: ['Client'] },
];

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ open, onOpenChange }) => {
  const location = useLocation();
  const { user } = useAuth();

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || (user?.Role && item.roles.includes(user.Role))
  );

  const handleNavClick = () => {
    onOpenChange(false);
  };

  return (
    <>
      {/* Mobile TopBar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar h-14 flex items-center justify-between px-4 shadow-lg">
        {/* Left - Hamburger Menu */}
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>

          <SheetContent
            side="left"
            className="w-72 bg-sidebar border-sidebar-border p-0"
          >
            {/* Sheet Header */}
            <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
              <Link to="/dashboard" onClick={handleNavClick} className="flex items-center gap-3 transition-opacity duration-200 hover:opacity-80">
                <div>
                  <BrandLogo variant="cream" size="sm" href="/dashboard" />
                  <p className="text-xs text-sidebar-foreground/60">Gestão de Edição de Vídeos</p>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {filteredNavItems.map((item) => {
                const isActive = !item.external && location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <Link key={item.path} to={item.path} onClick={handleNavClick}>
                    <Button
                      variant={isActive ? 'sidebar-active' : 'sidebar'}
                      className={cn(
                        'w-full justify-start px-4 h-12',
                        !isActive && 'text-sidebar-foreground/80 hover:text-sidebar-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="ml-3">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </nav>

            {/* Footer - Support */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border bg-sidebar">
              <Link to="/" onClick={handleNavClick}>
                <Button
                  variant="sidebar"
                  className="w-full justify-start px-4 h-12 text-sidebar-foreground/60"
                >
                  <HelpCircle className="h-5 w-5 shrink-0" />
                  <span className="ml-3">Ajuda & Suporte</span>
                </Button>
              </Link>
              <p className="text-xs text-sidebar-foreground/40 text-center mt-3">
                v1.0.0
              </p>
            </div>
          </SheetContent>
        </Sheet>

        {/* Center - Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 transition-opacity duration-200 hover:opacity-80">
          <BrandLogo variant="cream" size="sm" href="/dashboard" />
        </Link>

        {/* Right - User Avatar */}
        <UserNav />
      </header>
    </>
  );
};

export default MobileNav;

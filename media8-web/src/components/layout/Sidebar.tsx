import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Scissors,
  Package,
  ShoppingBag,
  Film,
  Palette,
  CreditCard,
  FileText,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BrandLogo } from '../BrandLogo';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

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
  { icon: Palette, label: 'Ident. Marca', path: '/branding-profiles', roles: ['Admin', 'Client'] },
  { icon: Film, label: 'Estilos Edição', path: '/editing-profiles', roles: ['Admin', 'Client'] },
  { icon: Scissors, label: 'Edições', path: '/edits', roles: ['Admin', 'Editor'] },
  { icon: Users, label: 'Usuários', path: '/users', roles: ['Admin'] },
  { icon: Package, label: 'Ofertas', path: '/admin/offers', roles: ['Admin'] },
  { icon: Film, label: 'Formatos', path: '/admin/video-formats', roles: ['Admin'] },
  { icon: Palette, label: 'Estilos', path: '/admin/editing-styles', roles: ['Admin'] },
  { icon: CreditCard, label: 'Pagamentos', path: '/admin/payments', roles: ['Admin'] },
  { icon: FileText, label: 'Contratos', path: '/contracts', roles: ['Admin', 'Client'] },
  { icon: Settings, label: 'Configurações', path: '/settings' },
  { icon: ExternalLink, label: 'Contratar Mais', path: '/', external: true, roles: ['Client'] },
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const { user } = useAuth();
  
  // FIX: Use user?.Role || (user as any)?.role for backwards compatibility
  const userRole = user?.Role || (user as any)?.role || 'Client';
  
  const filteredNavItems = navItems.filter(
    (item) => !item.roles || (userRole && item.roles.includes(userRole))
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground z-50 flex flex-col shadow-xl"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
        <Link to="/dashboard" className="flex-1 transition-opacity hover:opacity-80">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <div>
                <BrandLogo variant="cream" size="sm" href="/dashboard" />
                <p className="text-xs text-sidebar-foreground/60">Gestão de Edição de Vídeos</p>
              </div>
            </motion.div>
          )}
          {collapsed && (
            <BrandLogo variant="cream" size="sm" />
          )}
        </Link>
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-sidebar-primary text-sidebar-primary-foreground rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = !item.external && location.pathname === item.path;
          const Icon = item.icon;

          if (item.external) {
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="sidebar"
                  className={cn(
                    'w-full text-sidebar-foreground/60 hover:text-sidebar-foreground',
                    collapsed ? 'justify-center px-2' : 'justify-start px-4'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="ml-3">{item.label}</span>}
                </Button>
              </Link>
            );
          }

          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant={isActive ? 'sidebar-active' : 'sidebar'}
                className={cn(
                  'w-full',
                  collapsed ? 'justify-center px-2' : 'justify-start px-4'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="ml-3"
                  >
                    {item.label}
                  </motion.span>
                )}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Footer - Support/Help */}
      <div className="p-4 border-t border-sidebar-border">
        <Link to="/">
          <Button
            variant="sidebar"
            className={cn(
              'w-full text-sidebar-foreground/60 hover:text-sidebar-foreground',
              collapsed ? 'justify-center px-2' : 'justify-start px-4'
            )}
          >
            <HelpCircle className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="ml-3">Ajuda & Suporte</span>}
          </Button>
        </Link>
        
        {!collapsed && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-sidebar-foreground/40 text-center mt-3"
          >
            v1.0.0
          </motion.p>
        )}
      </div>
    </motion.aside>
  );
};

export default Sidebar;

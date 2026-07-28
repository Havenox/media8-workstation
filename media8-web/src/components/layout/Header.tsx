import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

import NotificationsDropdown from './NotificationsDropdown';
import GlobalSearch from './GlobalSearch';
import UserNav from './UserNav';

interface HeaderProps {
  sidebarCollapsed: boolean;
}

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/orders': 'Pedidos',
  '/orders/new': 'Novo Pedido',
  '/users': 'Usuários',
  '/admin/offers': 'Ofertas',
  '/admin/video-formats': 'Formatos',
  '/admin/editing-styles': 'Estilos',
  '/admin/payments': 'Pagamentos',
  '/edits': 'Edições',
  '/settings': 'Configurações',
  '/notifications': 'Notificações',
};

const getRouteTitle = (pathname: string): string => {
  if (routeTitles[pathname]) return routeTitles[pathname];
  if (pathname.startsWith('/orders/') && pathname !== '/orders/new') return 'Detalhes do Pedido';
  return 'Media 8';
};

const Header: React.FC<HeaderProps> = ({ sidebarCollapsed }) => {
  const location = useLocation();

  const pageTitle = getRouteTitle(location.pathname);
  
  // Generate breadcrumbs from path
  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathParts.map((part, index) => {
    const path = '/' + pathParts.slice(0, index + 1).join('/');
    return {
      label: routeTitles[path] || part.charAt(0).toUpperCase() + part.slice(1),
      path,
    };
  });

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border"
    >
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Left side - Breadcrumbs & Title */}
        <div>
          {/* Breadcrumbs - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link to="/dashboard" className="hover:text-foreground transition-colors">
              Home
            </Link>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.path}>
                <ChevronRight className="h-3 w-3" />
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-foreground font-medium">
                    {crumb.label}
                  </span>
                ) : (
                  <Link 
                    to={crumb.path} 
                    className="hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </div>
          
          {/* Page Title - Responsive typography */}
          <h1 className="text-lg md:text-xl font-semibold text-foreground">{pageTitle}</h1>
        </div>

        {/* Right side - Search, Notifications & User Menu */}
        <div className="flex items-center gap-3">
          {/* Global Search */}
          <div className="hidden md:block">
            <GlobalSearch />
          </div>

          {/* Notifications */}
          <NotificationsDropdown />

          {/* User Navigation Dropdown */}
          <UserNav />
        </div>
      </div>
    </motion.header>
  );
};

export default Header;

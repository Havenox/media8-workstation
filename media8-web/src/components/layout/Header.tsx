import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { User } from '../../types';
import { GlobalSearch } from './GlobalSearch';
import { NotificationsDropdown } from './NotificationsDropdown';
import { UserNav } from './UserNav';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onLogout }) => {
  const location = useLocation();

  // Dynamic Route Info Helper
  const getRouteInfo = (pathname: string) => {
    switch (pathname) {
      case '/':
      case '/dashboard':
        return { breadcrumbs: ['Home', 'Dashboard'], title: 'Dashboard & Métricas' };
      case '/projects':
        return { breadcrumbs: ['Home', 'Projetos'], title: 'Projetos de Edição' };
      case '/workstation':
        return { breadcrumbs: ['Home', 'Workstation PAM'], title: 'Estação de Corte & Timecode' };
      case '/jobs':
        return { breadcrumbs: ['Home', 'Esteira de Ingestão'], title: 'Processamento de Mídias' };
      case '/users':
        return { breadcrumbs: ['Home', 'Usuários'], title: 'Gestão de Usuários' };
      case '/settings':
        return { breadcrumbs: ['Home', 'Configurações'], title: 'Configurações do Sistema' };
      case '/notifications':
        return { breadcrumbs: ['Home', 'Notificações'], title: 'Central de Notificações' };
      default:
        if (pathname.startsWith('/projects/')) {
          return { breadcrumbs: ['Home', 'Projetos', 'Visão Geral do Projeto'], title: 'Detalhes & Media Pool do Projeto' };
        }
        if (pathname.startsWith('/workstation/')) {
          return { breadcrumbs: ['Home', 'Workstation PAM'], title: 'Estação de Corte & Timecode' };
        }
        return { breadcrumbs: ['Home', 'Media 8'], title: 'Workstation PAM' };
    }
  };

  const { breadcrumbs, title } = getRouteInfo(location.pathname);

  return (
    <header className="sticky top-0 z-40 bg-[#FFFBED]/95 backdrop-blur-md border-b border-[#400404]/15 h-16 px-4 md:px-6 flex items-center justify-between shadow-xs transition-all">
      {/* Left: Dynamic Breadcrumb & Page Title */}
      <div>
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[11px] text-[#5C1212]/70 font-medium">
          <Link to="/" className="hover:text-[#400404] transition-colors">
            {breadcrumbs[0]}
          </Link>
          <ChevronRight className="w-3 h-3 text-[#400404]/40 shrink-0" />
          {breadcrumbs.length > 2 ? (
            <>
              <Link to="/projects" className="hover:text-[#400404] transition-colors">
                {breadcrumbs[1]}
              </Link>
              <ChevronRight className="w-3 h-3 text-[#400404]/40 shrink-0" />
              <span className="text-[#400404] font-semibold">{breadcrumbs[2]}</span>
            </>
          ) : (
            <span className="text-[#400404] font-semibold">{breadcrumbs[1]}</span>
          )}
        </nav>

        <h1 className="text-lg font-bold text-[#400404] tracking-tight leading-tight mt-0.5">
          {title}
        </h1>
      </div>

      {/* Right: Global Search, Notifications, User Avatar Dropdown */}
      <div className="flex items-center gap-3">
        <GlobalSearch currentUser={currentUser} />

        <div className="h-5 w-px bg-[#400404]/15 hidden sm:block" />

        <NotificationsDropdown />

        <div className="h-5 w-px bg-[#400404]/15 hidden sm:block" />

        <UserNav currentUser={currentUser} onLogout={onLogout} />
      </div>
    </header>
  );
};

export default Header;

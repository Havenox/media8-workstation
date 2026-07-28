import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  Film,
  Activity,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

import { BrandLogo } from '../BrandLogo';
import type { User } from '../../types';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentUser: User;
}

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'projects', icon: FolderKanban, label: 'Projetos' },
  { id: 'workstation', icon: Film, label: 'Workstation PAM' },
  { id: 'jobs', icon: Activity, label: 'Esteira de Ingestão' },
  { id: 'users', icon: Users, label: 'Usuários & Atribuições', roles: ['Admin'] },
  { id: 'settings', icon: Settings, label: 'Configurações & Storage' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggle,
  activeTab,
  onTabChange,
  currentUser,
}) => {
  const userRole = currentUser.Role || 'Editor';

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-[#400404] text-[#FFFBED] z-50 flex flex-col shadow-xl select-none"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-[#5C1212]">
        <div className="flex-1 cursor-pointer" onClick={() => onTabChange('dashboard')}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <div>
                <BrandLogo variant="cream" size="sm" />
                <p className="text-xs text-[#FFFBED] font-bold mt-0.5">Workstation PAM</p>
              </div>
            </motion.div>
          )}
          {collapsed && (
            <BrandLogo variant="cream" size="sm" />
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-[#FFFBED] text-[#400404] rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 py-3 rounded-lg text-sm transition-colors cursor-pointer ${
                collapsed ? 'justify-center px-2' : 'justify-start px-3.5'
              } ${
                isActive
                  ? 'bg-[#FFFBED] text-[#400404] font-bold shadow-md'
                  : 'text-[#FFFBED] font-semibold hover:bg-[#5C1212]'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="truncate"
                >
                  {item.label}
                </motion.span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer - Support */}
      <div className="p-4 border-t border-[#5C1212]">
        <button
          onClick={() => onTabChange('settings')}
          className={`w-full flex items-center gap-3 py-2 text-xs text-[#FFFBED] font-semibold hover:bg-[#5C1212] rounded-lg transition-colors cursor-pointer ${
            collapsed ? 'justify-center px-2' : 'justify-start px-2'
          }`}
        >
          <HelpCircle className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Ajuda & Suporte</span>}
        </button>

        {!collapsed && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-[#FFFBED] text-center mt-2 font-mono font-bold"
          >
            v1.0.0 (Workstation PAM)
          </motion.p>
        )}
      </div>
    </motion.aside>
  );
};

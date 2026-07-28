import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { User } from '../../types';

interface AppLayoutProps {
  currentUser: User;
  onLogout: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ currentUser, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#FFFBED] text-[#400404] flex font-sans select-none">
      {/* Persistent Sidebar Container */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        currentUser={currentUser}
      />

      {/* Main Content Layout Container */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          collapsed ? 'ml-[80px]' : 'ml-[280px]'
        }`}
      >
        {/* Persistent Header Container */}
        <Header currentUser={currentUser} onLogout={onLogout} />

        {/* Dynamic Route Content Body (Re-renders dynamically per route) */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

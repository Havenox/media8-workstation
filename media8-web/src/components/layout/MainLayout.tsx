import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { User } from '../../types';

interface MainLayoutProps {
  currentUser: User;
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentUser,
  onLogout,
  activeTab,
  onTabChange,
  children,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const desktopMarginLeft = sidebarCollapsed ? 80 : 280;

  return (
    <div className="min-h-screen bg-[#FFFBED] text-[#400404]">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeTab={activeTab}
        onTabChange={onTabChange}
        currentUser={currentUser}
      />

      {/* Main Container */}
      <div
        className="transition-all duration-300 ease-in-out flex flex-col min-h-screen"
        style={{ marginLeft: `${desktopMarginLeft}px` }}
      >
        {/* Header */}
        <Header currentUser={currentUser} onLogout={onLogout} />

        {/* Content Body */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

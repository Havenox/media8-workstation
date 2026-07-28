import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { BrandLogo } from '../BrandLogo';

const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isMobile = useIsMobile();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 text-center">
          <BrandLogo variant="wine" size="lg" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Calculate margin for desktop
  const desktopMarginLeft = isMobile ? 0 : (sidebarCollapsed ? 80 : 280);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Navigation */}
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />

      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main Content Area */}
      <div
        className="transition-all duration-300 ease-in-out pt-14 md:pt-0"
        style={{ marginLeft: desktopMarginLeft }}
      >
        {/* Desktop Header - Hidden on mobile */}
        <div className="hidden md:block">
          <Header sidebarCollapsed={sidebarCollapsed} />
        </div>

        {/* Page Content - Responsive padding */}
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="p-4 md:p-6 lg:p-8"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
};

export default MainLayout;

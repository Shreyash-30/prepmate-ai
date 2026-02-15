/**
 * Main Dashboard Layout
 * Layout for authenticated pages with sidebar navigation
 */

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import FloatingMentor from '@/modules/mentor/components/FloatingMentor';
import { cn } from '@/utils/utils';

export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} />
      
      <main className={cn('flex-1 transition-all duration-300', sidebarCollapsed ? 'ml-16' : 'ml-60')}>
        <Outlet />
      </main>

      <FloatingMentor />
    </div>
  );
}

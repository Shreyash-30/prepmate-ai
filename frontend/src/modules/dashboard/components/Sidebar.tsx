/**
 * Navigation Sidebar Component
 * Premium modern navigation for authenticated users
 */

import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Map, Code2, Swords, BarChart3, CalendarDays,
  Bot, Settings, LogOut, ChevronLeft, ChevronRight, Zap
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/utils';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/roadmap', icon: Map, label: 'Roadmap' },
  { to: '/practice', icon: Code2, label: 'Practice Lab' },
  { to: '/mock-interview', icon: Swords, label: 'Mock Interview' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/planning', icon: CalendarDays, label: 'Planning' },
  { to: '/mentor', icon: Bot, label: 'AI Mentor' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

export default function Sidebar({ collapsed = false, onCollapse }: SidebarProps) {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border/50 bg-card transition-all duration-300',
        'dark:border-border/30 dark:bg-gradient-to-b dark:from-card dark:to-card/95',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="relative flex h-16 items-center gap-3 border-b border-border/50 px-4 dark:border-border/30">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-600 shadow-lg">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div>
            <span className="text-sm font-bold text-foreground truncate">
              PrepIntel
            </span>
            <p className="text-xs text-muted-foreground">Interview Prep</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-primary to-primary-600 text-primary-foreground shadow-md'
                  : 'text-foreground hover:bg-secondary/60 dark:text-foreground/90 dark:hover:bg-secondary'
              )}
              title={collapsed ? label : undefined}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-white dark:bg-white rounded-r-full" />
              )}
              <Icon className={cn(
                'h-4 w-4 shrink-0 transition-transform',
                isActive && 'scale-110'
              )} />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="space-y-2 border-t border-border/50 p-3 dark:border-border/30">
        {!collapsed && user && (
          <div className="rounded-lg bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 px-3 py-3 border border-primary-200/50 dark:border-primary-700/30">
            <p className="font-semibold text-foreground text-xs truncate">{user.name}</p>
            <p className="text-muted-foreground text-xs truncate mt-1">{user.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
            'text-foreground hover:bg-destructive/10 dark:hover:bg-destructive/20 hover:text-destructive',
            collapsed && 'justify-center'
          )}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <div className="border-t border-border/50 p-2 dark:border-border/30">
        <button
          onClick={() => onCollapse?.(!collapsed)}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground',
            'hover:bg-secondary/60 dark:hover:bg-secondary transition-colors'
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}

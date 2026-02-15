/**
 * Sidebar Navigation Component
 * Left navigation with collapsible menu
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  GitBranch,
  Play,
  RotateCw,
  Mic2,
  CheckSquare,
  Plug,
  ChevronDown,
} from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { cn } from '@/utils/utils';

interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

const navigationItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
  },
  {
    label: 'Practice',
    href: '/practice',
    icon: Play,
    children: [
      { label: 'Recommended', href: '/practice/recommended' },
      { label: 'By Subject', href: '/practice/subject' },
      { label: 'By Topic', href: '/practice/topic' },
    ],
  },
  {
    label: 'Revision',
    href: '/revision',
    icon: RotateCw,
  },
  {
    label: 'Mock Interview',
    href: '/mock-interview',
    icon: Mic2,
  },
  {
    label: 'Planner',
    href: '/planner',
    icon: CheckSquare,
  },
  {
    label: 'Integrations',
    href: '/settings/integrations',
    icon: Plug,
  },
];

export default function Sidebar({ collapsed = false, onCollapse }: SidebarProps) {
  const location = useLocation();
  const { isDark } = useThemeStore();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((item) => item !== href) : [...prev, href]
    );
  };

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen border-r transition-all duration-300',
        collapsed ? 'w-16' : 'w-60',
        isDark
          ? 'bg-slate-900 border-slate-800'
          : 'bg-white border-slate-200'
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-inherit">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">PrepMate</span>
          </div>
        )}
        <button
          onClick={() => onCollapse?.(!collapsed)}
          className={`p-2 rounded-lg hover:bg-opacity-50 transition ${
            isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
          }`}
        >
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform',
              collapsed && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className={cn('px-3 py-6 space-y-2', collapsed && 'px-2')}>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const expanded = expandedItems.includes(item.href);
          const hasChildren = item.children && item.children.length > 0;

          return (
            <div key={item.href}>
              <div className="flex items-center group">
                <Link
                  to={item.href}
                  className={cn(
                    'flex-1 flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200',
                    active
                      ? isDark
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 text-blue-700'
                      : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
                    collapsed && 'justify-center'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>

                {!collapsed && hasChildren && (
                  <button
                    onClick={() => toggleExpanded(item.href)}
                    className={cn(
                      'p-1 rounded hover:bg-opacity-50 transition',
                      isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                    )}
                  >
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 transition-transform',
                        expanded && 'rotate-180'
                      )}
                    />
                  </button>
                )}
              </div>

              {/* Children */}
              {!collapsed && hasChildren && expanded && (
                <div className="ml-4 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      to={child.href}
                      className={cn(
                        'block px-3 py-2 text-sm rounded-lg transition-colors duration-200',
                        isActive(child.href)
                          ? isDark
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-50 text-blue-700'
                          : isDark
                          ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      )}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

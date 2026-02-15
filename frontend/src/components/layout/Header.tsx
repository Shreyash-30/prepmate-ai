/**
 * Header Component - Top Navigation Bar
 * Includes: Notifications, Theme Toggle, User Avatar Dropdown
 */

import { useState } from 'react';
import { Bell, Moon, Sun, LogOut, User, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';

interface HeaderProps {
  onSidebarToggle?: () => void;
}

export default function Header({ onSidebarToggle }: HeaderProps) {
  const navigate = useNavigate();
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [notificationCount] = useState(0);

  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setShowAvatarMenu(false);
  };

  const handleSettingsClick = () => {
    navigate('/settings');
    setShowAvatarMenu(false);
  };

  return (
    <header className={`sticky top-0 z-40 border-b ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left section */}
        <div className="flex-1">
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            PrepMate AI
          </h1>
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className={`relative p-2 rounded-lg hover:bg-opacity-50 transition-colors ${
            isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
          }`}>
            <Bell className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg hover:bg-opacity-50 transition-colors ${
              isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
            }`}
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-slate-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>

          {/* Avatar Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAvatarMenu(!showAvatarMenu)}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white transition-colors ${
                isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </button>

            {/* Dropdown Menu */}
            {showAvatarMenu && (
              <div
                className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-2 ${
                  isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
                }`}
              >
                <div className={`px-4 py-2 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {user?.name}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {user?.email}
                  </p>
                </div>

                <button
                  onClick={handleProfileClick}
                  className={`w-full px-4 py-2 flex items-center gap-2 hover:bg-opacity-50 transition ${
                    isDark ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </button>

                <button
                  onClick={handleSettingsClick}
                  className={`w-full px-4 py-2 flex items-center gap-2 hover:bg-opacity-50 transition ${
                    isDark ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>

                <div className={`border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                  <button
                    onClick={handleLogout}
                    className={`w-full px-4 py-2 flex items-center gap-2 hover:bg-opacity-50 transition text-red-600 ${
                      isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                    }`}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

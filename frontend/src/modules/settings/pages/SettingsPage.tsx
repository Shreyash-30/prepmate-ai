/**
 * Settings Page - Premium SaaS Design
 * User account and application preferences
 */

import { useAuthStore } from '@/store/authStore';
import { SectionHeader } from '@/components/ui/design-system';
import { Settings, LogOut, Bell, Shield, Palette, User, Lock, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState({
    email: true,
    reminders: true,
    achievements: true,
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const settingsSections = [
    {
      icon: Bell,
      title: 'Notifications',
      items: [
        { label: 'Email Notifications', enabled: notifications.email, key: 'email' },
        { label: 'Study Reminders', enabled: notifications.reminders, key: 'reminders' },
        { label: 'Achievement Updates', enabled: notifications.achievements, key: 'achievements' },
      ],
    },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <SectionHeader
        title="Settings & Preferences"
        subtitle="Manage your account, notifications, and app preferences"
      />

      {/* Profile Section */}
      <div className="rounded-lg border border-border/50 bg-gradient-to-br from-card to-secondary/30 p-6 md:p-8">
        <h3 className="text-lg font-semibold text-foreground mb-6">Profile Information</h3>
        <div className="flex items-center gap-6 mb-6 pb-6 border-b border-border/30">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h4 className="text-xl font-bold text-foreground">{user?.name}</h4>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="mt-2">
              <span className={cn(
                'inline-block px-3 py-1 rounded-full text-xs font-medium',
                user?.onboarded
                  ? 'bg-success-100 dark:bg-success-900/50 text-success dark:text-success-400'
                  : 'bg-warning-100 dark:bg-warning-900/50 text-warning dark:text-warning-400'
              )}>
                {user?.onboarded ? '✓ Profile Complete' : '⏳ Setup Pending'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Member Since</p>
            <p className="font-semibold text-foreground">Jan 2024</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Account Level</p>
            <p className="font-semibold text-foreground">Premium</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
            <p className="font-semibold text-foreground">Today</p>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preferences */}
        <div className="rounded-lg border border-border/50 bg-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Palette className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">App Preferences</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border/30 hover:bg-secondary/30 transition-colors">
              <div>
                <p className="font-medium text-foreground">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Current theme preference</p>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  darkMode ? 'bg-primary' : 'bg-muted'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-border/30 hover:bg-secondary/30 transition-colors">
              <div>
                <p className="font-medium text-foreground">Compact View</p>
                <p className="text-xs text-muted-foreground">Reduce padding and spacing</p>
              </div>
              <button className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-muted'
              )}>
                <span className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1'
                )}/>
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-lg border border-border/50 bg-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
          </div>

          <div className="space-y-4">
            {settingsSections[0]?.items.map((item: any) => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-lg border border-border/30 hover:bg-secondary/30 transition-colors">
                <p className="font-medium text-foreground">{item.label}</p>
                <button
                  onClick={() => setNotifications({ ...notifications, [item.key]: !item.enabled })}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    item.enabled ? 'bg-success' : 'bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      item.enabled ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="rounded-lg border border-border/50 bg-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Security</h3>
        </div>

        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-4 rounded-lg border border-border/30 hover:bg-secondary/30 transition-colors text-left group">
            <div>
              <p className="font-medium text-foreground group-hover:text-primary transition-colors">Change Password</p>
              <p className="text-xs text-muted-foreground">Update your password</p>
            </div>
            <Lock className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>

          <button className="w-full flex items-center justify-between p-4 rounded-lg border border-border/30 hover:bg-secondary/30 transition-colors text-left group">
            <div>
              <p className="font-medium text-foreground group-hover:text-primary transition-colors">Two-Factor Authentication</p>
              <p className="text-xs text-muted-foreground">Enhance account security</p>
            </div>
            <Shield className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-lg border border-destructive/30 dark:border-destructive/40 bg-destructive/5 dark:bg-destructive/10 p-6">
        <h3 className="text-lg font-semibold text-destructive mb-4">Danger Zone</h3>

        <div className="space-y-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 rounded-lg border border-destructive/20 dark:border-destructive/40 hover:bg-destructive/20 transition-colors text-left group"
          >
            <div>
              <p className="font-medium text-foreground group-hover:text-destructive transition-colors">Logout</p>
              <p className="text-xs text-muted-foreground">Sign out from your account</p>
            </div>
            <LogOut className="h-4 w-4 text-destructive" />
          </button>

          <button className="w-full flex items-center justify-between p-4 rounded-lg border border-destructive/20 dark:border-destructive/40 hover:bg-destructive/20 transition-colors text-left group">
            <div>
              <p className="font-medium text-foreground group-hover:text-destructive transition-colors">Delete Account</p>
              <p className="text-xs text-muted-foreground">Permanently delete your account and data</p>
            </div>
            <Trash2 className="h-4 w-4 text-destructive" />
          </button>
        </div>
      </div>
    </div>
  );
}

import { Settings as SettingsIcon, Link, BookOpen, Bell, Monitor } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'integrations', label: 'Integrations', icon: Link },
  { id: 'roadmap', label: 'Roadmap', icon: BookOpen },
  { id: 'workload', label: 'Workload', icon: Monitor },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('integrations');

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-primary" /> Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your preferences and integrations</p>
      </div>

      <div className="flex gap-6">
        {/* Settings Nav */}
        <div className="w-48 shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                activeTab === tab.id ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 max-w-2xl">
          {activeTab === 'integrations' && (
            <div className="space-y-6 animate-fade-in">
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-card-foreground mb-4">Coding Platforms</h3>
                <div className="space-y-4">
                  {['LeetCode', 'Codeforces', 'GeeksForGeeks', 'HackerRank'].map((platform) => (
                    <div key={platform} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{platform}</p>
                        <p className="text-xs text-muted-foreground">Sync your problem-solving activity</p>
                      </div>
                      <input
                        type="text"
                        placeholder="Username"
                        className="w-48 rounded-lg border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roadmap' && (
            <div className="space-y-6 animate-fade-in">
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-card-foreground mb-4">Roadmap Preferences</h3>
                <div className="space-y-3">
                  {['DSA', 'Operating Systems', 'DBMS', 'Computer Networks', 'OOPs'].map((r) => (
                    <label key={r} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted cursor-pointer transition-colors">
                      <input type="checkbox" defaultChecked className="rounded border-input accent-primary" />
                      <span className="text-sm text-card-foreground">{r}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workload' && (
            <div className="space-y-6 animate-fade-in">
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-card-foreground mb-4">Study Preferences</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-2">Target Company</label>
                    <input type="text" placeholder="e.g., Google, Amazon" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-2">Preparation Timeline</label>
                    <select className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                      <option>1 month</option>
                      <option>3 months</option>
                      <option>6 months</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-2">Daily hours available</label>
                    <input type="number" defaultValue={4} min={1} max={12} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-fade-in">
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-card-foreground mb-4">Notification Preferences</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Daily task reminders', desc: 'Get notified about pending tasks' },
                    { label: 'Revision alerts', desc: 'Reminders for spaced repetition' },
                    { label: 'Weak area warnings', desc: 'Alerts when performance drops' },
                    { label: 'Weekly progress report', desc: 'Summary of your week' },
                  ].map((n) => (
                    <label key={n.label} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted cursor-pointer transition-colors">
                      <div>
                        <p className="text-sm text-card-foreground">{n.label}</p>
                        <p className="text-xs text-muted-foreground">{n.desc}</p>
                      </div>
                      <input type="checkbox" defaultChecked className="rounded border-input accent-primary" />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

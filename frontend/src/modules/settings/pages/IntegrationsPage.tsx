/**
 * Integrations Page - Platform connections, sync status, manual syncing
 * Supports: LeetCode, CodeForces, HackerRank, AtCoder, AlgoExpert
 */

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { useThemeStore } from '@/store/themeStore';
import { apiClient } from '@/services/apiClient';
import { RefreshCw, CheckCircle2, AlertCircle, Unlink, Link as LinkIcon, Clock } from 'lucide-react';

interface PlatformConnection {
  id: string;
  platform: string;
  username: string;
  isConnected: boolean;
  lastSync?: string;
  problemsSynced: number;
  icon: string;
  color: string;
}

export default function IntegrationsPage() {
  const { isDark } = useThemeStore();
  const [platforms, setPlatforms] = useState<PlatformConnection[]>([
    {
      id: '1',
      platform: 'LeetCode',
      username: 'alex_dev',
      isConnected: true,
      lastSync: '2 hours ago',
      problemsSynced: 187,
      icon: '📘',
      color: 'from-orange-500 to-red-500',
    },
    {
      id: '2',
      platform: 'CodeForces',
      username: 'coder123',
      isConnected: true,
      lastSync: '5 hours ago',
      problemsSynced: 92,
      icon: '🚀',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: '3',
      platform: 'HackerRank',
      username: 'hacker_pro',
      isConnected: false,
      problemsSynced: 0,
      icon: '🏆',
      color: 'from-green-500 to-emerald-500',
    },
    {
      id: '4',
      platform: 'AtCoder',
      username: '',
      isConnected: false,
      problemsSynced: 0,
      icon: '⚡',
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: '5',
      platform: 'AlgoExpert',
      username: 'algo_expert',
      isConnected: true,
      lastSync: '1 day ago',
      problemsSynced: 250,
      icon: '💎',
      color: 'from-purple-600 to-blue-600',
    },
  ]);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformConnection | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  const handleSync = async (platformId: string) => {
    setSyncing(platformId);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setPlatforms(platforms.map(p =>
        p.id === platformId
          ? { ...p, lastSync: 'Just now' }
          : p
      ));
    } finally {
      setSyncing(null);
    }
  };

  const handleConnect = (platform: PlatformConnection) => {
    setSelectedPlatform(platform);
    setShowConnectModal(true);
  };

  const handleDisconnect = (platformId: string) => {
    setPlatforms(platforms.map(p =>
      p.id === platformId
        ? { ...p, isConnected: false, username: '', lastSync: undefined }
        : p
    ));
  };

  const handleSaveConnection = () => {
    if (selectedPlatform && newUsername) {
      setPlatforms(platforms.map(p =>
        p.id === selectedPlatform.id
          ? { ...p, isConnected: true, username: newUsername, lastSync: 'Just now' }
          : p
      ));
      setShowConnectModal(false);
      setNewUsername('');
    }
  };

  const connectedCount = platforms.filter(p => p.isConnected).length;
  const totalProblems = platforms.reduce((sum, p) => sum + p.problemsSynced, 0);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <Header />

      <main className="p-6 ml-60">
        {/* Breadcrumb */}
        <div className={`flex items-center gap-2 mb-6 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          <span>Integrations</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            🔗 Platform Integrations
          </h1>
          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
            Connect your coding platforms to auto-sync problems and track progress
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <LinkIcon className="w-4 h-4 text-blue-500" />
              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Connected Platforms</span>
            </div>
            <div className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              {connectedCount}/{platforms.length}
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Problems Synced</span>
            </div>
            <div className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              {totalProblems}
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-4 h-4 text-purple-500" />
              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Auto-Sync Enabled</span>
            </div>
            <div className={`text-2xl font-bold text-green-600`}>
              Yes ✓
            </div>
          </div>
        </div>

        {/* Platforms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platforms.map((platform) => (
            <div
              key={platform.id}
              className={`p-6 rounded-xl border transition-all group ${
                isDark
                  ? 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{platform.icon}</div>
                  <div>
                    <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {platform.platform}
                    </h3>
                    {platform.isConnected && (
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        @{platform.username}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div className={`text-xs font-bold px-3 py-1 rounded-full ${
                  platform.isConnected
                    ? isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
                    : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-600'
                }`}>
                  {platform.isConnected ? '✓ Connected' : '○ Disconnected'}
                </div>
              </div>

              {/* Stats */}
              {platform.isConnected && (
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Problems Synced</span>
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {platform.problemsSynced}
                    </span>
                  </div>
                  {platform.lastSync && (
                    <div className="flex justify-between text-sm">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Last Sync</span>
                      <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {platform.lastSync}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {!platform.isConnected && platform.username === '' && (
                <div className={`p-3 rounded-lg mb-4 ${
                  isDark ? 'bg-slate-700/50' : 'bg-slate-100'
                }`}>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Connect your account to start syncing
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {platform.isConnected ? (
                  <>
                    <button
                      onClick={() => handleSync(platform.id)}
                      disabled={syncing === platform.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition"
                    >
                      {syncing === platform.id ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Sync Now
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDisconnect(platform.id)}
                      className={`px-4 py-2 rounded-lg font-medium border transition ${
                        isDark
                          ? 'bg-slate-700 border-slate-600 hover:bg-red-900/20 text-red-400'
                          : 'bg-slate-100 border-slate-300 hover:bg-red-50 text-red-600'
                      }`}
                    >
                      <Unlink className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleConnect(platform)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Connect Account
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Connection Modal */}
        {showConnectModal && selectedPlatform && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className={`p-8 rounded-xl max-w-md w-full ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
              <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Connect {selectedPlatform.platform}
              </h2>

              <div className="mb-6">
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {selectedPlatform.platform} Username
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder={`Enter your ${selectedPlatform.platform} username`}
                  className={`w-full px-4 py-2 rounded-lg border transition ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
                  }`}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveConnection}
                  disabled={!newUsername}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium"
                >
                  Connect
                </button>
                <button
                  onClick={() => {
                    setShowConnectModal(false);
                    setNewUsername('');
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium border transition ${
                    isDark
                      ? 'bg-slate-700 border-slate-600'
                      : 'bg-slate-100 border-slate-300'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

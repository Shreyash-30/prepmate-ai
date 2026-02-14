/**
 * Integrations Component
 * UI for connecting and managing platform integrations
 */

import React, { useState, useEffect } from 'react';
import { Activity, ExternalLink, Settings, Plus, Trash2, RefreshCw } from 'lucide-react';

const IntegrationsPage = () => {
  const [integrations, setIntegrations] = useState({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState({});
  const [showModal, setShowModal] = useState(null);
  const [formData, setFormData] = useState({});

  const platforms = [
    {
      name: 'codeforces',
      label: 'CodeForces',
      icon: '♟️',
      url: 'https://codeforces.com',
      field: 'cfHandle',
      placeholder: 'Enter CodeForces handle',
      description: 'Sync all submissions and contest history from CodeForces',
    },
    {
      name: 'leetcode',
      label: 'LeetCode',
      icon: '🏆',
      url: 'https://leetcode.com',
      field: 'leetcodeUsername',
      placeholder: 'Enter LeetCode username',
      description: 'Sync recent submissions from your LeetCode profile',
    },
    {
      name: 'hackerrank',
      label: 'HackerRank',
      icon: '⭐',
      url: 'https://www.hackerrank.com',
      field: 'hackerrankUsername',
      placeholder: 'Enter HackerRank username',
      description: 'Sync challenges solved on HackerRank',
    },
    {
      name: 'geeksforgeeks',
      label: 'GeeksforGeeks',
      icon: '📚',
      url: 'https://geeksforgeeks.org',
      field: 'gfgUsername',
      placeholder: 'Enter GeeksforGeeks username',
      description: 'Sync problems solved on GeeksforGeeks',
    },
  ];

  useEffect(() => {
    fetchIntegrationStatus();
  }, []);

  const fetchIntegrationStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/integrations/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setIntegrations(data.integrations || {});
    } catch (error) {
      console.error('Error fetching integration status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (platformName, field) => {
    setSyncing((prev) => ({ ...prev, [platformName]: true }));

    try {
      const token = localStorage.getItem('token');
      const endpoint = `/api/integrations/${platformName}/sync`;
      const body = { [field]: formData[field] };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Synced! Fetched ${result.data?.recordsInserted || 0} problems`);
        await fetchIntegrationStatus();
        setShowModal(null);
        setFormData({});
      } else {
        const error = await response.json();
        alert(`❌ Sync failed: ${error.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setSyncing((prev) => ({ ...prev, [platformName]: false }));
    }
  };

  const handleDisconnect = async (platformName) => {
    if (!window.confirm(`Disconnect from ${platformName}?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/integrations/${platformName}/disconnect`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert('✅ Disconnected');
        await fetchIntegrationStatus();
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading integrations...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Platform Integrations</h1>
          <p className="text-slate-400">Connect your programming platforms to sync problems and contests</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {platforms.map((platform) => {
            const platformData = integrations[platform.name];
            const isConnected = platformData?.isConnected;
            const lastSync = platformData?.lastSyncTime;

            return (
              <div
                key={platform.name}
                className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{platform.icon}</span>
                    <div>
                      <h2 className="text-xl font-bold text-white">{platform.label}</h2>
                      <p className="text-sm text-slate-400">{platform.description}</p>
                    </div>
                  </div>
                  {isConnected && (
                    <div className="flex items-center gap-1 bg-green-900 text-green-200 px-2 py-1 rounded text-xs">
                      <Activity size={12} />
                      Connected
                    </div>
                  )}
                </div>

                {lastSync && (
                  <div className="text-xs text-slate-400 mb-4">
                    Last synced: {new Date(lastSync).toLocaleDateString()}
                  </div>
                )}

                <div className="flex gap-2">
                  {!isConnected ? (
                    <button
                      onClick={() => setShowModal(platform.name)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded flex items-center justify-center gap-2 transition"
                    >
                      <Plus size={16} /> Connect
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleSync(platform.name, platform.field)}
                        disabled={syncing[platform.name]}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded flex items-center justify-center gap-2 transition disabled:opacity-50"
                      >
                        <RefreshCw size={16} />
                        {syncing[platform.name] ? 'Syncing...' : 'Sync Now'}
                      </button>
                      <button
                        onClick={() => handleDisconnect(platform.name)}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Connect Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full">
              <h3 className="text-2xl font-bold text-white mb-4">
                Connect to {platforms.find((p) => p.name === showModal)?.label}
              </h3>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {platforms.find((p) => p.name === showModal)?.label} Username
                </label>
                <input
                  type="text"
                  placeholder={platforms.find((p) => p.name === showModal)?.placeholder}
                  value={formData[platforms.find((p) => p.name === showModal)?.field] || ''}
                  onChange={(e) => {
                    const field = platforms.find((p) => p.name === showModal)?.field;
                    setFormData((prev) => ({
                      ...prev,
                      [field]: e.target.value,
                    }));
                  }}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(null);
                    setFormData({});
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const field = platforms.find((p) => p.name === showModal)?.field;
                    handleSync(showModal, field);
                  }}
                  disabled={syncing[showModal]}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition disabled:opacity-50"
                >
                  {syncing[showModal] ? 'Connecting...' : 'Connect & Sync'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrationsPage;

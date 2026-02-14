/**
 * Sync Dashboard Component
 * Real-time sync status, problem count, and integration health
 */

import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle, Clock, Database } from 'lucide-react';

const SyncDashboard = () => {
  const [health, setHealth] = useState(null);
  const [syncHistory, setSyncHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState(null);

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedPlatform) {
      fetchSyncHistory(selectedPlatform);
    }
  }, [selectedPlatform]);

  const fetchHealthData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/health/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setHealth(data.data);
    } catch (error) {
      console.error('Error fetching health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSyncHistory = async (platform) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/health/${platform}/history?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setSyncHistory(data.syncs || []);
    } catch (error) {
      console.error('Error fetching sync history:', error);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading dashboard...</div>;
  }

  if (!health) {
    return <div className="p-8 text-center text-red-400">Failed to load dashboard</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Sync Dashboard</h1>

        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Problems</p>
                <p className="text-3xl font-bold text-white">{health.statistics?.totalProblems || 0}</p>
              </div>
              <Database className="text-blue-400" size={32} />
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Solved</p>
                <p className="text-3xl font-bold text-green-400">{health.statistics?.solvedProblems || 0}</p>
              </div>
              <CheckCircle className="text-green-400" size={32} />
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Solve Rate</p>
                <p className="text-3xl font-bold text-blue-400">
                  {health.statistics?.problemSolveRate?.toFixed(1) || 0}%
                </p>
              </div>
              <Activity className="text-blue-400" size={32} />
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Connected Platforms</p>
                <p className="text-3xl font-bold text-purple-400">
                  {Object.values(health.integrations || {}).filter((i) => i.isConnected).length}
                </p>
              </div>
              <Activity className="text-purple-400" size={32} />
            </div>
          </div>
        </div>

        {/* Integration Status */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Integration Status</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(health.integrations || {}).map(([platform, data]) => (
              <div
                key={platform}
                onClick={() => setSelectedPlatform(platform)}
                className="bg-slate-700 border border-slate-600 rounded p-4 cursor-pointer hover:border-blue-500 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white capitalize">{platform}</h3>
                  {data.isConnected ? (
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  ) : (
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  )}
                </div>

                <div className="text-sm text-slate-400">
                  <p>Success Rate: {data.successRate?.toFixed(0)}%</p>
                  <p>Syncs: {data.recentSyncs}</p>
                  {data.lastSyncTime && (
                    <p className="text-xs mt-1">Last: {new Date(data.lastSyncTime).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sync History */}
        {selectedPlatform && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4 capitalize">
              {selectedPlatform} Sync History
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-slate-300">
                <thead className="text-xs text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="text-left py-2 px-4">Date</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-left py-2 px-4">Records</th>
                    <th className="text-left py-2 px-4">Duration</th>
                    <th className="text-left py-2 px-4">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {syncHistory.map((sync, idx) => (
                    <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700">
                      <td className="py-3 px-4">{new Date(sync.timestamp).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            sync.status === 'success'
                              ? 'bg-green-900 text-green-200'
                              : sync.status === 'failed'
                              ? 'bg-red-900 text-red-200'
                              : 'bg-yellow-900 text-yellow-200'
                          }`}
                        >
                          {sync.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">{sync.records?.inserted || 0}</td>
                      <td className="py-3 px-4">{(sync.duration / 1000).toFixed(1)}s</td>
                      <td className="py-3 px-4">
                        {sync.errors > 0 ? <span className="text-red-400">{sync.errors}</span> : '0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncDashboard;

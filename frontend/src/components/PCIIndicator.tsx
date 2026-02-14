/**
 * PCI Indicator Component
 * Displays Problem Completion Index (PCI) score with topic breakdown
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

const PCIIndicator = ({ roadmapId }: { roadmapId?: string }) => {
  const [pciData, setPciData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roadmapId) {
      fetchPCIData();
    }
  }, [roadmapId]);

  const fetchPCIData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!roadmapId) return;

      const response = await fetch(`/api/roadmap/pci/${roadmapId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setPciData(data.data);

      // Fetch recommendations
      const recResponse = await fetch(`/api/roadmap/recommendations/${roadmapId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const recData = await recResponse.json();
      setRecommendations(recData.recommendations || []);
    } catch (error) {
      console.error('Error fetching PCI data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-400">Loading PCI data...</div>;
  }

  if (!pciData) {
    return <div className="p-6 text-center text-red-400">No PCI data available</div>;
  }

  const pciScore = pciData.score || 0;
  const pciPercentage = Math.min(pciScore, 100);
  const pciStatus = pciPercentage >= 75 ? 'excellent' : pciPercentage >= 50 ? 'good' : 'needs-work';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'from-green-600 to-green-400';
      case 'good':
        return 'from-yellow-600 to-yellow-400';
      default:
        return 'from-red-600 to-red-400';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-900 text-green-200';
      case 'good':
        return 'bg-yellow-900 text-yellow-200';
      default:
        return 'bg-red-900 text-red-200';
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 space-y-6">
      {/* Main PCI Score */}
      <div className="text-center">
        <div className="text-slate-400 text-sm font-medium mb-2">Problem Completion Index</div>

        <div className="flex justify-center mb-6">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle cx="50" cy="50" r="45" fill="none" stroke="#334155" strokeWidth="8" />

              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={
                  pciStatus === 'excellent'
                    ? '#10b981'
                    : pciStatus === 'good'
                    ? '#f59e0b'
                    : '#ef4444'
                }
                strokeWidth="8"
                strokeDasharray={`${(pciPercentage / 100) * 283} 283`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{pciPercentage.toFixed(0)}</div>
                <div className="text-xs text-slate-400">%</div>
              </div>
            </div>
          </div>
        </div>

        <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusBgColor(pciStatus)}`}>
          {pciStatus.replace('-', ' ').toUpperCase()}
        </div>
      </div>

      {/* Topic Breakdown */}
      {pciData.topicBreakdown && pciData.topicBreakdown.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Topic Breakdown</h3>

          <div className="space-y-3">
            {pciData.topicBreakdown.map((topic: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">{topic.name}</span>
                  <span className="text-slate-400">
                    {topic.completed}/{topic.total}
                  </span>
                </div>

                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 rounded-full transition-all"
                    style={{ width: `${(topic.completed / topic.total) * 100}%` }}
                  ></div>
                </div>

                <div className="text-xs text-slate-400">
                  {((topic.completed / topic.total) * 100).toFixed(0)}% Complete
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
        <div className="text-center">
          <TrendingUp className="mx-auto text-blue-400 mb-2" size={20} />
          <div className="text-sm text-slate-400">Total Problems</div>
          <div className="text-xl font-bold text-white">{pciData.totalProblems}</div>
        </div>

        <div className="text-center">
          <CheckCircle className="mx-auto text-green-400 mb-2" size={20} />
          <div className="text-sm text-slate-400">Solved</div>
          <div className="text-xl font-bold text-green-400">{pciData.solvedProblems}</div>
        </div>

        <div className="text-center">
          <AlertCircle className="mx-auto text-yellow-400 mb-2" size={20} />
          <div className="text-sm text-slate-400">Remaining</div>
          <div className="text-xl font-bold text-yellow-400">
            {(pciData.totalProblems || 0) - (pciData.solvedProblems || 0)}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="pt-4 border-t border-slate-700 space-y-3">
          <h3 className="text-lg font-semibold text-white">AI Recommendations</h3>

          <div className="space-y-2">
            {recommendations.slice(0, 3).map((rec: any, idx: number) => (
              <div key={idx} className="bg-slate-700 rounded p-3 flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <AlertCircle size={16} className="text-blue-400" />
                </div>
                <p className="text-sm text-slate-300">{rec.message || rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PCIIndicator;

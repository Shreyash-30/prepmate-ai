/**
 * Contest Performance Charts Component
 * Displays rating trends and difficulty distribution
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart3 } from 'lucide-react';

const ContestPerformanceCharts = ({ userId }: { userId?: string }) => {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'rating' | 'difficulty'>('rating');

  useEffect(() => {
    if (userId) {
      fetchContestData();
    }
  }, [userId]);

  const fetchContestData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!userId) return;

      const response = await fetch(`/api/users/${userId}/contests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setContests(data.contests || []);
    } catch (error) {
      console.error('Error fetching contest data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-400">Loading contest data...</div>;
  }

  // Calculate statistics
  const sortedContests = [...contests].sort(
    (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const ratingData = sortedContests.map((c: any) => ({
    date: new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    rating: c.rating || 0,
    maxRating: c.maxRating || 0,
  }));

  const difficultyDistribution = {
    easy: contests.filter((c: any) => c.difficulty === 'easy').length,
    medium: contests.filter((c: any) => c.difficulty === 'medium').length,
    hard: contests.filter((c: any) => c.difficulty === 'hard').length,
  };

  const totalDifficulty = Object.values(difficultyDistribution).reduce((a: number, b: number) => a + b, 0);
  const maxRating = Math.max(...ratingData.map((d: any) => d.maxRating), 1000);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="text-blue-400" />
          Contest Performance
        </h2>

        <div className="flex gap-2">
          <button
            onClick={() => setChartType('rating')}
            className={`px-4 py-2 rounded text-sm font-medium transition ${
              chartType === 'rating'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Rating Trend
          </button>
          <button
            onClick={() => setChartType('difficulty')}
            className={`px-4 py-2 rounded text-sm font-medium transition ${
              chartType === 'difficulty'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Difficulty
          </button>
        </div>
      </div>

      {contests.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No contest data available yet</div>
      ) : (
        <>
          {chartType === 'rating' ? (
            // Rating Trend Chart
            <div>
              <div className="mb-6 p-4 bg-slate-700 rounded flex justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Current Rating</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {ratingData.length > 0 ? ratingData[ratingData.length - 1].rating : 0}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Max Rating</p>
                  <p className="text-2xl font-bold text-green-400">
                    {ratingData.reduce((max: number, d: any) => Math.max(max, d.maxRating), 0)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Total Contests</p>
                  <p className="text-2xl font-bold text-purple-400">{contests.length}</p>
                </div>
              </div>

              {/* Simple Line Chart */}
              <div className="h-64 flex items-flex-end justify-between gap-1 px-4 border-b border-slate-700 pb-4">
                {ratingData.map((point: any, idx: number) => {
                  const height = (point.rating / maxRating) * 100;
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center group relative"
                      title={`${point.date}: ${point.rating}`}
                    >
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all hover:shadow-lg hover:from-blue-600 hover:to-blue-500"
                        style={{ height: `${height}%`, minHeight: '2px' }}
                      ></div>

                      <div className="absolute -bottom-8 text-xs text-slate-400 whitespace-nowrap">
                        {point.date}
                      </div>

                      <div className="absolute -top-8 bg-slate-700 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition">
                        {point.rating}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-slate-700 rounded p-4">
                  <p className="text-slate-400 text-sm mb-1">Contests This Month</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {contests.filter((c: any) => {
                      const contestDate = new Date(c.date);
                      const now = new Date();
                      return (
                        contestDate.getMonth() === now.getMonth() &&
                        contestDate.getFullYear() === now.getFullYear()
                      );
                    }).length}
                  </p>
                </div>

                <div className="bg-slate-700 rounded p-4">
                  <p className="text-slate-400 text-sm mb-1">Avg Rating Change</p>
                  <p className="text-2xl font-bold text-green-400">
                    {ratingData.length > 1
                      ? (
                          ratingData[ratingData.length - 1].rating - ratingData[0].rating
                        ).toFixed(0)
                      : 0}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Difficulty Distribution Chart
            <div>
              <div className="mb-6 p-4 bg-slate-700 rounded">
                <p className="text-slate-400 text-sm mb-4">Contests by Difficulty</p>

                <div className="space-y-4">
                  {/* Easy */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-green-400">Easy</span>
                      <span className="text-slate-300">
                        {difficultyDistribution.easy} ({totalDifficulty > 0 ? ((difficultyDistribution.easy / totalDifficulty) * 100).toFixed(0) : 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-3">
                      <div
                        className="bg-green-500 h-3 rounded-full transition-all"
                        style={{
                          width:
                            totalDifficulty > 0
                              ? `${(difficultyDistribution.easy / totalDifficulty) * 100}%`
                              : '0%',
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Medium */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-yellow-400">Medium</span>
                      <span className="text-slate-300">
                        {difficultyDistribution.medium} ({totalDifficulty > 0 ? ((difficultyDistribution.medium / totalDifficulty) * 100).toFixed(0) : 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-3">
                      <div
                        className="bg-yellow-500 h-3 rounded-full transition-all"
                        style={{
                          width:
                            totalDifficulty > 0
                              ? `${(difficultyDistribution.medium / totalDifficulty) * 100}%`
                              : '0%',
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Hard */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-red-400">Hard</span>
                      <span className="text-slate-300">
                        {difficultyDistribution.hard} ({totalDifficulty > 0 ? ((difficultyDistribution.hard / totalDifficulty) * 100).toFixed(0) : 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-3">
                      <div
                        className="bg-red-500 h-3 rounded-full transition-all"
                        style={{
                          width:
                            totalDifficulty > 0
                              ? `${(difficultyDistribution.hard / totalDifficulty) * 100}%`
                              : '0%',
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Contests Table */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Recent Contests</h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-slate-400 border-b border-slate-700">
                      <tr>
                        <th className="text-left py-2 px-3">Date</th>
                        <th className="text-left py-2 px-3">Name</th>
                        <th className="text-left py-2 px-3">Rating</th>
                        <th className="text-left py-2 px-3">Change</th>
                        <th className="text-left py-2 px-3">Difficulty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedContests.slice(-5).map((contest: any, idx: number) => (
                        <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700">
                          <td className="py-2 px-3 text-slate-300">
                            {new Date(contest.date).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-3 text-slate-300">{contest.name}</td>
                          <td className="py-2 px-3 text-blue-400 font-semibold">{contest.rating}</td>
                          <td className={`py-2 px-3 font-semibold ${
                            contest.ratingChange >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {contest.ratingChange > 0 ? '+' : ''}{contest.ratingChange}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              contest.difficulty === 'easy' ? 'bg-green-900 text-green-200' :
                              contest.difficulty === 'medium' ? 'bg-yellow-900 text-yellow-200' :
                              'bg-red-900 text-red-200'
                            }`}>
                              {contest.difficulty}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ContestPerformanceCharts;

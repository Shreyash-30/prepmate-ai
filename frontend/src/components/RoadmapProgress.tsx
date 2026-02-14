/**
 * Roadmap Progress Component
 * Displays progress for each topic with visual progress bars
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Clock, Target } from 'lucide-react';

const RoadmapProgress = ({ roadmapId }: { roadmapId?: string }) => {
  const [roadmap, setRoadmap] = useState(null);
  const [topicProgress, setTopicProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState(null);

  useEffect(() => {
    if (roadmapId) {
      fetchRoadmapData();
    }
  }, [roadmapId]);

  const fetchRoadmapData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!roadmapId) return;

      // Fetch roadmap basic info
      const response = await fetch(`/api/roadmap/${roadmapId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setRoadmap(data.data);

      // Fetch topic progress
      const progressResponse = await fetch(`/api/roadmap/progress/${roadmapId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const progressData = await progressResponse.json();
      setTopicProgress(progressData.topics || []);
    } catch (error) {
      console.error('Error fetching roadmap data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-400">Loading roadmap...</div>;
  }

  if (!roadmap) {
    return <div className="p-6 text-center text-red-400">No roadmap data available</div>;
  }

  // Calculate total progress
  const totalProblems = topicProgress.reduce((sum: number, t: any) => sum + (t.totalProblems || 0), 0);
  const solvedTotal = topicProgress.reduce((sum: number, t: any) => sum + (t.solvedProblems || 0), 0);
  const overallProgress = totalProblems > 0 ? (solvedTotal / totalProblems) * 100 : 0;

  // Get status indicator
  const getStatusIcon = (progress: number) => {
    if (progress === 100) return <CheckCircle className="text-green-400" size={20} />;
    if (progress >= 50) return <Clock className="text-yellow-400" size={20} />;
    return <AlertCircle className="text-red-400" size={20} />;
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'from-green-600 to-green-400';
    if (progress >= 75) return 'from-blue-600 to-blue-400';
    if (progress >= 50) return 'from-yellow-600 to-yellow-400';
    return 'from-red-600 to-red-400';
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">{roadmap.name}</h2>
        <p className="text-slate-400 font-medium">
          Estimated Duration: {roadmap.estimatedDays} days
        </p>
      </div>

      {/* Overall Progress */}
      <div className="bg-slate-700 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Overall Progress</h3>
          <span className={`text-2xl font-bold ${
            overallProgress === 100 ? 'text-green-400' :
            overallProgress >= 75 ? 'text-blue-400' :
            overallProgress >= 50 ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {overallProgress.toFixed(0)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-600 rounded-full h-4 mb-4">
          <div
            className={`h-4 rounded-full transition-all bg-gradient-to-r ${getProgressColor(overallProgress)}`}
            style={{ width: `${overallProgress}%` }}
          ></div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-slate-400 text-sm mb-1">Solved</p>
            <p className="text-2xl font-bold text-green-400">{solvedTotal}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-sm mb-1">Total</p>
            <p className="text-2xl font-bold text-blue-400">{totalProblems}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-sm mb-1">Remaining</p>
            <p className="text-2xl font-bold text-yellow-400">{totalProblems - solvedTotal}</p>
          </div>
        </div>
      </div>

      {/* Topic Progress List */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Topics</h3>

        <div className="space-y-4">
          {topicProgress.map((topic: any, idx: number) => {
            const progress =
              topic.totalProblems > 0
                ? (topic.solvedProblems / topic.totalProblems) * 100
                : 0;

            return (
              <div
                key={idx}
                onClick={() => setSelectedTopic(selectedTopic === idx ? null : idx)}
                className="bg-slate-700 border border-slate-600 rounded-lg p-4 cursor-pointer hover:border-blue-500 transition"
              >
                {/* Topic Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(progress)}
                    <div>
                      <h4 className="font-semibold text-white">{topic.name}</h4>
                      <p className="text-sm text-slate-400">
                        {topic.solvedProblems} / {topic.totalProblems} problems solved
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`text-2xl font-bold ${
                      progress === 100 ? 'text-green-400' :
                      progress >= 75 ? 'text-blue-400' :
                      progress >= 50 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {progress.toFixed(0)}%
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-600 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all bg-gradient-to-r ${getProgressColor(progress)}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                {/* Difficulty Breakdown (Hidden by default, shown when selected) */}
                {selectedTopic === idx && topic.difficultyBreakdown && (
                  <div className="mt-4 pt-4 border-t border-slate-600 space-y-3">
                    {/* Easy */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-green-400">Easy</span>
                        <span className="text-slate-300">
                          {topic.difficultyBreakdown.easy?.solved || 0} / {topic.difficultyBreakdown.easy?.total || 0}
                        </span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: topic.difficultyBreakdown.easy?.total
                              ? `${(topic.difficultyBreakdown.easy.solved / topic.difficultyBreakdown.easy.total) * 100}%`
                              : '0%',
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Medium */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-yellow-400">Medium</span>
                        <span className="text-slate-300">
                          {topic.difficultyBreakdown.medium?.solved || 0} / {topic.difficultyBreakdown.medium?.total || 0}
                        </span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{
                            width: topic.difficultyBreakdown.medium?.total
                              ? `${(topic.difficultyBreakdown.medium.solved / topic.difficultyBreakdown.medium.total) * 100}%`
                              : '0%',
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Hard */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-red-400">Hard</span>
                        <span className="text-slate-300">
                          {topic.difficultyBreakdown.hard?.solved || 0} / {topic.difficultyBreakdown.hard?.total || 0}
                        </span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{
                            width: topic.difficultyBreakdown.hard?.total
                              ? `${(topic.difficultyBreakdown.hard.solved / topic.difficultyBreakdown.hard.total) * 100}%`
                              : '0%',
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Estimated Time Remaining */}
      {topicProgress.length > 0 && (
        <div className="mt-8 bg-slate-700 rounded-lg p-6 flex items-center gap-4">
          <Target className="text-blue-400" size={32} />
          <div>
            <p className="text-slate-400 text-sm">Estimated Time to Complete</p>
            <p className="text-2xl font-bold text-white">
              {Math.ceil(((totalProblems - solvedTotal) / (totalProblems || 1)) * roadmap.estimatedDays)} days
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Based on {roadmap.estimatedDays} days total for {totalProblems} problems
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadmapProgress;

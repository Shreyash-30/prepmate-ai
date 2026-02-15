/**
 * Practice Page - Adaptive Practice Interface
 * Topic selection, mastery-based recommendation, intelligent practice lab
 */

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useThemeStore } from '@/store/themeStore';
import { apiClient } from '@/services/apiClient';
import { ChevronRight, Book, Zap, Award, AlertCircle } from 'lucide-react';

interface Topic {
  id: string;
  name: string;
  mastery: number;
  difficulty: 'easy' | 'medium' | 'hard';
  problemCount: number;
  lastPracticed: string;
}

interface Question {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topicId: string;
  platform: string;
  url: string;
  acceptance: number;
}

type ViewMode = 'subject-select' | 'topic-list' | 'topic-detail' |'question-list' | 'practice-lab';

export default function PracticePage() {
  const { isDark } = useThemeStore();
  const [viewMode, setViewMode] = useState<ViewMode>('subject-select');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  const subjects = ['DSA', 'OS', 'DBMS', 'System Design', 'OOPs', 'Networking'];

  const handleSubjectSelect = async (subject: string) => {
    setSelectedSubject(subject);
    setViewMode('topic-list');
    setLoading(true);

    try {
      // Mock API call
      const mockTopics: Topic[] = [
        {
          id: '1',
          name: 'Arrays',
          mastery: 0.85,
          difficulty: 'easy',
          problemCount: 32,
          lastPracticed: '2 days ago',
        },
        {
          id: '2',
          name: 'Graphs',
          mastery: 0.62,
          difficulty: 'hard',
          problemCount: 28,
          lastPracticed: '5 days ago',
        },
        {
          id: '3',
          name: 'Dynamic Programming',
          mastery: 0.48,
          difficulty: 'hard',
          problemCount: 19,
          lastPracticed: '1 week ago',
        },
      ];
      setTopics(mockTopics);
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 0.8) return 'text-green-600';
    if (mastery >= 0.6) return 'text-blue-600';
    if (mastery >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'hard':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <Header />

      <main className="p-6 ml-60">
        {/* Breadcrumb */}
        <div className={`flex items-center gap-2 mb-6 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          <button
            onClick={() => {
              setViewMode('subject-select');
              setSelectedSubject(null);
            }}
            className="hover:text-blue-600"
          >
            Practice
          </button>
          {selectedSubject && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span>{selectedSubject}</span>
            </>
          )}
          {selectedTopic && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span>{selectedTopic.name}</span>
            </>
          )}
        </div>

        {/* Subject Selection */}
        {viewMode === 'subject-select' && (
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Select Subject
            </h1>
            <p className={`mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Choose a subject to start practicing
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subject) => (
                <button
                  key={subject}
                  onClick={() => handleSubjectSelect(subject)}
                  className={`p-6 rounded-xl border-2 transition-all group ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 hover:border-blue-500'
                      : 'bg-white border-slate-200 hover:border-blue-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`font-semibold text-lg group-hover:text-blue-600 transition ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        {subject}
                      </h3>
                    </div>
                    <Book className="w-6 h-6 text-blue-600 group-hover:translate-x-1 transition" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Topic List */}
        {viewMode === 'topic-list' && selectedSubject && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {selectedSubject} Topics
                </h1>
                <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                  {topics.length} topics • Adaptive difficulty based on mastery
                </p>
              </div>

              <div className={`p-4 rounded-lg flex items-center gap-2 ${
                isDark ? 'bg-slate-800' : 'bg-slate-100'
              }`}>
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                  AI Recommendations Enabled
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => {
                    setSelectedTopic(topic);
                    setViewMode('topic-detail');
                  }}
                  className={`w-full p-4 rounded-lg border transition-all text-left group ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 hover:border-blue-500'
                      : 'bg-white border-slate-200 hover:border-blue-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className={`font-semibold group-hover:text-blue-600 transition ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        {topic.name}
                      </h3>
                      <p className={`text-sm mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                        {topic.problemCount} problems • Last practiced {topic.lastPracticed}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div>
                        <div className={`text-lg font-bold ${getMasteryColor(topic.mastery)}`}>
                          {Math.round(topic.mastery * 100)}%
                        </div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                          Mastery
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(topic.difficulty)}`}>
                        {topic.difficulty}
                      </span>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Topic Detail */}
        {viewMode === 'topic-detail' && selectedTopic && (
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {selectedTopic.name}
            </h1>

            {/* Intelligence Panel */}
            <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 ${loading ? 'opacity-50' : ''}`}>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-yellow-500" />
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Mastery</span>
                </div>
                <div className={`text-2xl font-bold ${getMasteryColor(selectedTopic.mastery)}`}>
                  {Math.round(selectedTopic.mastery * 100)}%
                </div>
              </div>

              <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Recommended Difficulty</span>
                </div>
                <div className={`text-2xl font-bold`}>
                  {selectedTopic.mastery >= 0.8 ? 'Hard' : selectedTopic.mastery >= 0.5 ? 'Medium' : 'Easy'}
                </div>
              </div>

              <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Problems</span>
                </div>
                <div className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  {selectedTopic.problemCount}
                </div>
              </div>

              <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Weak Skills</span>
                </div>
                <div className={`text-2xl font-bold text-red-600`}>
                  2
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Detected</p>
              </div>
            </div>

            {/* Recommended Sets */}
            <div className={`mb-6 p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                📚 Recommended Problem Sets
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                  <button
                    key={difficulty}
                    onClick={() => setViewMode('practice-lab')}
                    className={`p-4 rounded-lg border transition-all hover:border-blue-500 text-left group ${
                      isDark
                        ? 'bg-slate-700 border-slate-600'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-2 ${getDifficultyColor(difficulty)}`}>
                      {difficulty === 'easy' ? '8 Problems' : difficulty === 'medium' ? '12 Problems' : '6 Problems'}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {difficulty === 'easy' && '✅ Perfect for building confidence'}
                      {difficulty === 'medium' && '🎯 Balanced difficulty matching'}
                      {difficulty === 'hard' && '🚀 Push your limits'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setViewMode('practice-lab')}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
              >
                🚀 Start Practice Lab
              </button>
              <button
                className={`px-6 py-3 rounded-lg font-medium border transition ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-900'
                }`}
              >
                🔗 Solve on LeetCode
              </button>
            </div>
          </div>
        )}

        {/* Practice Lab Placeholder */}
        {viewMode === 'practice-lab' && (
          <div className={`p-8 rounded-xl border text-center ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <Zap className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
            <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              🧪 AI Practice Lab
            </h2>
            <p className={`mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Real-time AI code review, hint system, and voice tutor coming soon
            </p>
            <button
              onClick={() => setViewMode('topic-detail')}
              className={`px-6 py-2 rounded-lg border transition ${
                isDark
                  ? 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                  : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
              }`}
            >
              ← Back to Topic
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * Hint Panel Component - AI-powered hint system
 */

import { useState } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { Lightbulb, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

export interface Hint {
  id: string;
  level: 1 | 2 | 3 | 4; // 1: conceptual, 2: approach, 3: implementation, 4: code
  title: string;
  content: string;
}

interface HintPanelProps {
  hints: Hint[];
  onHintUsed: (hintLevel: number) => void;
  problemId: string;
  topic: string;
}

export function HintPanel({ hints, onHintUsed, problemId, topic }: HintPanelProps) {
  const { isDark } = useThemeStore();
  const [expandedHint, setExpandedHint] = useState<number | null>(null);
  const [usedHints, setUsedHints] = useState<number[]>([]);
  const [copied, setCopied] = useState<number | null>(null);

  const handleHintToggle = (level: number) => {
    setExpandedHint(expandedHint === level ? null : level);
    if (!usedHints.includes(level)) {
      setUsedHints([...usedHints, level]);
      onHintUsed(level);
    }
  };

  const handleCopyHint = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  const getHintLevelLabel = (level: number) => {
    switch (level) {
      case 1:
        return '💡 Conceptual Hint';
      case 2:
        return '🎯 Approach Hint';
      case 3:
        return '🔑 Implementation Hint';
      case 4:
        return '💻 Code Hint';
      default:
        return 'Hint';
    }
  };

  const getHintColor = (level: number) => {
    switch (level) {
      case 1:
        return isDark ? 'border-blue-900 bg-blue-900/20' : 'border-blue-200 bg-blue-50';
      case 2:
        return isDark ? 'border-purple-900 bg-purple-900/20' : 'border-purple-200 bg-purple-50';
      case 3:
        return isDark ? 'border-green-900 bg-green-900/20' : 'border-green-200 bg-green-50';
      case 4:
        return isDark ? 'border-orange-900 bg-orange-900/20' : 'border-orange-200 bg-orange-50';
      default:
        return '';
    }
  };

  return (
    <div className={`rounded-lg border-2 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            AI Hint System
          </h3>
        </div>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Progressive hints for <span className="font-medium">{topic}</span> on problem <span className="font-mono text-xs">{problemId}</span>
        </p>
      </div>

      {/* Hints */}
      <div className="p-4 space-y-2">
        {hints.map((hint, index) => (
          <button
            key={hint.id}
            onClick={() => handleHintToggle(hint.level)}
            className={`w-full p-3 rounded-lg border-2 transition-all text-left ${getHintColor(hint.level)} ${
              expandedHint === hint.level ? 'ring-2 ring-offset-1 ring-blue-500' : ''
            }`}
          >
            {/* Hint Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-lg">{getHintLevelLabel(hint.level)}</span>
                {usedHints.includes(hint.level) && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    isDark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    Used
                  </span>
                )}
              </div>
              {expandedHint === hint.level ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>

            {/* Hint Content */}
            {expandedHint === hint.level && (
              <div className={`mt-3 p-3 rounded ${isDark ? 'bg-slate-900/50' : 'bg-white/50'}`}>
                <p className={`text-sm leading-relaxed mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {hint.content}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyHint(hint.content, index);
                  }}
                  className={`text-xs px-3 py-1 rounded flex items-center gap-1 transition ${
                    copied === index
                      ? isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
                      : isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {copied === index ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className={`p-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <div className="flex justify-between items-center text-sm">
          <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
            Hints Used: <span className="font-semibold">{usedHints.length}/{hints.length}</span>
          </span>
          <span className={`text-xs px-2 py-1 rounded ${
            usedHints.length > 2
              ? isDark ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-100 text-orange-700'
              : isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
          }`}>
            {usedHints.length > 2 ? '⚠️ Many hints used' : '✅ Good progress'}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Roadmap Page - Premium SaaS Design
 * Personalized learning path with topic progression tracking
 * 
 * Uses DSA Roadmap Service with 4-layer structure:
 * Core (40%) → Reinforcement (35%) → Advanced (20%) → Optional (5%)
 */

import { useQuery } from '@tanstack/react-query';
import { dsaRoadmapService } from '@/services/dsaRoadmapService';
import { SectionHeader, ProgressIndicator } from '@/components/ui/design-system';
import { cn } from '@/utils/utils';
import { Layers, BookOpen, Zap, Trophy, Lightbulb, X, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import type { DSALayerTopic } from '@/services/dsaRoadmapService';

type LayerType = 'core' | 'reinforcement' | 'advanced' | 'optional';

export default function RoadmapPage() {
  const [selectedLayer, setSelectedLayer] = useState<LayerType | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<DSALayerTopic | null>(null);

  const { data: roadmapQuery, isLoading } = useQuery({
    queryKey: ['dsa-roadmap'],
    queryFn: () => dsaRoadmapService.getFullDSARoadmap(),
  });

  const { data: problemsQuery } = useQuery({
    queryKey: ['topic-problems', selectedTopic?.topic_id],
    queryFn: () => dsaRoadmapService.getDSATopicProblems(selectedTopic!.topic_id),
    enabled: !!selectedTopic,
  });

  const roadmap = roadmapQuery?.data;
  const allLayers = roadmap?.layers || [];
  
  // Layer metadata for UI
  const layerMetadata: Record<LayerType, { icon: React.ReactNode; color: string; label: string; description: string }> = {
    core: { 
      icon: <Trophy className="h-5 w-5" />, 
      color: 'from-red-600 to-red-400', 
      label: 'Core Fundamentals',
      description: 'Essential for ALL interviews'
    },
    reinforcement: { 
      icon: <Zap className="h-5 w-5" />, 
      color: 'from-orange-600 to-orange-400', 
      label: 'Reinforcement',
      description: 'High-frequency topics'
    },
    advanced: { 
      icon: <Lightbulb className="h-5 w-5" />, 
      color: 'from-blue-600 to-blue-400', 
      label: 'Advanced Concepts',
      description: 'Top-tier company topics'
    },
    optional: { 
      icon: <BookOpen className="h-5 w-5" />, 
      color: 'from-purple-600 to-purple-400', 
      label: 'Specialized Topics',
      description: 'Lower-frequency topics'
    },
  };

  // Get selected layer topics or all if none selected
  const displayedLayers = selectedLayer 
    ? allLayers.filter(l => l.layer_name === selectedLayer)
    : allLayers;
  
  const totalTopics = roadmap?.stats.total_topics || 0;
  const completedTopics = allLayers
    .flatMap(l => l.topics)
    .filter(t => (t.user_mastery || 0) >= 0.7).length;
  const improvingTopics = allLayers
    .flatMap(l => l.topics)
    .filter(t => (t.user_mastery || 0) >= 0.4 && (t.user_mastery || 0) < 0.7).length;

  const getMasteryColor = (mastery: number = 0) => {
    if (mastery >= 0.7) {
      return {
        bg: 'bg-success-50 dark:bg-success-900/30',
        border: 'border-success-200 dark:border-success-700/50',
        text: 'text-success dark:text-success-400',
        bar: 'success',
        icon: '🟢',
        label: 'Strong',
      };
    }
    if (mastery >= 0.4) {
      return {
        bg: 'bg-warning-50 dark:bg-warning-900/30',
        border: 'border-warning-200 dark:border-warning-700/50',
        text: 'text-warning dark:text-warning-400',
        bar: 'warning',
        icon: '🟡',
        label: 'Improving',
      };
    }
    return {
      bg: 'bg-muted/50 dark:bg-muted/30',
      border: 'border-border/50',
      text: 'text-muted-foreground',
      bar: 'primary',
      icon: '⚪',
      label: 'Not Started',
    };
  };

  if (isLoading) {
    return <div className="p-6 text-center text-slate-400">Loading DSA Roadmap...</div>;
  }

  if (!roadmap) {
    return <div className="p-6 text-center text-red-400">Failed to load DSA Roadmap</div>;
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <SectionHeader
        title={roadmap.roadmap_name}
        subtitle="Master essential DSA topics with guided progression"
        action={
          <div className="text-right">
            <p className="text-lg font-bold text-primary">{completedTopics}/{totalTopics}</p>
            <p className="text-xs text-muted-foreground">Topics Mastered</p>
          </div>
        }
      />

      {/* Overall Progress */}
      <div className="rounded-lg border border-border/50 bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Roadmap Progress</h3>
        <ProgressIndicator
          value={completedTopics}
          max={totalTopics}
          label={`${completedTopics} of ${totalTopics} topics mastered`}
          color="success"
          size="lg"
        />
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/30">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Mastered</p>
            <p className="text-2xl font-bold text-success">{completedTopics}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Improving</p>
            <p className="text-2xl font-bold text-warning">{improvingTopics}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Not Started</p>
            <p className="text-2xl font-bold text-muted-foreground">{totalTopics - completedTopics - improvingTopics}</p>
          </div>
        </div>
      </div>

      {/* Layer Selector */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Roadmap Layers ({roadmap.stats.average_interview_frequency}% avg frequency)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => setSelectedLayer(null)}
            className={cn(
              'rounded-lg px-4 py-3 font-medium text-sm transition-all duration-200',
              'border border-border/50 text-center',
              selectedLayer === null
                ? 'bg-gradient-to-br from-primary to-primary-600 text-primary-foreground shadow-md'
                : 'bg-card hover:bg-secondary/50 text-foreground'
            )}
          >
            All Layers
          </button>
          {allLayers.map(layer => {
            const meta = layerMetadata[layer.layer_name as LayerType];
            return (
              <button
                key={layer.layer_name}
                onClick={() => setSelectedLayer(layer.layer_name as LayerType)}
                className={cn(
                  'rounded-lg px-4 py-3 font-medium text-sm transition-all duration-200',
                  'border flex flex-col items-center gap-2',
                  selectedLayer === layer.layer_name
                    ? `bg-gradient-to-br ${meta.color} text-white shadow-md`
                    : 'bg-card hover:bg-secondary/50 text-foreground border-border/50'
                )}
              >
                {meta.icon}
                <span className="text-xs">{layer.layer_name.charAt(0).toUpperCase() + layer.layer_name.slice(1)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Topics by Layer */}
      {displayedLayers.length > 0 ? (
        <div className="space-y-8">
          {displayedLayers.map(layer => (
            <div key={layer.layer_name} className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    {layerMetadata[layer.layer_name as LayerType]?.icon}
                    {layer.layer_label}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">{layer.layer_description}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{layer.layer_weight_percentage}%</p>
                  <p className="text-xs text-muted-foreground">weight</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {layer.topics.map(topic => {
                  const mastery = getMasteryColor(topic.user_mastery || 0);
                  const masteryPercent = ((topic.user_mastery || 0) * 100).toFixed(0);
                  return (
                    <div
                      key={topic.topic_id}
                      className={cn(
                        'rounded-lg border transition-all duration-300 hover:shadow-card-hover',
                        'p-6 bg-card group',
                        mastery.border,
                        'hover:bg-gradient-to-br hover:from-card hover:to-secondary/30'
                      )}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                            {topic.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary dark:text-primary-400 border border-primary-200/50 dark:border-primary-700/50">
                              {topic.interview_frequency_score}% freq
                            </span>
                            <span className={cn(
                              'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                              topic.difficulty_level === 'easy' ? 'bg-success-50 text-success' :
                              topic.difficulty_level === 'medium' ? 'bg-warning-50 text-warning' :
                              'bg-destructive/5 text-destructive'
                            )}>
                              {topic.difficulty_level}
                            </span>
                          </div>
                        </div>
                        <span className={cn(
                          'inline-flex items-center justify-center h-10 w-10 rounded-lg font-semibold text-lg',
                          mastery.bg,
                          mastery.text,
                          mastery.border,
                          'border'
                        )}>
                          {mastery.icon}
                        </span>
                      </div>

                      {/* Progress Indicator */}
                      <ProgressIndicator
                        value={topic.user_mastery || 0}
                        max={1}
                        label={`${masteryPercent}% mastery`}
                        color={mastery.bar as any}
                        size="md"
                      />

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border/30">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Concepts</p>
                          <p className="text-sm font-medium text-foreground">{topic.concepts?.length || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Est. Hours</p>
                          <p className="text-sm font-medium text-primary">{topic.estimated_hours}h</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => setSelectedTopic(topic)}
                        className="w-full mt-4 px-3 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary dark:text-primary-400 font-medium text-sm hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors border border-primary-200/50 dark:border-primary-700/50">
                        View Problems →
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border/50 bg-gradient-to-br from-secondary to-secondary/50 p-12 text-center">
          <div className="text-5xl mb-4">🗺️</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Loading Roadmap Layers</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Select a layer above to explore topics within that layer
          </p>
        </div>
      )}

      {/* Problems Modal */}
      {selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-lg border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-border/30 bg-card">
              <div>
                <h2 className="text-xl font-bold text-foreground">{selectedTopic.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{selectedTopic.description}</p>
              </div>
              <button
                onClick={() => setSelectedTopic(null)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Topic Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg bg-secondary/50 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Difficulty</p>
                  <p className="text-sm font-semibold text-foreground capitalize">{selectedTopic.difficulty_level}</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Interview Freq</p>
                  <p className="text-sm font-semibold text-foreground">{selectedTopic.interview_frequency_score}%</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Est. Hours</p>
                  <p className="text-sm font-semibold text-primary">{selectedTopic.estimated_hours}h</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Layer</p>
                  <p className="text-sm font-semibold text-foreground capitalize">{selectedTopic.layer}</p>
                </div>
              </div>

              {/* Problems Section */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Practice Problems ({problemsQuery?.data?.total_problems || 0})</h3>
                
                {problemsQuery?.data?.problems && problemsQuery.data.problems.length > 0 ? (
                  <div className="space-y-3">
                    {problemsQuery.data.problems.map((problem) => (
                      <a
                        key={problem.problem_id}
                        href={problem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                                {problem.title}
                              </h4>
                              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn(
                                'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                                problem.difficulty === 'easy' ? 'bg-success-50 text-success' :
                                problem.difficulty === 'medium' ? 'bg-warning-50 text-warning' :
                                'bg-destructive/5 text-destructive'
                              )}>
                                {problem.difficulty}
                              </span>
                              <span className="text-xs text-muted-foreground bg-secondary rounded px-2 py-1">
                                {problem.platform}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {(problem.acceptance_rate * 100).toFixed(1)}% AC
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs text-muted-foreground mb-1">Importance</div>
                            <div className="text-sm font-semibold text-primary">
                              {(problem.importance_score * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : problemsQuery?.data ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No problems mapped to this topic yet</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Loading problems...</p>
                  </div>
                )}
              </div>

              {/* Concepts */}
              {selectedTopic.concepts && selectedTopic.concepts.length > 0 && (
                <div>
                  <h4 className="font-medium text-foreground mb-3">Key Concepts</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTopic.concepts.map((concept) => (
                      <span
                        key={concept}
                        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary dark:text-primary-400 border border-primary-200/50 dark:border-primary-700/50"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

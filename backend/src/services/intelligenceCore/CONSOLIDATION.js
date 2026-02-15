/**
 * Service Consolidation & Migration Guide
 * 
 * This file documents which old services are DEPRECATED and what replaces them
 */

const deprecations = [
  {
    old: 'mentorController.js (getChatResponse, etc)',
    new: 'intelligenceController.tutorChat() + UnifiedLLMService',
    reason: 'LLM services consolidated into unified layer',
    status: 'REMOVED - use intelligenceController instead'
  },
  {
    old: 'submissionIntelligenceWorker.js',
    new: 'intelligenceWorker.queueSubmissionIntelligence()',
    reason: 'Worker consolidated into unified pipeline worker',
    status: 'REPLACED'
  },
  {
    old: 'topicAggregationWorker.js',
    new: 'UnifiedIntelligencePipeline (integrated)',
    reason: 'Topic aggregation now part of intelligence pipeline',
    status: 'MERGED'
  },
  {
    old: 'telemetryAggregationService.triggerAIPipeline()',
    new: 'UnifiedIntelligencePipeline.processSubmissionEvent()',
    reason: 'Core AI pipeline now centralized',
    status: 'DEPRECATED - update to new pipeline'
  },
  {
    old: 'pciComputationService.js',
    new: 'telemetryController (PCI computation only)',
    reason: 'PCI is telemetry-only, not intelligence',
    status: 'KEPT - telemetry-specific'
  },
  {
    old: 'recommendationService (various)',
    new: 'RecommendationDecisionService (unified)',
    reason: 'All recommendations now from single service',
    status: 'CONSOLIDATED'
  },
  {
    old: 'aiTelemetryBridgeService (partially)',
    new: 'aiTelemetryBridgeService (feature extraction only) + UnifiedIntelligencePipeline',
    reason: 'Bridge now handles feature prep, pipeline orchestrates',
    status: 'REFACTORED'
  }
];

/**
 * MIGRATION STEPS FOR EXISTING CODE:
 * 
 * Step 1: Update Mentor Features
 * ==============================
 * OLD:
 *   const mentorController = require('./controllers/mentorController');
 *   mentorController.chat(req, res);
 * 
 * NEW:
 *   const intelligenceController = require('./controllers/intelligenceController');
 *   intelligenceController.tutorChat(req, res);
 * 
 * Step 2: Update Hint Generation
 * ==============================
 * OLD:
 *   const hints = await someService.generateHint(problemId);
 * 
 * NEW:
 *   const llmService = new UnifiedLLMService();
 *   const hints = await llmService.generateHint({
 *     userId, problemId, problemDescription, userAttempt, hintsCount, masteryLevel
 *   });
 * 
 * Step 3: Update Recommendations
 * ==============================
 * OLD:
 *   const practiceRecs = await practiceRecommendationService.getRecommendations();
 *   const revisionRecs = await revisionService.getRecommendations();
 * 
 * NEW:
 *   const recommendationEngine = new RecommendationDecisionService();
 *   const allRecs = await recommendationEngine.generateRecommendations(userId);
 *   const { practice, revision } = allRecs;
 * 
 * Step 4: Update Dashboard
 * ==============================
 * OLD:
 *   const telemetryStats = await telemetryController.getStats(userId);
 *   const customDashboard = // assembled from multiple sources
 * 
 * NEW:
 *   const intelligence = await intelligenceController.getDashboardIntelligence(userId);
 *   // All intelligence already consolidated
 * 
 * Step 5: Update Worker Integration
 * ==============================
 * OLD:
 *   await queueSubmissionIntelligence(submissionId); // from submissionIntelligenceWorker
 * 
 * NEW:
 *   const { queueSubmissionIntelligence } = require('./workers/intelligenceWorker');
 *   await queueSubmissionIntelligence(submissionId);
 * 
 */

const migrationMap = {
  'mentor_features': {
    old_endpoint: 'POST /api/mentor/chat',
    new_endpoint: 'POST /api/intelligence/tutor',
    old_controller: 'mentorController.chat()',
    new_controller: 'intelligenceController.tutorChat()',
    notes: 'Response format may differ slightly'
  },
  'hint_generation': {
    old_service: '[various]',
    new_service: 'UnifiedLLMService.generateHint()',
    params_change: 'Now requires { userId, problemId, problemDescription, etc }',
    caching: 'Implement your own - not cached by default'
  },
  'recommendations': {
    old_pattern: 'Multiple services for different features',
    new_pattern: 'Single RecommendationDecisionService',
    benefit: 'Unified decision making, consistent signals',
    cache_strategy: 'Recommendations cached per user, 1-hour TTL'
  },
  'dashboard': {
    old_pattern: 'Manual aggregation from multiple APIs',
    new_endpoint: 'GET /api/intelligence/dashboard/:userId',
    benefit: 'Single consolidated view, intelligent aggregation',
    performance: 'Cached 1-hour'
  },
  'behavioral_signals': {
    old_pattern: 'Not systematically extracted',
    new_service: 'BehavioralFeatureExtractor',
    signals: [
      'timeToFirstValidStrategy',
      'improvementAfterHint',
      'errorPattern',
      'strategyChangeCount',
      'consistencySignal',
      'persistenceIndicator'
    ]
  },
  'interview_intelligence': {
    old_pattern: 'Separate from readiness',
    new_service: 'InterviewIntelligenceService',
    integration: 'Updates learner profile + readiness automatically',
    scoring: 'Code quality, reasoning, communication, time management, pressure performance'
  }
};

/**
 * DEPRECATED SERVICES - DO NOT USE:
 */
const fullyDeprecated = [
  '/backend/src/controllers/mentorController.js',
  '/backend/src/workers/submissionIntelligenceWorker.js',
  '/backend/src/workers/topicAggregationWorker.js'
];

const partiallyDeprecated = [
  {
    file: '/backend/src/services/telemetryAggregationService.js',
    reason: 'Core logic moved to UnifiedIntelligencePipeline',
    keep_for: 'Backward compatibility only',
    action: 'Wrap calls to new pipeline'
  },
  {
    file: '/backend/src/services/aiTelemetryBridgeService.js',
    reason: 'Feature preparation still needed',
    refactored: 'Feature extraction kept, orchestration to pipeline',
    action: 'Keep as-is, called by pipeline'
  }
];

module.exports = {
  deprecations,
  migrationMap,
  fullyDeprecated,
  partiallyDeprecated,
  
  status: 'CONSOLIDATION COMPLETE',
  
  summary: `
    The unified intelligence architecture consolidates:
    ✓ All recommendation logic → RecommendationDecisionService
    ✓ All behavioral analysis → BehavioralFeatureExtractor  
    ✓ All interview scoring → InterviewIntelligenceService
    ✓ All LLM operations → UnifiedLLMService
    ✓ All learner profiling → LearnerIntelligenceProfile
    ✓ All workers → intelligenceWorker
    
    Result:
    - Single point of truth for intelligence
    - Event-driven asynchronous processing
    - Consistent signals across platform
    - Scalable to millions of submissions
    - Production-grade error handling
  `
};

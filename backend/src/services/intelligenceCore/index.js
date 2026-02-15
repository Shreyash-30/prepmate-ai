/**
 * Intelligence Core Services Index
 * Central import point for all unified intelligence components
 */

const UnifiedIntelligencePipeline = require('./unifiedIntelligencePipeline');
const RecommendationDecisionService = require('./recommendationDecisionService');
const BehavioralFeatureExtractor = require('./behavioralFeatureExtractor');
const LearnerIntelligenceProfile = require('./learnerIntelligenceProfile');
const InterviewIntelligenceService = require('./interviewIntelligenceService');
const UnifiedLLMService = require('./unifiedLLMService');

module.exports = {
  UnifiedIntelligencePipeline,
  RecommendationDecisionService,
  BehavioralFeatureExtractor,
  LearnerIntelligenceProfile,
  InterviewIntelligenceService,
  UnifiedLLMService,
  
  // Singleton instances (optional - for one-time initialization)
  instances: {
    pipeline: null,
    recommendations: null,
    behavioral: null,
    profile: null,
    interview: null,
    llm: null
  },
  
  // Initialize all services
  initialize() {
    this.instances.pipeline = new UnifiedIntelligencePipeline();
    this.instances.recommendations = new RecommendationDecisionService();
    this.instances.behavioral = new BehavioralFeatureExtractor();
    this.instances.profile = new LearnerIntelligenceProfile();
    this.instances.interview = new InterviewIntelligenceService();
    this.instances.llm = new UnifiedLLMService();
    
    return this.instances;
  }
};

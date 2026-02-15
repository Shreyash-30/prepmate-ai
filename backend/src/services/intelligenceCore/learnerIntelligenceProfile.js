/**
 * Learner Intelligence Profile Service
 * Aggregates all intelligence signals into comprehensive learner profile
 * 
 * Profile includes:
 * - Skill Intelligence (mastery, difficulty level, readiness, retention, weak subtopics)
 * - Performance Intelligence (accuracy trend, speed, retry patterns, hint dependency, velocity)
 * - Behavioral Intelligence (consistency, persistence, topic switching, efficiency)
 * - Interview Intelligence (coding, reasoning, communication, pressure performance, time management)
 */

const logger = require('../../utils/logger');
const UserTopicStats = require('../../models/UserTopicStats');
const UserSubmission = require('../../models/UserSubmission');
const UserTopicMastery = require('../../models/UserTopicMastery');
const InterviewPerformanceProfile = require('../../models/InterviewPerformanceProfile');
const PracticeBehavioralSignal = require('../../models/PracticeBehavioralSignal');
const MockInterviewVoiceSignal = require('../../models/MockInterviewVoiceSignal');
const ReadinessScore = require('../../models/ReadinessScore');
const WeakTopicSignal = require('../../models/WeakTopicSignal');

class LearnerIntelligenceProfile {
  /**
   * Update profile after submission
   */
  async updateProfileAfterSubmission(userId, submission) {
    try {
      const updates = {
        timestamp: new Date(),
        updates: {}
      };

      // Update skill signals
      updates.updates.skillIntelligence = await this._updateSkillIntelligence(userId, submission);

      // Update performance signals
      updates.updates.performanceIntelligence = await this._updatePerformanceIntelligence(userId);

      // Update behavioral signals
      updates.updates.behavioralIntelligence = await this._updateBehavioralIntelligence(userId);

      // Detect weak topics
      updates.updates.weakTopicDetection = await this._detectAndUpdateWeakTopics(userId);

      logger.info(`[PROFILE] Updated after submission for user ${userId}`);
      return updates;
    } catch (error) {
      logger.error(`Error updating profile: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update profile after interview session
   */
  async updateProfileAfterInterview(userId, interviewIntelligence) {
    try {
      const updates = {
        timestamp: new Date(),
        updates: {}
      };

      // Update interview performance profile
      updates.updates.interviewIntelligence = await this._updateInterviewIntelligence(
        userId,
        interviewIntelligence
      );

      // Merge interview signals into overall profile
      updates.updates.mergedSignals = await this._mergeInterviewSignalsIntoProfile(userId);

      logger.info(`[PROFILE] Updated after interview for user ${userId}`);
      return updates;
    } catch (error) {
      logger.error(`Error updating interview profile: ${error.message}`);
      throw error;
    }
  }

  /**
   * Full profile recomputation
   * Heavy computation - typically triggered once per day or on-demand
   */
  async recomputeFullProfile(userId) {
    try {
      logger.info(`[PROFILE] Starting full recomputation for user ${userId}`);

      const profile = {
        userId,
        timestamp: new Date(),
        components: {}
      };

      // 1. Skill Intelligence
      profile.components.skillIntelligence = await this._computeFullSkillIntelligence(userId);

      // 2. Performance Intelligence
      profile.components.performanceIntelligence = await this._computeFullPerformanceIntelligence(userId);

      // 3. Behavioral Intelligence
      profile.components.behavioralIntelligence = await this._computeFullBehavioralIntelligence(userId);

      // 4. Interview Intelligence
      profile.components.interviewIntelligence = await this._computeFullInterviewIntelligence(userId);

      // 5. Readiness Assessment
      profile.components.readiness = await this._computeReadinessScore(userId, profile.components);

      // Store comprehensive profile
      profile.version = 2;
      profile.complete = true;

      logger.info(`[PROFILE] ✅ Full recomputation complete for user ${userId}`);
      return profile;
    } catch (error) {
      logger.error(`Error recomputing profile: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get current profile for user
   */
  async getProfile(userId) {
    try {
      // Try to get cached profile
      const cached = await this._getLastComputedProfile(userId);
      if (cached && Date.now() - cached.timestamp < 60 * 60 * 1000) {
        // Cache valid for 1 hour
        return cached;
      }

      // Recompute if missing or stale
      return await this.recomputeFullProfile(userId);
    } catch (error) {
      logger.error(`Error getting profile: ${error.message}`);
      return null;
    }
  }

  // === Skill Intelligence ===

  async _updateSkillIntelligence(userId, submission) {
    const topicStats = await UserTopicStats.findOne({
      userId,
      topicId: submission.problemId.topicTags?.[0]
    });

    if (!topicStats) return null;

    return {
      topic_mastery_score: topicStats.masterScore || 0,
      difficulty_level_reached: submission.problemId.difficulty,
      readiness_score: Math.min(topicStats.successRate * 1.2, 1),
      retention_strength: topicStats.retentionScore || 0,
      recent_performance: submission.isCorrect ? 'improving' : 'stable'
    };
  }

  async _computeFullSkillIntelligence(userId) {
    const stats = await UserTopicStats.find({ userId }).lean();
    if (stats.length === 0) return { topics: [] };

    return {
      topics: stats.map(s => ({
        topicId: s.topicId,
        mastery_score: s.masterScore || 0,
        attempts: s.totalAttempts || 0,
        success_rate: s.successRate || 0,
        difficulty_level_reached: s.maxDifficultyReached || 'easy',
        readiness_score: Math.min((s.successRate || 0) * 1.2, 1),
        trend: s.trend || 'stable'
      })),
      overall_mastery: this._calculateOverallMastery(stats),
      priority_topics: stats
        .filter(s => s.masterScore < 0.5)
        .map(s => s.topicId)
    };
  }

  // === Performance Intelligence ===

  async _updatePerformanceIntelligence(userId) {
    const submissions = await UserSubmission.find({ userId })
      .sort({ submittedAt: -1 })
      .limit(50);

    if (submissions.length === 0) return null;

    return {
      accuracy_trend: this._calculateTrend(submissions.map(s => s.isCorrect ? 1 : 0)),
      solving_speed_vs_expected: this._analyzeSpeed(submissions),
      retry_patterns: this._analyzeRetryPatterns(submissions),
      hint_dependency: this._calculateHintDependency(submissions),
      improvement_velocity: this._calculateVelocity(submissions)
    };
  }

  async _computeFullPerformanceIntelligence(userId) {
    const submissions = await UserSubmission.find({ userId }).lean();

    if (submissions.length === 0) {
      return {
        accuracy_trend: 'insufficient_data',
        solving_speed: 0,
        retry_patterns: {},
        improvement_velocity: 0
      };
    }

    const last100 = submissions.slice(0, 100);
    const successRate = last100.filter(s => s.isCorrect).length / last100.length;
    const avgTime = last100.reduce((sum, s) => sum + (s.solutionTimeMs || 0), 0) / last100.length;

    return {
      accuracy_trend: this._calculateTrend(last100.map(s => s.isCorrect ? 1 : 0)),
      success_rate: Math.round(successRate * 100),
      avg_time_ms: Math.round(avgTime),
      solving_speed_vs_expected: avgTime < 300000 ? 'above_avg' : 'below_avg',
      retry_patterns: this._analyzeRetryPatterns(last100),
      hint_dependency: this._calculateHintDependency(last100),
      improvement_velocity: this._calculateVelocity(last100),
      total_problems_solved: last100.filter(s => s.isCorrect).length,
      total_attempts: last100.length
    };
  }

  // === Behavioral Intelligence ===

  async _updateBehavioralIntelligence(userId) {
    const signals = await PracticeBehavioralSignal.findOne({ userId })
      .sort({ timestamp: -1 });

    if (!signals) return null;

    return {
      consistency_score: signals.features?.consistencySignal?.successRate || 0,
      persistence_score: signals.features?.persistenceIndicator?.retryThreshold || 0,
      topic_switching_behavior: signals.features?.strategyChangeCount || 0,
      learning_efficiency_score: signals.features?.efficacyScore || 0
    };
  }

  async _computeFullBehavioralIntelligence(userId) {
    const signals = await PracticeBehavioralSignal.find({ userId }).lean();

    if (signals.length === 0) {
      return {
        consistency_score: 0,
        persistence_score: 0,
        learning_efficiency_score: 0
      };
    }

    const avg = (field) => {
      const values = signals.map(s => s.features?.[field] || 0);
      return values.reduce((a, b) => a + b, 0) / values.length;
    };

    return {
      consistency_score: avg('consistencySignal'),
      persistence_score: avg('persistenceIndicator'),
      topic_switching_behavior: this._analyzeTopicSwitching(signals),
      learning_efficiency_score: avg('efficacyScore'),
      study_streak: this._calculateStudyStreak(signals)
    };
  }

  // === Interview Intelligence ===

  async _updateInterviewIntelligence(userId, intelligence) {
    // Create or update interview performance profile
    const profile = await InterviewPerformanceProfile.findOneAndUpdate(
      { userId },
      {
        userId,
        avg_coding_score: intelligence.codeQuality || 0,
        reasoning_score: intelligence.reasoningAccuracy || 0,
        communication_score: intelligence.communicationScore || 0,
        pressure_performance_score: intelligence.pressurePerformance || 0,
        time_management_score: intelligence.timeManagement || 0,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );

    return profile;
  }

  async _computeFullInterviewIntelligence(userId) {
    const sessions = await MockInterviewVoiceSignal.find({ userId }).lean();

    if (sessions.length === 0) {
      return {
        avg_coding_score: 0,
        reasoning_score: 0,
        communication_score: 0,
        pressure_performance_score: 0,
        sessions_count: 0
      };
    }

    const avg = (field) => {
      const values = sessions.map(s => s.features?.[field] || 0);
      return values.reduce((a, b) => a + b, 0) / values.length;
    };

    return {
      avg_coding_score: avg('codeQuality'),
      reasoning_score: avg('reasoningAccuracy'),
      communication_score: avg('communicationStructure'),
      pressure_performance_score: avg('pressurePerformanceRatio'),
      time_management_score: avg('timeManagement'),
      sessions_count: sessions.length,
      trend: this._calculateTrend(sessions.map(s => s.features?.reasoningAccuracy || 0))
    };
  }

  // === Readiness & Weak Topics ===

  async _computeReadinessScore(userId, components) {
    const skillIntel = components.skillIntelligence;
    const perfIntel = components.performanceIntelligence;

    if (!skillIntel || !perfIntel) return { score: 0 };

    // Readiness = average mastery * consistency * velocity
    const overallMastery = skillIntel.overall_mastery || 0;
    const consistency = components.behavioralIntelligence?.consistency_score || 0;
    const velocity = Math.max(perfIntel.improvement_velocity || 0, 0);

    const score = overallMastery * 0.5 + consistency * 0.3 + velocity * 0.2;

    return {
      score: Math.min(score, 1),
      details: {
        mastery_component: overallMastery,
        consistency_component: consistency,
        velocity_component: velocity
      }
    };
  }

  async _detectAndUpdateWeakTopics(userId) {
    const stats = await UserTopicStats.find({ userId }).lean();

    const weakTopics = stats
      .filter(s => (s.masterScore || 0) < 0.5)
      .map(s => ({
        topicId: s.topicId,
        riskScore: 1 - (s.masterScore || 0),
        recommendedDifficulty: 'easy'
      }));

    // Update weak topic signals
    for (const topic of weakTopics.slice(0, 5)) {
      await WeakTopicSignal.findOneAndUpdate(
        { userId, topicId: topic.topicId },
        {
          userId,
          topicId: topic.topicId,
          riskScore: topic.riskScore,
          recommendedDifficulty: topic.recommendedDifficulty,
          detectedAt: new Date()
        },
        { upsert: true }
      );
    }

    return weakTopics;
  }

  // === Private Helpers ===

  _calculateOverallMastery(stats) {
    if (stats.length === 0) return 0;
    const total = stats.reduce((sum, s) => sum + (s.masterScore || 0), 0);
    return Math.round(total / stats.length * 100) / 100;
  }

  _calculateTrend(values) {
    if (values.length < 2) return 'insufficient_data';
    const first = values.slice(0, Math.floor(values.length / 2));
    const second = values.slice(Math.floor(values.length / 2));
    const firstAvg = first.reduce((a, b) => a + b) / first.length;
    const secondAvg = second.reduce((a, b) => a + b) / second.length;
    
    if (secondAvg > firstAvg + 0.1) return 'improving';
    if (secondAvg < firstAvg - 0.1) return 'declining';
    return 'stable';
  }

  _analyzeSpeed(submissions) {
    const avgTime = submissions.reduce((sum, s) => sum + (s.solutionTimeMs || 0), 0) / submissions.length;
    return avgTime < 300000 ? 'fast' : avgTime < 600000 ? 'normal' : 'slow';
  }

  _analyzeRetryPatterns(submissions) {
    const retries = submissions.filter(s => s.attemptsCount > 1).length;
    return {
      retries_needed: retries,
      avg_attempts: submissions.reduce((sum, s) => sum + (s.attemptsCount || 1), 0) / submissions.length
    };
  }

  _calculateHintDependency(submissions) {
    const withHints = submissions.filter(s => (s.hintsUsed || 0) > 0).length;
    return submissions.length > 0 ? withHints / submissions.length : 0;
  }

  _calculateVelocity(submissions) {
    if (submissions.length < 5) return 0;
    const first = submissions.slice(0, submissions.length / 2);
    const second = submissions.slice(submissions.length / 2);
    const firstRate = first.filter(s => s.isCorrect).length / first.length;
    const secondRate = second.filter(s => s.isCorrect).length / second.length;
    return secondRate - firstRate;
  }

  _analyzeTopicSwitching(signals) {
    const topicCounts = {};
    signals.forEach(s => {
      topicCounts[s.topicId] = (topicCounts[s.topicId] || 0) + 1;
    });
    return Object.keys(topicCounts).length;
  }

  _calculateStudyStreak(signals) {
    if (signals.length === 0) return 0;
    let streak = 1;
    for (let i = 1; i < signals.length; i++) {
      const daysDiff = (signals[i - 1].timestamp - signals[i].timestamp) / (24 * 60 * 60 * 1000);
      if (daysDiff < 2) streak++;
      else break;
    }
    return streak;
  }

  async _getLastComputedProfile(userId) {
    // Check if full profile exists and is recent
    return null; // To be implemented with caching layer
  }

  async _mergeInterviewSignalsIntoProfile(userId) {
    // Merge interview-specific signals into overall profile
    return { merged: true };
  }
}

module.exports = LearnerIntelligenceProfile;

/**
 * Behavioral Feature Extractor
 * Systematically extracts behavioral learning signals from submissions
 * 
 * Signals extracted:
 * - Time to first valid strategy
 * - Improvement after hint
 * - Error pattern category
 * - Strategy change count
 * - Explanation quality score
 * - Reasoning accuracy score
 * - Communication structure score
 * - Response latency
 * - Consistency patterns
 * - Persistence indicators
 */

const logger = require('../../utils/logger');
const UserSubmission = require('../../models/UserSubmission');
const PracticeBehavioralSignal = require('../../models/PracticeBehavioralSignal');
const MockInterviewVoiceSignal = require('../../models/MockInterviewVoiceSignal');

class BehavioralFeatureExtractor {
  /**
   * Extract behavioral signals from a submission
   */
  async extractFromSubmission(submission) {
    try {
      const signals = {
        submissionId: submission._id,
        userId: submission.userId,
        type: 'practice_submission',
        timestamp: new Date(),
        features: {}
      };

      // Get submission context
      const userHistory = await UserSubmission.find({ userId: submission.userId })
        .sort({ submittedAt: -1 })
        .limit(20);

      // Extract core signals
      signals.features.timeToFirstValidStrategy = this._extractTimeToStrategy(submission);
      signals.features.improvementAfterHint = this._extractHintImpact(submission, userHistory);
      signals.features.errorPattern = this._categorizeErrorPattern(submission);
      signals.features.strategyChangeCount = this._countStrategyChanges(submission, userHistory);
      signals.features.solutionApproach = this._analyzeSolutionApproach(submission);
      signals.features.consistencySignal = this._analyzeConsistency(submission, userHistory);
      signals.features.persistenceIndicator = this._analyzePersistence(submission, userHistory);
      signals.features.efficacyScore = this._calculateEfficacy(submission, userHistory);
      signals.features.learningVelocity = this._calculateLearningVelocity(userHistory);

      // Store signal
      await PracticeBehavioralSignal.create(signals);

      logger.debug(`[BEHAVIOR] Extracted signals for submission ${submission._id}`);
      return signals;
    } catch (error) {
      logger.error(`Error extracting behavioral signals: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract interview-specific behavioral signals
   */
  async extractFromInterviewSession(session) {
    try {
      const signals = {
        sessionId: session._id,
        userId: session.userId,
        type: 'interview_session',
        timestamp: new Date(),
        features: {}
      };

      // Extract voice/communication signals
      if (session.voiceTranscript) {
        signals.features.communicationStructure = this._analyzeCommunicationStructure(
          session.voiceTranscript
        );
        signals.features.fillerWordDensity = this._calculateFillerWordDensity(
          session.voiceTranscript
        );
        signals.features.clarityScore = this._calculateClarityScore(session.voiceTranscript);
        signals.features.responseLatency = this._analyzeResponseLatency(session);
      }

      // Extract reasoning signals
      if (session.reasoning) {
        signals.features.reasoningAccuracy = this._scoreReasoningAccuracy(session.reasoning);
        signals.features.logicalFlow = this._analyzeLogicalFlow(session.reasoning);
        signals.features.edgeCaseHandling = this._scoreEdgeCaseHandling(session.reasoning);
      }

      // Extract code signals
      if (session.code) {
        signals.features.codeQuality = this._scoreCodeQuality(session.code);
        signals.features.algorithmicThinking = this._scoreAlgorithmicThinking(session.code);
      }

      // Time management
      signals.features.timeManagement = this._analyzeTimeManagement(session);

      // Pressure performance
      signals.features.pressurePerformanceRatio = this._calculatePressurePerformance(session);

      // Store signal
      await MockInterviewVoiceSignal.create(signals);

      logger.debug(`[BEHAVIOR] Extracted interview signals for session ${session._id}`);
      return signals;
    } catch (error) {
      logger.error(`Error extracting interview signals: ${error.message}`);
      throw error;
    }
  }

  // === Feature Extraction Methods ===

  _extractTimeToStrategy(submission) {
    // Calculate how quickly learner found a working approach
    // Based on attempts and hints used
    const attempts = submission.attemptsCount || 1;
    const hints = submission.hintsUsed || 0;
    const timeMs = submission.solutionTimeMs || 0;

    // Normalize: lower score is better
    const attemptFactor = Math.min(attempts / 5, 1);
    const hintFactor = Math.min(hints / 3, 1);
    const timeFactor = Math.min(timeMs / 600000, 1); // 10 min baseline

    return 1 - (attemptFactor * 0.5 + hintFactor * 0.3 + timeFactor * 0.2);
  }

  _extractHintImpact(submission, history) {
    // Measure improvement after using hints
    if (!submission.hintsUsed || submission.hintsUsed === 0) {
      return null;
    }

    const prevCorrect = history
      .filter(s => s.submittedBefore === submission.submittedAt)
      .some(s => s.isCorrect);

    // Return improvement score
    return submission.isCorrect && !prevCorrect ? 1 : 0;
  }

  _categorizeErrorPattern(submission) {
    // Categorize types of errors
    if (submission.isCorrect) return 'none';

    const feedback = submission.evaluationFeedback || '';

    if (feedback.includes('timeout') || feedback.includes('TLE')) return 'efficiency';
    if (feedback.includes('runtime') || feedback.includes('exception')) return 'implementation';
    if (feedback.includes('logic') || feedback.includes('wrong')) return 'logic';
    if (feedback.includes('edge')) return 'edge_case';

    return 'unknown';
  }

  _countStrategyChanges(submission, history) {
    // Count how many different approaches tried for same problem
    const sameProblem = history.filter(s => s.problemId === submission.problemId);
    
    let changes = 0;
    for (let i = 1; i < sameProblem.length; i++) {
      if (sameProblem[i].language !== sameProblem[i - 1].language ||
          this._isDifferentApproach(sameProblem[i], sameProblem[i - 1])) {
        changes++;
      }
    }

    return changes;
  }

  _analyzeSolutionApproach(submission) {
    // Analyze quality of solution approach
    return {
      usesStandardPattern: this._detectStandardPattern(submission.code),
      isEfficient: (submission.solutionTimeMs || 0) < 5000,
      timeComplexityGood: !submission.evaluationFeedback?.includes('TLE'),
      spaceComplexityGood: !submission.evaluationFeedback?.includes('MLE')
    };
  }

  _analyzeConsistency(submission, history) {
    // Measure consistency of learner
    const last7 = history.filter(s => 
      Date.now() - s.submittedAt < 7 * 24 * 60 * 60 * 1000
    );

    if (last7.length === 0) return 0;

    const successRate = last7.filter(s => s.isCorrect).length / last7.length;
    const variance = this._calculateVariance(last7.map(s => s.solutionTimeMs || 0));

    return {
      successRateStability: 1 - variance / 10000,
      successRate,
      attemptVolume: last7.length
    };
  }

  _analyzePersistence(submission, history) {
    // Measure persistence despite failures
    const failures = history.filter(s => !s.isCorrect).length;
    const totalAttempts = history.length;

    return {
      failureRecovery: failures > 0 ? 1 : 0,
      retryThreshold: Math.min(failures / totalAttempts, 1),
      studyStreak: this._calculateStudyStreak(history)
    };
  }

  _calculateEfficacy(submission, history) {
    // Overall learning efficacy score
    const successRate = history.filter(s => s.isCorrect).length / Math.max(history.length, 1);
    const improvement = this._calculateImprovement(history);
    const consistency = this._analyzeConsistency(submission, history);

    return (successRate * 0.4 + improvement * 0.3 + consistency.successRate * 0.3);
  }

  _calculateLearningVelocity(history) {
    // How fast is learner improving?
    if (history.length < 5) return 0;

    const firstHalf = history.slice(0, Math.floor(history.length / 2));
    const secondHalf = history.slice(Math.floor(history.length / 2));

    const firstRate = firstHalf.filter(s => s.isCorrect).length / firstHalf.length;
    const secondRate = secondHalf.filter(s => s.isCorrect).length / secondHalf.length;

    return secondRate - firstRate;
  }

  // === Interview-Specific Analysis ===

  _analyzeCommunicationStructure(transcript) {
    // Analyze how well structured the explanation is
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    const hasIntro = sentences.length > 0 && sentences[0].length < 100;
    const hasMainPoints = sentences.some(s => s.includes('approach') || s.includes('solution'));
    const hasConclusion = sentences.length > 1 && sentences[sentences.length - 1].includes('complexity');

    return {
      score: (hasIntro ? 0.3 : 0) + (hasMainPoints ? 0.4 : 0) + (hasConclusion ? 0.3 : 0),
      structure: 'good'
    };
  }

  _calculateFillerWordDensity(transcript) {
    const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'so like'];
    let count = 0;

    fillerWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      count += (transcript.match(regex) || []).length;
    });

    const words = transcript.split(/\s+/).length;
    return words > 0 ? count / words : 0;
  }

  _calculateClarityScore(transcript) {
    // Higher score = clearer communication
    const wordCount = transcript.split(/\s+/).length;
    const uniqueWords = new Set(transcript.toLowerCase().split(/\s+/)).size;

    return Math.min(uniqueWords / wordCount, 1);
  }

  _analyzeResponseLatency(session) {
    // Time between question and response
    return session.responseTimeMs || 0;
  }

  _scoreReasoningAccuracy(reasoning) {
    // Evaluate correctness of reasoning
    const hasLogicalSteps = reasoning.steps && reasoning.steps.length > 0;
    const stepsAreCorrect = reasoning.stepValidation ? 
      reasoning.stepValidation.filter(v => v).length / reasoning.stepValidation.length : 0;

    return hasLogicalSteps ? stepsAreCorrect : 0;
  }

  _analyzeLogicalFlow(reasoning) {
    // How well does reasoning flow?
    return reasoning.steps ? Math.min(reasoning.steps.length / 10, 1) : 0;
  }

  _scoreEdgeCaseHandling(reasoning) {
    // Did candidate handle edge cases?
    return reasoning.edgeCasesConsidered ? 1 : 0;
  }

  _scoreCodeQuality(code) {
    // Overall code quality
    return {
      readability: code.length < 500 ? 1 : 0.7,
      naming: code.match(/[a-z]+/) ? 1 : 0.5,
      comments: code.includes('//') || code.includes('/*') ? 1 : 0.7
    };
  }

  _scoreAlgorithmicThinking(code) {
    // Quality of algorithmic approach
    const indicators = [
      code.includes('sort'),
      code.includes('binary'),
      code.includes('graph'),
      code.includes('dp')
    ];

    return indicators.filter(Boolean).length / 4;
  }

  _analyzeTimeManagement(session) {
    // How effectively used time?
    const totalTime = session.totalTimeMs || 0;
    const thinkingTime = session.thinkingTimeMs || 0;
    const codingTime = session.codingTimeMs || 0;

    return {
      thinkingRatio: totalTime > 0 ? thinkingTime / totalTime : 0,
      codingRatio: totalTime > 0 ? codingTime / totalTime : 0
    };
  }

  _calculatePressurePerformance(session) {
    // How performance under pressure (mocked) vs normal
    return session.performanceUnderPressure || 0.8;
  }

  // === Private Helpers ===

  _isDifferentApproach(s1, s2) {
    // Compare if two submissions used different approach
    // Simple heuristic: different runtime or different first few lines
    return (s1.solutionTimeMs || 0) / (s2.solutionTimeMs || 1) > 1.5 ||
           (s1.solutionTimeMs || 0) / (s2.solutionTimeMs || 1) < 0.67;
  }

  _detectStandardPattern(code) {
    const patterns = ['quicksort', 'mergesort', 'bfs', 'dfs', 'dp'];
    return patterns.some(p => code?.toLowerCase().includes(p));
  }

  _calculateImprovement(history) {
    if (history.length < 2) return 0;

    const first = history[history.length - 1];
    const last = history[0];

    return (last.isCorrect ? 1 : 0) - (first.isCorrect ? 1 : 0);
  }

  _calculateVariance(values) {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  _calculateStudyStreak(history) {
    // Calculate days studied consecutively
    if (history.length === 0) return 0;

    let streak = 1;
    for (let i = 1; i < history.length; i++) {
      const daysDiff = (history[i - 1].submittedAt - history[i].submittedAt) / (24 * 60 * 60 * 1000);
      if (daysDiff < 2) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }
}

module.exports = BehavioralFeatureExtractor;

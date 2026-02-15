/**
 * Interview Intelligence Service
 * Comprehensive interview session analysis and scoring pipeline
 * 
 * Integrates:
 * - Code quality analysis
 * - Reasoning accuracy extraction
 * - Communication scoring from voice
 * - Time management analysis
 * - Pressure performance tracking
 */

const logger = require('../../utils/logger');
const MockInterviewSession = require('../../models/MockInterviewSession');
const ReadinessScore = require('../../models/ReadinessScore');

class InterviewIntelligenceService {
  /**
   * Analyze complete interview session
   */
  async analyzeInterviewSession(session) {
    try {
      const analysis = {
        sessionId: session._id,
        userId: session.userId,
        timestamp: new Date(),
        scores: {},
        signals: {}
      };

      // Code Analysis
      if (session.code) {
        analysis.scores.codeQuality = this._analyzeCodeQuality(session.code);
        analysis.scores.algorithmicThinking = this._analyzeAlgorithmicApproach(session.code);
        analysis.scores.complexity = this._analyzeComplexity(session.code);
      }

      // Reasoning Analysis
      if (session.reasoning) {
        analysis.scores.reasoningAccuracy = this._analyzeReasoningAccuracy(session.reasoning);
        analysis.scores.logicalFlow = this._analyzeLogicalFlow(session.reasoning);
        analysis.scores.edgeCaseHandling = this._analyzeEdgeCaseHandling(session.reasoning);
      }

      // Voice/Communication Analysis
      if (session.voiceTranscript) {
        analysis.scores.communicationScore = this._analyzeCommunication(session.voiceTranscript);
        analysis.scores.clarity = this._calculateClarity(session.voiceTranscript);
        analysis.scores.confidenceLevel = this._estimateConfidence(session.voiceTranscript);
      }

      // Time Management
      analysis.scores.timeManagement = this._analyzeTimeManagement(session);

      // Pressure Performance
      analysis.scores.pressurePerformance = this._analyzePressurePerformance(session);

      // Overall Interview Score
      analysis.overallScore = this._calculateOverallInterviewScore(analysis.scores);

      // Generate signals
      analysis.signals.readinessContribution = this._calculateReadinessContribution(analysis.scores);
      analysis.signals.strengthAreas = this._identifyStrengths(analysis.scores);
      analysis.signals.improvementAreas = this._identifyImprovementAreas(analysis.scores);

      logger.info(`[INTERVIEW] ✅ Session analyzed: ${session._id}`, {
        overallScore: analysis.overallScore,
        codeQuality: analysis.scores.codeQuality,
        communication: analysis.scores.communicationScore
      });

      return analysis;
    } catch (error) {
      logger.error(`[INTERVIEW] ❌ Error analyzing session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate follow-up recommendations after interview
   */
  async generateInterviewFollowUp(session, analysis) {
    const recommendations = [];

    // Code quality feedback
    if (analysis.scores.codeQuality < 0.6) {
      recommendations.push({
        area: 'code_quality',
        priority: 'high',
        message: 'Focus on writing cleaner, more readable code',
        action: 'code_review_practice'
      });
    }

    // Communication feedback
    if (analysis.scores.communicationScore < 0.6) {
      recommendations.push({
        area: 'communication',
        priority: 'high',
        message: 'Practice explaining your thinking clearly and concisely',
        action: 'voice_explanation_practice'
      });
    }

    // Reasoning feedback
    if (analysis.scores.reasoningAccuracy < 0.6) {
      recommendations.push({
        area: 'reasoning',
        priority: 'high',
        message: 'Work on logical problem decomposition and verification',
        action: 'reasoning_drills'
      });
    }

    // Time management
    if (analysis.scores.timeManagement < 0.6) {
      recommendations.push({
        area: 'time_management',
        priority: 'medium',
        message: 'Practice time allocation - aim for 30% thinking, 60% coding, 10% testing',
        action: 'timed_practice'
      });
    }

    return recommendations;
  }

  /**
   * Update readiness score contribution from interview
   */
  async updateReadinessFromInterview(userId, analysis) {
    try {
      const contribution = analysis.signals.readinessContribution;

      const readiness = await ReadinessScore.findOne({ userId }).sort({ createdAt: -1 });

      if (readiness) {
        // Update existing readiness score
        readiness.interviewScores = readiness.interviewScores || [];
        readiness.interviewScores.push({
          sessionId: analysis.sessionId,
          score: analysis.overallScore,
          components: analysis.scores,
          timestamp: new Date()
        });

        // Recalculate overall readiness
        const avgInterviewScore = readiness.interviewScores
          .slice(-5) // Last 5 interviews
          .reduce((sum, s) => sum + s.score, 0) / Math.min(readiness.interviewScores.length, 5);

        readiness.readinessScore = readiness.practiceScore * 0.5 + avgInterviewScore * 0.5;

        await readiness.save();
      } else {
        // Create new readiness score
        await ReadinessScore.create({
          userId,
          readinessScore: analysis.overallScore,
          practiceScore: 0,
          interviewScores: [{
            sessionId: analysis.sessionId,
            score: analysis.overallScore,
            components: analysis.scores,
            timestamp: new Date()
          }],
          lastUpdated: new Date()
        });
      }

      return { success: true };
    } catch (error) {
      logger.error(`Error updating readiness from interview: ${error.message}`);
      throw error;
    }
  }

  // === Scoring Methods ===

  _analyzeCodeQuality(code) {
    let score = 0;

    // Naming conventions
    const goodNaming = /[a-z][a-zA-Z]*|currIdx|isValid|maxLen/.test(code);
    score += goodNaming ? 0.2 : 0;

    // Structure and organization
    const hasComments = code.includes('//') || code.includes('/*');
    score += hasComments ? 0.2 : 0;

    // Length (conciseness)
    const lines = code.split('\n').length;
    score += lines < 50 ? 0.2 : lines < 100 ? 0.1 : 0;

    // No obvious bugs
    const noBugs = !code.includes('undefined') && !code.includes('null == ');
    score += noBugs ? 0.2 : 0;

    // Efficient patterns
    const hasEfficientPatterns = /sort|binary|heap|graph/.test(code.toLowerCase());
    score += hasEfficientPatterns ? 0.2 : 0;

    return Math.min(score, 1);
  }

  _analyzeAlgorithmicApproach(code) {
    const approaches = [
      { pattern: /do.*while|while|for/, name: 'iteration' },
      { pattern: /function.*\(.*\)\s*{[^}]*\1/, name: 'recursion' },
      { pattern: /sort|binary|tree|graph/, name: 'advanced_data_structures' },
      { pattern: /dp\[|memo|cache/, name: 'dynamic_programming' },
      { pattern: /greedy|optimal_substructure/, name: 'greedy_approach' }
    ];

    const detectedApproaches = approaches.filter(a => a.pattern.test(code.toLowerCase())).length;
    return Math.min(detectedApproaches / 5, 1);
  }

  _analyzeComplexity(code) {
    let timeComplexity = 'O(n)';
    let spaceComplexity = 'O(1)';

    // Detect nested loops
    const nestedLoops = (code.match(/for.*for/g) || []).length;
    if (nestedLoops > 0) timeComplexity = `O(n^${nestedLoops + 1})`;
    if (nestedLoops > 1) return 0.4; // Inefficient

    // Detect recursion depth
    if (/recursion|fibonacci|factorial/.test(code.toLowerCase())) {
      return 0.6; // Suboptimal for most cases
    }

    // Detect optimal patterns
    if (/sort|hash|set|map/.test(code.toLowerCase())) {
      return 0.9; // Good algorithmic choice
    }

    return 0.7; // Acceptable
  }

  _analyzeReasoningAccuracy(reasoning) {
    if (!reasoning) return 0;

    let score = 0;

    // Clear problem understanding
    if (reasoning.problemStatement || reasoning.understood) score += 0.2;

    // Logical approach
    if (reasoning.approach && reasoning.approach.length > 0) score += 0.2;

    // Edge cases considered
    if (reasoning.edgeCases && reasoning.edgeCases.length > 0) score += 0.2;

    // Verification/testing
    if (reasoning.testCases || reasoning.verification) score += 0.2;

    // Complexity analysis
    if (reasoning.timeComplexity || reasoning.spaceComplexity) score += 0.2;

    return Math.min(score, 1);
  }

  _analyzeLogicalFlow(reasoning) {
    if (!reasoning || !reasoning.steps) return 0;

    const hasSequentialSteps = reasoning.steps.length >= 3;
    const hasValidation = reasoning.steps.some(s => 
      s.includes('check') || s.includes('verify') || s.includes('test')
    );

    return (hasSequentialSteps ? 0.5 : 0) + (hasValidation ? 0.5 : 0);
  }

  _analyzeEdgeCaseHandling(reasoning) {
    if (!reasoning) return 0;

    const edgeCases = reasoning.edgeCases || [];
    const common = ['empty_input', 'single_element', 'duplicates', 'boundary', 'overflow'];

    const handled = edgeCases.filter(ec =>
      common.some(c => ec.toLowerCase().includes(c))
    ).length;

    return Math.min(handled / 3, 1);
  }

  _analyzeCommunication(transcript) {
    if (!transcript) return 0;

    let score = 0;

    // Clear introduction
    const lines = transcript.split(/[.!?]+/);
    if (lines[0] && lines[0].length < 100) score += 0.2;

    // Structured explanation
    const hasStructure = lines.length >= 3;
    score += hasStructure ? 0.2 : 0;

    // Technical accuracy
    const mistakes = transcript.toLowerCase().match(/wrong|incorrect|error/g);
    score += (!mistakes || mistakes.length < 2) ? 0.2 : 0;

    // Confidence
    const fillers = transcript.match(/um|uh|like|you know/gi) || [];
    score += fillers.length < 5 ? 0.2 : 0.1;

    // Conclusion
    const hasConclusion = transcript.toLowerCase().includes('final|solution|approach');
    score += hasConclusion ? 0.2 : 0;

    return Math.min(score, 1);
  }

  _calculateClarity(transcript) {
    const words = transcript.split(/\s+/).length;
    const uniqueWords = new Set(transcript.toLowerCase().split(/\s+/)).size;
    const repetition = words / Math.max(uniqueWords, 1);

    // Lower repetition = higher clarity
    return Math.min(Math.max(1 - repetition / 10, 0), 1);
  }

  _estimateConfidence(transcript) {
    const confidenceIndicators = [
      'clearly',
      'obviously',
      'definitely',
      'correct',
      'right'
    ];

    const uncertaintyIndicators = [
      'maybe',
      'probably',
      'might',
      'I think',
      'could be'
    ];

    const confident = transcript.match(new RegExp(confidenceIndicators.join('|'), 'gi')) || [];
    const uncertain = transcript.match(new RegExp(uncertaintyIndicators.join('|'), 'gi')) || [];

    const ratio = (confident.length - uncertain.length) / transcript.split(/\s+/).length;
    return Math.min(Math.max(ratio + 0.5, 0), 1);
  }

  _analyzeTimeManagement(session) {
    const totalTime = session.totalTimeMs || 3600000; // 1 hour default
    const thinkingTime = session.thinkingTimeMs || 0;
    const codingTime = session.codingTimeMs || 0;
    const testingTime = session.testingTimeMs || 0;

    // Ideal: 30% thinking, 60% coding, 10% testing
    const thinkingRatio = totalTime > 0 ? thinkingTime / totalTime : 0;
    const codingRatio = totalTime > 0 ? codingTime / totalTime : 0;
    const testingRatio = totalTime > 0 ? testingTime / totalTime : 0;

    const score =
      (Math.abs(thinkingRatio - 0.3) < 0.1 ? 0.333 : 0) +
      (Math.abs(codingRatio - 0.6) < 0.1 ? 0.333 : 0) +
      (Math.abs(testingRatio - 0.1) < 0.1 ? 0.334 : 0);

    return score;
  }

  _analyzePressurePerformance(session) {
    // Compare performance when stress level increases
    const initialPerformance = session.firstProblemScore || 0.7;
    const laterPerformance = session.averageScore || 0.6;

    // If performance stayed stable or improved under pressure, that's good
    const pressureResistance = laterPerformance / Math.max(initialPerformance, 0.1);
    return Math.min(pressureResistance, 1);
  }

  _calculateOverallInterviewScore(scores) {
    const weights = {
      codeQuality: 0.25,
      reasoningAccuracy: 0.25,
      communicationScore: 0.25,
      timeManagement: 0.1,
      pressurePerformance: 0.15
    };

    let total = 0;
    let weightSum = 0;

    for (const [key, weight] of Object.entries(weights)) {
      if (scores[key] !== undefined) {
        total += scores[key] * weight;
        weightSum += weight;
      }
    }

    return weightSum > 0 ? total / weightSum : 0;
  }

  _calculateReadinessContribution(scores) {
    // Interview score contributes to readiness prediction
    return {
      interviewScore: scores.codeQuality * 0.4 + scores.reasoningAccuracy * 0.3 + scores.communicationScore * 0.3
    };
  }

  _identifyStrengths(scores) {
    const strengths = [];
    if (scores.codeQuality > 0.7) strengths.push('Strong coding ability');
    if (scores.reasoningAccuracy > 0.7) strengths.push('Clear logical thinking');
    if (scores.communicationScore > 0.7) strengths.push('Excellent communication');
    if (scores.timeManagement > 0.7) strengths.push('Good time management');
    return strengths;
  }

  _identifyImprovementAreas(scores) {
    const areas = [];
    if (scores.codeQuality < 0.6) areas.push('Code quality and optimization');
    if (scores.reasoningAccuracy < 0.6) areas.push('Problem-solving approach');
    if (scores.communicationScore < 0.6) areas.push('Explanation clarity');
    if (scores.timeManagement < 0.6) areas.push('Pacing and time allocation');
    if (scores.pressurePerformance < 0.6) areas.push('Performance under pressure');
    return areas;
  }
}

module.exports = InterviewIntelligenceService;

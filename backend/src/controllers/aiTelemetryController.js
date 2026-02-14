/**
 * AI Telemetry Controller
 * Endpoints for triggering mastery/readiness analysis and retrieving predictions
 */

const aiTelemetryBridgeService = require('../services/aiTelemetryBridgeService');
const logger = require('../utils/logger');

/**
 * POST /api/ai/telemetry/process/:userId
 * Trigger full telemetry pipeline (mastery + readiness)
 */
exports.processTelemetry = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user is requesting their own data
    if (req.user?.id !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const result = await aiTelemetryBridgeService.processTelemetryPipeline(userId);

    res.json({
      success: result.success,
      data: result.results || result,
    });
  } catch (error) {
    logger.error(`Error processing telemetry: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET /api/ai/mastery/:userId
 * Get mastery profile and preparation analysis
 */
exports.getMasteryProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user is requesting their own data
    if (req.user?.id !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const masteryInput = await aiTelemetryBridgeService.prepareMasteryInput(userId);

    if (!masteryInput.success) {
      return res.status(404).json({
        success: false,
        error: 'No mastery data available',
        reason: masteryInput.reason,
      });
    }

    res.json({
      success: true,
      data: {
        userId,
        successRate: masteryInput.successRate,
        submissionCount: masteryInput.submissionCount,
        correctCount: masteryInput.correctCount,
        stats: masteryInput.stats,
        topicBreakdown: masteryInput.stats.topicDistribution,
      },
    });
  } catch (error) {
    logger.error(`Error getting mastery profile: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET /api/ai/readiness/:userId
 * Get readiness assessment for interviews/competitions
 */
exports.getReadinessProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user is requesting their own data
    if (req.user?.id !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const readinessInput = await aiTelemetryBridgeService.prepareReadinessInput(userId);

    if (!readinessInput.success) {
      return res.status(404).json({
        success: false,
        error: 'No readiness data available',
        reason: readinessInput.reason,
      });
    }

    res.json({
      success: true,
      data: {
        userId,
        features: readinessInput.readinessFeatures,
      },
    });
  } catch (error) {
    logger.error(`Error getting readiness profile: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET /api/ai/predictions/:userId
 * Get AI-generated predictions and recommendations
 */
exports.getPredictions = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user is requesting their own data
    if (req.user?.id !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const userProfile = await aiTelemetryBridgeService.getUserWithPredictions(userId);

    res.json({
      success: userProfile.success,
      data: userProfile,
    });
  } catch (error) {
    logger.error(`Error getting predictions: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * POST /api/ai/mastery-input/:userId
 * Send mastery data to AI service
 */
exports.sendMasteryInput = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user is requesting their own data
    if (req.user?.id !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const masteryInput = await aiTelemetryBridgeService.prepareMasteryInput(userId);

    if (!masteryInput.success) {
      return res.status(404).json({
        success: false,
        error: 'No mastery data available',
      });
    }

    const result = await aiTelemetryBridgeService.sendMasteryDataToAI(userId, masteryInput);

    res.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    logger.error(`Error sending mastery input: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * POST /api/ai/readiness-input/:userId
 * Send readiness data to AI service
 */
exports.sendReadinessInput = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user is requesting their own data
    if (req.user?.id !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const readinessInput = await aiTelemetryBridgeService.prepareReadinessInput(userId);

    if (!readinessInput.success) {
      return res.status(404).json({
        success: false,
        error: 'No readiness data available',
      });
    }

    const result = await aiTelemetryBridgeService.sendReadinessDataToAI(userId, readinessInput);

    res.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    logger.error(`Error sending readiness input: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET /api/ai/insights/:userId
 * Get comprehensive AI insights and analysis
 */
exports.getInsights = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user is requesting their own data
    if (req.user?.id !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const [masteryInput, readinessInput] = await Promise.all([
      aiTelemetryBridgeService.prepareMasteryInput(userId),
      aiTelemetryBridgeService.prepareReadinessInput(userId),
    ]);

    if (!masteryInput.success || !readinessInput.success) {
      return res.status(404).json({
        success: false,
        error: 'Insufficient data for insights',
      });
    }

    // Combine insights
    const insights = {
      userId,
      masteryScore: {
        successRate: masteryInput.successRate,
        level: this.getMasteryLevel(masteryInput.successRate),
        topTopics: masteryInput.stats.topicDistribution.slice(0, 5),
        avgTimePerProblem: `${masteryInput.stats.avgTimePerProblem}s`,
      },
      readinessScore: {
        consistency: readinessInput.readinessFeatures.activityConsistency,
        difficultyReady: this.assessDifficultyReadiness(readinessInput.readinessFeatures.difficultyDistribution),
        overallReadiness: readinessInput.readinessFeatures.dataCompleteness,
      },
      recommendations: this.generateRecommendations(masteryInput, readinessInput),
    };

    res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    logger.error(`Error getting insights: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Helper: Determine mastery level
 */
exports.getMasteryLevel = (successRate) => {
  if (successRate >= 90) return 'Expert';
  if (successRate >= 75) return 'Advanced';
  if (successRate >= 60) return 'Intermediate';
  if (successRate >= 40) return 'Beginner';
  return 'Novice';
};

/**
 * Helper: Assess readiness for different difficulties
 */
exports.assessDifficultyReadiness = (distribution) => {
  const { easy, medium, hard } = distribution;
  const total = easy + medium + hard;

  return {
    easy: easy > total * 0.3 ? 'Ready' : 'Needs Practice',
    medium: medium > total * 0.2 ? 'Ready' : 'Needs Practice',
    hard: hard > total * 0.1 ? 'Ready' : 'Not Ready',
  };
};

/**
 * Helper: Generate personalized recommendations
 */
exports.generateRecommendations = (masteryInput, readinessInput) => {
  const recommendations = [];

  if (masteryInput.successRate < 70) {
    recommendations.push({
      priority: 'high',
      message: 'Focus on fundamentals - your success rate indicates need for more practice on basics',
      action: 'practice_easy_problems',
    });
  }

  if (readinessInput.readinessFeatures.recentActivity.last7Days < 5) {
    recommendations.push({
      priority: 'high',
      message: 'Increase practice consistency - aim for at least 5 problems per week',
      action: 'increase_daily_practice',
    });
  }

  const difficultyDist = readinessInput.readinessFeatures.difficultyDistribution;
  if (difficultyDist.medium < 10) {
    recommendations.push({
      priority: 'medium',
      message: 'Practice more medium difficulty problems to build interview readiness',
      action: 'medium_problem_focus',
    });
  }

  return recommendations;
};

/**
 * GET /ai/readiness-input/:userId
 * Data formatted for Readiness Predictor
 * Includes: Contest history, consistency, performance trends, difficulty progression
 */
exports.getReadinessInput = async (req, res) => {
  try {
    const { userId } = req.params;

    const contests = await UserContest.find({
      userId,
      mlSignals: { readiness_predictor_included: true },
    }).sort({ contestDate: -1 });

    const submissions = await UserSubmission.find({
      userId,
      mlSignals: { readiness_feature_included: true },
    });

    const solveRate = submissions.length > 0
      ? submissions.filter(s => s.isSolved).length / submissions.length
      : 0;

    const readinessData = {
      userId,
      timestamp: new Date(),
      overall: {
        problemSubmissions: submissions.length,
        problemsSolved: submissions.filter(s => s.isSolved).length,
        solveRate,
      },
      contests: contests.map(c => ({
        contestId: c.contestId,
        platform: c.platform,
        // Core metrics
        rank: c.rank,
        percentileRank: c.percentileRank,
        ratingBefore: c.ratingBefore,
        ratingAfter: c.ratingAfter,
        ratingChange: c.ratingChange,
        // Performance metrics
        consistencyScore: c.consistencyScore,
        pressureHandlingScore: c.pressureHandlingScore,
        // Difficulty
        difficultyBreakdown: {
          easy: {
            attempted: c.easyProblems?.attempted || 0,
            solved: c.easyProblems?.solved || 0,
          },
          medium: {
            attempted: c.mediumProblems?.attempted || 0,
            solved: c.mediumProblems?.solved || 0,
          },
          hard: {
            attempted: c.hardProblems?.attempted || 0,
            solved: c.hardProblems?.solved || 0,
          },
        },
        contestDate: c.contestDate,
      })),
      recentPerformance: {
        last10: contests.slice(0, 10).map(c => c.ratingChange),
        trend: contests.length > 0
          ? contests[0].ratingChange - (contests[Math.min(9, contests.length - 1)].ratingChange || 0)
          : 0,
      },
    };

    return res.json(readinessData);
  } catch (error) {
    console.error('Get readiness input error:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

/**
 * GET /ai/weakness-input/:userId
 * Data for Weakness Detection Engine
 * Identifies weak topics/patterns
 */
exports.getWeaknessInput = async (req, res) => {
  try {
    const { userId } = req.params;

    const submissions = await UserSubmission.find({ userId })
      .populate('problemId');

    // Group by topic
    const topicStats = {};

    for (const sub of submissions) {
      const topics = sub.problemId.topics || [];

      for (const topic of topics) {
        if (!topicStats[topic]) {
          topicStats[topic] = {
            topic,
            attempts: 0,
            solved: 0,
            avgTime: 0,
            hintsUsed: 0,
            problems: [],
          };
        }

        topicStats[topic].attempts++;
        if (sub.isSolved) topicStats[topic].solved++;
        topicStats[topic].avgTime += sub.solveTime || 0;
        topicStats[topic].hintsUsed += sub.hintsUsed || 0;
      }
    }

    // Calculate metrics and identify weaknesses
    const weaknesses = Object.entries(topicStats)
      .map(([topic, stats]) => ({
        topic,
        solveRate: stats.attempts > 0 ? stats.solved / stats.attempts : 0,
        avgSolveTime: stats.attempts > 0 ? stats.avgTime / stats.attempts : 0,
        avgHintsPerAttempt: stats.attempts > 0 ? stats.hintsUsed / stats.attempts : 0,
        totalAttempts: stats.attempts,
        // Weakness scoring: lower solve rate + higher time/hints = more weak
        weaknessScore: 1 - (stats.attempts > 0 ? stats.solved / stats.attempts : 0),
      }))
      .sort((a, b) => b.weaknessScore - a.weaknessScore);

    return res.json({
      userId,
      timestamp: new Date(),
      totalTopics: weaknesses.length,
      weakestTopics: weaknesses.slice(0, 5),
      allTopicStats: weaknesses,
    });
  } catch (error) {
    console.error('Get weakness input error:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

/**
 * GET /ai/adaptive-planning/:userId/:roadmapId
 * Data for Adaptive Planner - topic recommendations based on mastery
 */
exports.getAdaptivePlanningData = async (req, res) => {
  try {
    const { userId, roadmapId } = req.params;

    // Get PCI data
    const pciData = await pciComputationService.computeUserPCI(userId, roadmapId);

    // Get topic insights
    const topicInsights = [];
    for (const topic of pciData.topics) {
      const insights = await pciComputationService.getTopicInsights(userId, topic.topicId);
      topicInsights.push(insights);
    }

    // Format for adaptive planner
    const planningData = {
      userId,
      roadmapId,
      timestamp: new Date(),
      roadmapName: pciData.roadmapName,
      overallPCI: pciData.pciScore,
      topics: pciData.topics.map((t, idx) => ({
        topicId: t.topicId,
        name: t.name,
        weight: t.weight,
        completionPercentage: t.completionPercentage,
        insights: topicInsights[idx] || {},
        // For adaptive planning
        readyForNext: t.isCompleted,
        prerequisites: t.prerequisites || [],
      })),
      recommendations: pciData.recommendations,
    };

    return res.json(planningData);
  } catch (error) {
    console.error('Get adaptive planning error:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

/**
 * GET /ai/topic-problem-map/:roadmapId
 * Problem-to-topic mapping for adaptive sequencing
 */
exports.getTopicProblemMap = async (req, res) => {
  try {
    const { roadmapId } = req.params;

    const topics = await RoadmapTopic.find({ roadmapId })
      .populate({
        path: 'problems',
        populate: {
          path: 'problemId',
          select: 'title difficulty topics interviewFrequencyScore',
        },
      });

    const map = {};

    for (const topic of topics) {
      map[topic._id] = {
        topicId: topic._id,
        topicName: topic.name,
        weight: topic.weight,
        priority: topic.priority,
        problems: (topic.problems || []).map(tp => ({
          problemId: tp.problemId._id,
          title: tp.problemId.title,
          difficulty: tp.problemId.difficulty,
          order: tp.recommendedOrder,
          importance: tp.importanceScore,
          prerequisites: tp.prerequisiteProblems || [],
          concepts: tp.learnsConcepts || [],
          estimatedMinutes: tp.estimatedMinutes,
        })),
      };
    }

    return res.json({
      roadmapId,
      topicCount: Object.keys(map).length,
      topicMap: map,
    });
  } catch (error) {
    console.error('Get topic problem map error:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

/**
 * GET /ai/user-prep-metrics/:userId
 * Get comprehensive prep metrics for AI services (internal endpoint)
 */
exports.getAIPrepMetrics = async (req, res) => {
  try {
    const { userId } = req.params;

    const allPCI = await pciComputationService.computeAllUserPCI(userId);

    // Format for AI pipeline
    const metrics = {
      userId,
      timestamp: new Date(),
      overallPreparednessPCI: allPCI.overallPCI,
      roadmapMetrics: allPCI.roadmaps.map(r => ({
        roadmapId: r.roadmapId,
        roadmapName: r.roadmapName,
        pci: r.pciScore,
        topicCompletion: r.topics.map(t => ({
          topicId: t.topicId,
          topicName: t.name,
          completionPercentage: t.completionPercentage,
          weight: t.weight,
        })),
      })),
      recommendations: allPCI.roadmaps
        .flatMap(r => r.recommendations.slice(0, 2))
        .slice(0, 5),
    };

    return res.json(metrics);
  } catch (error) {
    console.error('Get AI prep metrics error:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

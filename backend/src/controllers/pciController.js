/**
 * PCI (Preparation Completeness Index) Controller
 * REST endpoints for PCI computation and roadmap progress
 */

const userRoadmapProgressService = require('../services/userRoadmapProgressService');
const pciComputationService = require('../services/pciComputationService');
const Roadmap = require('../models/Roadmap');
const RoadmapTopic = require('../models/RoadmapTopic');
const UserRoadmapProgress = require('../models/UserRoadmapProgress');

/**
 * GET /api/roadmap/pci/:roadmapId
 * Compute and return PCI for user on a specific roadmap
 */
exports.computePCI = async (req, res) => {
  try {
    const { roadmapId } = req.params;
    const userId = req.user.id; // From JWT token

    // Use userRoadmapProgressService which uses topic mastery scores
    const pciData = await userRoadmapProgressService.computePCI(userId, roadmapId);

    return res.json({
      success: true,
      data: pciData,
    });
  } catch (error) {
    console.error('PCI computation error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to compute PCI',
    });
  }
};

/**
 * GET /api/roadmap/progress/:roadmapId
 * Get detailed progress for a roadmap (topic-by-topic)
 */
exports.getRoadmapProgress = async (req, res) => {
  try {
    const { roadmapId } = req.params;
    const userId = req.user.id; // From JWT token

    const roadmap = await Roadmap.findById(roadmapId).populate('topics');

    if (!roadmap) {
      return res.status(404).json({
        error: 'Roadmap not found',
      });
    }

    const topicProgress = [];

    for (const topic of roadmap.topics) {
      const completion = await pciComputationService.computeTopicCompletion(userId, topic._id);
      topicProgress.push({
        topicId: topic._id,
        topicName: topic.name,
        order: topic.order,
        weight: topic.weight,
        priority: topic.priority,
        ...completion,
      });
    }

    // Sort by order
    topicProgress.sort((a, b) => (a.order || 0) - (b.order || 0));

    return res.json({
      success: true,
      roadmapId,
      roadmapName: roadmap.name,
      topicProgress,
      overallProgress: {
        completedTopics: topicProgress.filter(t => t.isCompleted).length,
        totalTopics: topicProgress.length,
        completionPercentage: Math.round(
          (topicProgress.filter(t => t.isCompleted).length / topicProgress.length) * 100
        ),
      },
    });
  } catch (error) {
    console.error('Get roadmap progress error:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

/**
 * GET /api/roadmap/all-pci
 * Get PCI for all available roadmaps for current user
 */
exports.getAllPCI = async (req, res) => {
  try {
    const userId = req.user.id; // From JWT token

    // Use userRoadmapProgressService to compute PCI for all active roadmaps
    const allRoadmaps = await Roadmap.find({ isActive: true }).select('_id');
    const allPCI = [];

    for (const roadmap of allRoadmaps) {
      try {
        const pci = await userRoadmapProgressService.computePCI(userId, roadmap._id);
        allPCI.push({
          roadmapId: roadmap._id,
          ...pci,
        });
      } catch (error) {
        console.warn(`Could not compute PCI for roadmap ${roadmap._id}:`, error.message);
      }
    }

    return res.json({
      success: true,
      data: allPCI,
    });
  } catch (error) {
    console.error('Get all PCI error:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

/**
 * GET /api/roadmap/topic-insights/:topicId
 * Get detailed insights for a specific topic
 */
exports.getTopicInsights = async (req, res) => {
  try {
    const { topicId } = req.params;
    const userId = req.user.id; // From JWT token

    const insights = await pciComputationService.getTopicInsights(userId, topicId);

    return res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error('Get topic insights error:', error);
    return res.status(404).json({
      error: error.message,
    });
  }
};

/**
 * POST /api/roadmap/compare-topics
 * Compare progress across multiple topics
 */
exports.compareTopics = async (req, res) => {
  try {
    const { topicIds } = req.body;
    const userId = req.user.id; // From JWT token

    if (!topicIds || !Array.isArray(topicIds) || topicIds.length === 0) {
      return res.status(400).json({
        error: 'topicIds array is required',
      });
    }

    const comparison = await pciComputationService.compareTopicProgress(userId, topicIds);

    return res.json({
      success: true,
      comparison,
    });
  } catch (error) {
    console.error('Compare topics error:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

/**
 * GET /api/roadmap/list
 * List all available roadmaps with user's PCI for each
 */
exports.listRoadmaps = async (req, res) => {
  try {
    const userId = req.user.id; // From JWT token
    const { category, difficulty } = req.query;

    let query = { isPublished: true, isActive: true };

    if (category) query.category = category;
    if (difficulty) query.difficultyLevel = difficulty;

    const roadmaps = await Roadmap.find(query)
      .select('_id name subject category difficultyLevel description targetRole statistics')
      .limit(20);

    // Get PCI for each roadmap
    const roadmapList = [];

    for (const roadmap of roadmaps) {
      try {
        const pci = await userRoadmapProgressService.computePCI(userId, roadmap._id);
        roadmapList.push({
          ...roadmap.toObject(),
          userPCI: pci.pci_score,
          userPCIPercentage: (pci.pci_score * 100).toFixed(1),
          userProgress: {
            completed: pci.topics_completed,
            total: pci.topics_total,
          },
        });
      } catch (error) {
        // If error, just include without PCI
        roadmapList.push({
          ...roadmap.toObject(),
          userPCI: 0,
          userPCIPercentage: '0.0',
          userProgress: {
            completed: 0,
            total: 0,
          },
        });
      }
    }

    return res.json({
      success: true,
      roadmaps: roadmapList,
    });
  } catch (error) {
    console.error('List roadmaps error:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

/**
 * GET /api/roadmap/recommendations/:roadmapId
 * Get PCI-based recommendations for a roadmap
 */
exports.getRecommendations = async (req, res) => {
  try {
    const { roadmapId } = req.params;
    const userId = req.user.id; // From JWT token

    // Get PCI data from userRoadmapProgressService
    const pciData = await userRoadmapProgressService.computePCI(userId, roadmapId);

    // Get topic completion status data
    const roadmap = await Roadmap.findById(roadmapId).populate('topics');
    
    // Generate recommendations based on incomplete topics
    const recommendations = (pciData.topic_progresses || [])
      .filter(t => !t.is_completed)
      .sort((a, b) => (b.weight || 0) - (a.weight || 0))
      .slice(0, 3)
      .map(t => `Focus on ${t.topic_name} (${Math.round(t.estimated_mastery * 100)}% mastery)`);

    return res.json({
      success: true,
      roadmapId,
      pciScore: pciData.pci_score,
      pciPercentage: Math.round(pciData.pci_score * 100),
      topicsCompleted: pciData.topics_completed,
      topicsTotal: pciData.topics_total,
      recommendations: recommendations.length > 0 ? recommendations : ['Keep practicing!'],
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
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

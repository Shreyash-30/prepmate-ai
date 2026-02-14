/**
 * DSA Roadmap Controller
 * 
 * Exposes comprehensive DSA roadmap data with:
 * - Layered structure (Core, Reinforcement, Advanced, Optional)
 * - PCI-compatible weights and priorities
 * - AI integration hooks (topic_id, canonical_topic_key)
 * - Frontend-ready response formats
 * - Mastery tracking compatibility
 */

const { Roadmap, RoadmapTopic, UserTopicStats, Problem, RoadmapTopicProblem } = require('../models');

/**
 * GET /api/roadmap/dsa
 * Returns full DSA roadmap with layered structure
 * Frontend uses this to render the complete roadmap view
 */
const getFullDSARoadmap = async (req, res) => {
  try {
    const userId = req.user?.user_id;

    // Get official DSA roadmap - prioritize the 15-topic FAANG roadmap
    let roadmap = await Roadmap.findOne({
      name: { $regex: 'FAANG', $options: 'i' },
      isOfficial: true,
    }).populate({
      path: 'topics',
      model: 'RoadmapTopic',
      options: { sort: { order: 1 } },
    });

    // Fallback to first official DSA roadmap with most topics
    if (!roadmap) {
      roadmap = await Roadmap.findOne({
        subject: 'DSA',
        isOfficial: true,
      }).sort({ 'topics': -1 }).populate({
        path: 'topics',
        model: 'RoadmapTopic',
        options: { sort: { order: 1 } },
      });
    }

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'DSA Roadmap not found. Run: npm run seed:dsa',
      });
    }

    // Organize topics by layer
    const layers = {
      core: [],
      reinforcement: [],
      advanced: [],
      optional: [],
    };

    // Get user progress if authenticated
    let userProgress = {};
    if (userId) {
      const stats = await UserTopicStats.find({ user_id: userId });
      stats.forEach(stat => {
        userProgress[stat.topic_id?.toString()] = {
          mastery: stat.estimated_mastery || 0,
          problems_solved: stat.problems_solved || 0,
          confidence: stat.confidence_score || 'not_started',
        };
      });
    }

    // Format topics with user progress
    roadmap.topics.forEach(topic => {
      const topicData = {
        topic_id: topic._id,
        canonical_topic_key: topic.name.toLowerCase().replace(/\s+/g, '_'),
        name: topic.name,
        description: topic.description,
        layer: topic.layer,
        weight: topic.weight,
        priority: topic.priority,
        order: topic.order,
        interview_frequency_score: topic.interviewFrequencyScore,
        difficulty_level: topic.difficultyLevel,
        estimated_hours: topic.estimatedHours,
        completion_threshold: topic.completionThreshold,
        concepts: topic.concepts || [],
        keywords: topic.keywords || [],
        resource_links: topic.resourceLinks || [],
        problems_count: topic.problems?.length || 0,
        required_problems: topic.requiredProblems || 5,
        
        // User progress (if authenticated)
        ...(userId && userProgress[topic._id?.toString()] ? {
          user_mastery: userProgress[topic._id?.toString()].mastery,
          user_problems_solved: userProgress[topic._id?.toString()].problems_solved,
          user_confidence: userProgress[topic._id?.toString()].confidence,
        } : {}),
      };

      layers[topic.layer].push(topicData);
    });

    // Calculate roadmap stats
    const totalWeight = Object.values(layers)
      .flat()
      .reduce((sum, t) => sum + (t.weight || 0), 0);

    const totalHours = Object.values(layers)
      .flat()
      .reduce((sum, t) => sum + (t.estimated_hours || 0), 0);

    const avgInterviewFrequency = (Object.values(layers)
      .flat()
      .reduce((sum, t) => sum + (t.interview_frequency_score || 0), 0) /
      roadmap.topics.length).toFixed(0);

    // Response format optimized for frontend
    res.json({
      success: true,
      data: {
        roadmap_id: roadmap._id,
        roadmap_name: 'Data Structures & Algorithms - FAANG Interview',
        roadmap_description: roadmap.description,
        roadmap_category: roadmap.category,
        target_role: roadmap.targetRole,
        difficulty_level: roadmap.difficultyLevel,
        estimated_duration_days: roadmap.estimatedDurationDays,
        
        // Stats for dashboard
        stats: {
          total_topics: roadmap.topics.length,
          total_estimated_hours: totalHours,
          total_weight: totalWeight.toFixed(2),
          average_interview_frequency: avgInterviewFrequency,
        },

        // Layered topics
        layers: [
          {
            layer_name: 'core',
            layer_label: 'Core Fundamentals',
            layer_description: 'Essential topics required for ALL interviews',
            layer_weight_percentage: 40,
            topics: layers.core,
            topicCount: layers.core.length,
          },
          {
            layer_name: 'reinforcement',
            layer_label: 'Reinforcement',
            layer_description: 'High-frequency topics building on core foundations',
            layer_weight_percentage: 35,
            topics: layers.reinforcement,
            topicCount: layers.reinforcement.length,
          },
          {
            layer_name: 'advanced',
            layer_label: 'Advanced Concepts',
            layer_description: 'High-impact topics for top-tier companies',
            layer_weight_percentage: 20,
            topics: layers.advanced,
            topicCount: layers.advanced.length,
          },
          {
            layer_name: 'optional',
            layer_label: 'Specialized Topics',
            layer_description: 'Lower-frequency but valuable topics',
            layer_weight_percentage: 5,
            topics: layers.optional,
            topicCount: layers.optional.length,
          },
        ],

        // PCI calculation data
        pci_weights: {
          core_weight: 0.4,
          reinforcement_weight: 0.35,
          advanced_weight: 0.2,
          optional_weight: 0.05,
        },

        // User progress (if authenticated)
        ...(userId ? {
          user_progress: {
            total_topics_started: Object.keys(userProgress).length,
            average_mastery: userId ? (Object.values(userProgress)
              .reduce((sum, p) => sum + (p.mastery || 0), 0) /
              Object.keys(userProgress).length || 0).toFixed(2) : 0,
          },
        } : {}),
      },
    });
  } catch (error) {
    console.error('Error fetching DSA roadmap:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching DSA roadmap',
      error: error.message,
    });
  }
};

/**
 * GET /api/roadmap/dsa/topics
 * Returns flattened list of all DSA topics with optional filtering
 * Query params: layer, difficulty, search
 */
const getDSATopics = async (req, res) => {
  try {
    const { layer, difficulty, search } = req.query;
    const userId = req.user?.user_id;

    // Get official DSA roadmap
    const roadmap = await Roadmap.findOne({
      subject: 'DSA',
      isOfficial: true,
      isActive: true,
    });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'DSA Roadmap not found',
      });
    }

    // Build query
    const query = { roadmapId: roadmap._id };
    if (layer) query.layer = layer;
    if (difficulty) query.difficultyLevel = difficulty;

    // Search in name, description, concepts, keywords
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { concepts: { $regex: search, $options: 'i' } },
        { keywords: { $regex: search, $options: 'i' } },
      ];
    }

    const topics = await RoadmapTopic.find(query).sort({ order: 1 });

    // Get user progress if authenticated
    let userProgress = {};
    if (userId) {
      const stats = await UserTopicStats.find({ user_id: userId });
      stats.forEach(stat => {
        userProgress[stat.topic_id?.toString()] = {
          mastery: stat.estimated_mastery || 0,
          problems_solved: stat.problems_solved || 0,
          confidence: stat.confidence_score || 'not_started',
        };
      });
    }

    // Format response
    const formattedTopics = topics.map(topic => ({
      topic_id: topic._id,
      canonical_topic_key: topic.name.toLowerCase().replace(/\s+/g, '_'),
      name: topic.name,
      description: topic.description,
      layer: topic.layer,
      weight: topic.weight,
      priority: topic.priority,
      order: topic.order,
      interview_frequency_score: topic.interviewFrequencyScore,
      difficulty_level: topic.difficultyLevel,
      estimated_hours: topic.estimatedHours,
      concepts: topic.concepts || [],
      keywords: topic.keywords || [],
      resource_links: topic.resourceLinks || [],
      
      // User progress
      ...(userId && userProgress[topic._id?.toString()] ? {
        user_mastery: userProgress[topic._id?.toString()].mastery,
        user_problems_solved: userProgress[topic._id?.toString()].problems_solved,
        user_confidence: userProgress[topic._id?.toString()].confidence,
      } : {}),
    }));

    res.json({
      success: true,
      data: formattedTopics,
      meta: {
        total: formattedTopics.length,
        filters: { layer, difficulty, search },
      },
    });
  } catch (error) {
    console.error('Error fetching DSA topics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching topics',
      error: error.message,
    });
  }
};

/**
 * GET /api/roadmap/dsa/topic/:topicId
 * Returns detailed information for a specific topic
 * Includes dependencies, resources, and user progress
 */
const getDSATopicDetail = async (req, res) => {
  try {
    const { topicId } = req.params;
    const userId = req.user?.user_id;

    const topic = await RoadmapTopic.findById(topicId)
      .populate({
        path: 'dependencyTopics',
        model: 'RoadmapTopic',
        select: 'name _id',
      });

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found',
      });
    }

    // Get user progress if authenticated
    let userProgress = null;
    if (userId) {
      userProgress = await UserTopicStats.findOne({
        user_id: userId,
        topic_id: topicId,
      });
    }

    res.json({
      success: true,
      data: {
        topic_id: topic._id,
        canonical_topic_key: topic.name.toLowerCase().replace(/\s+/g, '_'),
        name: topic.name,
        description: topic.description,
        layer: topic.layer,
        weight: topic.weight,
        priority: topic.priority,
        order: topic.order,
        interview_frequency_score: topic.interviewFrequencyScore,
        difficulty_level: topic.difficultyLevel,
        estimated_hours: topic.estimatedHours,
        completion_threshold: topic.completionThreshold,
        
        // Content
        concepts: topic.concepts || [],
        keywords: topic.keywords || [],
        resource_links: topic.resourceLinks || [],
        
        // Dependencies
        prerequisite_topics: topic.dependencyTopics?.map(t => ({
          topic_id: t._id,
          name: t.name,
        })) || [],
        
        // Problems for this topic
        problems_count: topic.problems?.length || 0,
        required_problems: topic.requiredProblems || 5,
        
        // User progress
        ...(userId && userProgress ? {
          user_progress: {
            topic_id: userProgress.topic_id,
            mastery: userProgress.estimated_mastery || 0,
            problems_solved: userProgress.problems_solved || 0,
            confidence: userProgress.confidence_score || 'not_started',
            hours_spent: userProgress.hours_spent || 0,
            last_practiced: userProgress.last_practiced || null,
          },
        } : {}),
      },
    });
  } catch (error) {
    console.error('Error fetching topic detail:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching topic detail',
      error: error.message,
    });
  }
};

/**
 * GET /api/roadmap/dsa/layers
 * Returns roadmap structure grouped by layers with stats
 * Useful for navigation and progress visualization
 */
const getDSALayers = async (req, res) => {
  try {
    const userId = req.user?.user_id;

    const roadmap = await Roadmap.findOne({
      subject: 'DSA',
      isOfficial: true,
      isActive: true,
    }).populate({
      path: 'topics',
      model: 'RoadmapTopic',
      options: { sort: { order: 1 } },
    });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'DSA Roadmap not found',
      });
    }

    // Get user progress
    let userProgress = {};
    if (userId) {
      const stats = await UserTopicStats.find({ user_id: userId });
      stats.forEach(stat => {
        userProgress[stat.topic_id?.toString()] = {
          mastery: stat.estimated_mastery || 0,
          problems_solved: stat.problems_solved || 0,
        };
      });
    }

    // Organize by layers
    const layers = [
      {
        layer_name: 'core',
        layer_label: 'Core Fundamentals',
        layer_weight_percentage: 40,
        description: 'Essential topics required for ALL interviews',
      },
      {
        layer_name: 'reinforcement',
        layer_label: 'Reinforcement',
        layer_weight_percentage: 35,
        description: 'High-frequency topics building on core foundations',
      },
      {
        layer_name: 'advanced',
        layer_label: 'Advanced Concepts',
        layer_weight_percentage: 20,
        description: 'High-impact topics for top-tier companies',
      },
      {
        layer_name: 'optional',
        layer_label: 'Specialized Topics',
        layer_weight_percentage: 5,
        description: 'Lower-frequency but valuable topics',
      },
    ];

    // Add topics to each layer
    const layersWithTopics = layers.map(layer => {
      const layerTopics = roadmap.topics.filter(t => t.layer === layer.layer_name);
      
      const layerStats = {
        topic_count: layerTopics.length,
        total_estimated_hours: layerTopics.reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
        average_interview_frequency: (layerTopics.reduce((sum, t) => sum + (t.interviewFrequencyScore || 0), 0) / layerTopics.length).toFixed(0),
      };

      if (userId) {
        const masteredCount = layerTopics.filter(t => {
          const progress = userProgress[t._id?.toString()];
          return progress && progress.mastery >= 0.7;
        }).length;

        layerStats.mastered_topics = masteredCount;
        layerStats.mastery_percentage = ((masteredCount / layerTopics.length) * 100).toFixed(0);
      }

      return {
        ...layer,
        stats: layerStats,
        topics: layerTopics.map(t => ({
          topic_id: t._id,
          name: t.name,
          priority: t.priority,
          interview_frequency_score: t.interviewFrequencyScore,
          ...(userId && userProgress[t._id?.toString()] ? {
            user_mastery: userProgress[t._id?.toString()].mastery,
          } : {}),
        })),
      };
    });

    res.json({
      success: true,
      data: {
        roadmap_name: 'DSA Interview Roadmap',
        layers: layersWithTopics,
      },
    });
  } catch (error) {
    console.error('Error fetching layers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching layers',
      error: error.message,
    });
  }
};

/**
 * POST /api/roadmap/dsa/seed
 * Admin endpoint to seed/reseed the DSA roadmap
 * Requires admin role
 */
const seedDSARoadmapEndpoint = async (req, res) => {
  try {
    // Check admin role (implement based on your auth system)
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can seed the roadmap',
      });
    }

    // Trigger seeding script
    const { exec } = require('child_process');
    exec('node scripts/seedDSARoadmap.js', (error, stdout, stderr) => {
      if (error) {
        console.error('Seeding error:', error);
        return res.status(500).json({
          success: false,
          message: 'Error seeding roadmap',
          error: error.message,
        });
      }

      res.json({
        success: true,
        message: 'DSA Roadmap seeded successfully',
        output: stdout,
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error seeding roadmap',
      error: error.message,
    });
  }
};

/**
 * GET /api/roadmap/dsa/topic/:topicId/problems
 * Fetch problems for a specific DSA topic
 * Returns problems sorted by importance and recommended order
 */
const getDSATopicProblems = async (req, res) => {
  try {
    const { topicId } = req.params;
    const userId = req.user?.user_id;

    // Verify topic exists
    const topic = await RoadmapTopic.findById(topicId);
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found',
      });
    }

    // Get problems mapped to this topic, sorted by importance
    const topicProblems = await RoadmapTopicProblem.find({ topicId })
      .populate({
        path: 'problemId',
        model: 'Problem',
      })
      .sort({ importanceScore: -1, recommendedOrder: 1 });

    if (!topicProblems || topicProblems.length === 0) {
      return res.json({
        success: true,
        data: {
          topic_id: topicId,
          topic_name: topic.name,
          problems: [],
          total_problems: 0,
          message: 'No problems mapped to this topic yet',
        },
      });
    }

    // Format problems for frontend
    const problems = topicProblems.map(tp => {
      const problem = tp.problemId;
      return {
        problem_id: problem._id,
        external_id: problem.externalId,
        title: problem.title,
        difficulty: problem.difficulty,
        topics: problem.topics || [],
        platform: problem.platform,
        url: problem.url,
        description: problem.description,
        constraints: problem.constraints || [],
        acceptance_rate: problem.acceptanceRate,
        importance_score: tp.importanceScore,
        recommended_order: tp.recommendedOrder,
        prerequisites: tp.prerequisiteProblems || [],
      };
    });

    res.json({
      success: true,
      data: {
        topic_id: topicId,
        topic_name: topic.name,
        problems,
        total_problems: problems.length,
      },
    });
  } catch (error) {
    console.error('Error fetching topic problems:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching problems',
      error: error.message,
    });
  }
};

module.exports = {
  getFullDSARoadmap,
  getDSATopics,
  getDSATopicDetail,
  getDSALayers,
  seedDSARoadmapEndpoint,
  getDSATopicProblems,
};

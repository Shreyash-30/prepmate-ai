/**
 * Roadmap Custom Creation Controller
 * Handles user-defined custom roadmap creation with topic sequencing
 */

const Roadmap = require('../models/Roadmap');
const RoadmapTopic = require('../models/RoadmapTopic');
const Topic = require('../models/Topic');
const userRoadmapProgressService = require('../services/userRoadmapProgressService');
const logger = require('../utils/logger');

// POST /roadmaps/custom
const createCustomRoadmap = async (req, res, next) => {
  try {
    const userId = req.user?.id; // From JWT token: { id: userId, email }
    const { name, description, target_role, topics } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Validate required fields
    if (!name || !topics || topics.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Name and at least one topic are required',
      });
    }

    // Create roadmap
    const roadmap = new Roadmap({
      name,
      description: description || `Custom roadmap for ${target_role || 'preparation'}`,
      target_role: target_role || 'general',
      created_by: userId,
      is_custom: true,
      is_active: true,
      roadmap_metadata: {
        creator_type: 'user',
        customization_level: 'high',
      },
    });

    await roadmap.save();

    // Create roadmap topics with custom weights and sequencing
    const roadmapTopics = [];

    for (let i = 0; i < topics.length; i++) {
      const topicData = topics[i];

      // Verify topic exists
      const topic = await Topic.findById(topicData.topic_id);
      if (!topic) {
        logger.warn(`Topic not found: ${topicData.topic_id}`);
        continue;
      }

      const roadmapTopic = new RoadmapTopic({
        roadmapId: roadmap._id,
        name: topic.name,
        description: topic.description,
        weight: topicData.weight || 1,
        priority: topicData.priority || i + 1,
        order: i,
        layer: topicData.layer || 'core',
        interviewFrequencyScore: topicData.interview_frequency_score || 50,
        difficultyLevel: topicData.difficulty || 'medium',
        estimatedHours: topicData.estimated_hours || 4,
        completionThreshold: topicData.completion_threshold || 0.7,
        dependencyTopics: topicData.dependencies || [],
        isActive: true,
      });

      await roadmapTopic.save();
      roadmapTopics.push(roadmapTopic);
    }

    // Add topics to roadmap
    roadmap.topics = roadmapTopics.map((t) => t._id);
    await roadmap.save();

    // Initialize PCI for this user-roadmap
    await userRoadmapProgressService.computePCI(userId, roadmap._id);

    res.status(201).json({
      success: true,
      data: {
        roadmap_id: roadmap._id,
        name: roadmap.name,
        topic_count: roadmapTopics.length,
        created_by: userId,
        message: 'Custom roadmap created successfully',
      },
    });
  } catch (error) {
    logger.error('Error creating custom roadmap:', error);
    next(error);
  }
};

// POST /roadmaps/custom/:roadmapId/topics
const addTopicsToRoadmap = async (req, res, next) => {
  try {
    const { roadmapId } = req.params;
    const userId = req.user?.id;
    const { topics } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Verify roadmap ownership
    const roadmap = await Roadmap.findById(roadmapId);
    if (!roadmap || (roadmap.created_by && roadmap.created_by.toString() !== userId)) {
      return res.status(403).json({
        success: false,
        message: 'User does not own this roadmap',
      });
    }

    if (!topics || topics.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one topic is required',
      });
    }

    const addedTopics = [];
    const currentTopicCount = roadmap.topics?.length || 0;

    for (let i = 0; i < topics.length; i++) {
      const topicData = topics[i];

      // Verify topic exists
      const topic = await Topic.findById(topicData.topic_id);
      if (!topic) {
        logger.warn(`Topic not found: ${topicData.topic_id}`);
        continue;
      }

      const roadmapTopic = new RoadmapTopic({
        roadmapId,
        name: topic.name,
        description: topic.description,
        weight: topicData.weight || 1,
        topic_weight: topicData.weight || 1,
        priority: topicData.priority || currentTopicCount + i + 1,
        order: currentTopicCount + i,
        layer: topicData.layer || 'core',
        interviewFrequencyScore: topicData.interview_frequency_score || 50,
        difficultyLevel: topicData.difficulty || 'medium',
        estimatedHours: topicData.estimated_hours || 4,
        completionThreshold: topicData.completion_threshold || 0.7,
        dependencyTopics: topicData.dependencies || [],
        is_active: true,
      });

      await roadmapTopic.save();
      addedTopics.push(roadmapTopic);
    }

    // Add to roadmap
    roadmap.topics = [...(roadmap.topics || []), ...addedTopics.map((t) => t._id)];
    await roadmap.save();

    // Recalculate PCI for all users with this roadmap
    // (In production, this would be queued as a background job)

    res.json({
      success: true,
      data: {
        roadmap_id: roadmapId,
        added_topics: addedTopics.length,
        total_topics: roadmap.topics.length,
        message: `Added ${addedTopics.length} topics to roadmap`,
      },
    });
  } catch (error) {
    logger.error('Error adding topics to roadmap:', error);
    next(error);
  }
};

// PUT /roadmaps/custom/:roadmapId/topics/:topicId
const updateRoadmapTopic = async (req, res, next) => {
  try {
    const { roadmapId, topicId } = req.params;
    const userId = req.user?.id;
    const { weight, priority, layer, completion_threshold, dependencies } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Verify roadmap ownership
    const roadmap = await Roadmap.findById(roadmapId);
    if (!roadmap || (roadmap.created_by && roadmap.created_by.toString() !== userId)) {
      return res.status(403).json({
        success: false,
        message: 'User does not own this roadmap',
      });
    }

    // Update topic
    const roadmapTopic = await RoadmapTopic.findOneAndUpdate(
      { _id: topicId, roadmapId },
      {
        $set: {
          ...(weight !== undefined && { weight, topic_weight: weight }),
          ...(priority !== undefined && { priority }),
          ...(layer !== undefined && { layer }),
          ...(completion_threshold !== undefined && { completionThreshold: completion_threshold }),
          ...(dependencies && { dependencyTopics: dependencies }),
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!roadmapTopic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found in roadmap',
      });
    }

    // Validation: core topics should have highest weight
    if (layer === 'core' && weight !== undefined) {
      const otherTopics = await RoadmapTopic.find({
        roadmapId,
        _id: { $ne: topicId },
      });

      const coreTopics = otherTopics.filter((t) => t.layer === 'core');
      const avgCoreWeight = coreTopics.length > 0
        ? coreTopics.reduce((sum, t) => sum + (t.weight || 0), 0) / coreTopics.length
        : 0;

      if (weight < avgCoreWeight * 0.5) {
        logger.warn(
          `Warning: core topic weight ${weight} is significantly lower than other core topics`
        );
      }
    }

    // Recalculate PCI
    await userRoadmapProgressService.computePCI(userId, roadmapId);

    res.json({
      success: true,
      data: {
        topic_id: topicId,
        roadmap_id: roadmapId,
        weight: roadmapTopic.weight,
        layer: roadmapTopic.layer,
        message: 'Topic updated successfully',
      },
    });
  } catch (error) {
    logger.error('Error updating roadmap topic:', error);
    next(error);
  }
};

module.exports = {
  createCustomRoadmap,
  addTopicsToRoadmap,
  updateRoadmapTopic,
};

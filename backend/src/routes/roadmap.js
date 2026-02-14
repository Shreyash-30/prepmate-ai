/**
 * Roadmap & PCI Routes
 */

const express = require('express');
const { authMiddleware } = require('../middlewares/authMiddleware');
const pciController = require('../controllers/pciController');
const topicsController = require('../controllers/topicsController');
const dsaRoadmapController = require('../controllers/dsaRoadmapController');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/roadmap/topics?category=DSA
 * Get topics by category with user's progress
 */
router.get('/topics', topicsController.getTopicsByCategory);

/**
 * GET /api/roadmap/categories
 * Get all available topic categories
 */
router.get('/categories', topicsController.getCategories);

/**
 * PUT /api/roadmap/topics/:topicId
 * Update topic progress
 */
router.put('/topics/:topicId', topicsController.updateTopicProgress);

/**
 * GET /api/roadmap/list
 * List all available roadmaps
 * Query: category, difficulty
 */
router.get('/list', pciController.listRoadmaps);

/**
 * GET /api/roadmap/pci/:roadmapId
 * Get PCI score for roadmap
 */
router.get('/pci/:roadmapId', pciController.computePCI);

/**
 * GET /api/roadmap/progress/:roadmapId
 * Get detailed topic progress for roadmap
 */
router.get('/progress/:roadmapId', pciController.getRoadmapProgress);

/**
 * GET /api/roadmap/all-pci
 * Get PCI for all roadmaps
 */
router.get('/all-pci', pciController.getAllPCI);

/**
 * GET /api/roadmap/topic-insights/:topicId
 * Get detailed insights for a topic
 */
router.get('/topic-insights/:topicId', pciController.getTopicInsights);

/**
 * POST /api/roadmap/compare-topics
 * Compare progress across topics
 * Body: { topicIds: string[] }
 */
router.post('/compare-topics', pciController.compareTopics);

/**
 * GET /api/roadmap/recommendations/:roadmapId
 * Get PCI-based recommendations
 */
router.get('/recommendations/:roadmapId', pciController.getRecommendations);

// ==================== DSA ROADMAP ENDPOINTS ====================

/**
 * DSA Roadmap - Production-grade structured curriculum
 * Aligned with Blind-75, NeetCode-150, Striver Sheet, FAANG patterns
 * Layered structure with weights for PCI computation
 */

/**
 * GET /api/roadmap/dsa
 * Returns full DSA roadmap with 4-layer structure, weights, and mastery tracking
 */
router.get('/dsa', dsaRoadmapController.getFullDSARoadmap);

/**
 * GET /api/roadmap/dsa/layers
 * Returns roadmap grouped by layers with progress statistics
 */
router.get('/dsa/layers', dsaRoadmapController.getDSALayers);

/**
 * GET /api/roadmap/dsa/topics
 * Returns flattened list of DSA topics with optional filtering
 * Query params: ?layer=core&difficulty=medium&search=arrays
 */
router.get('/dsa/topics', dsaRoadmapController.getDSATopics);

/**
 * GET /api/roadmap/dsa/topic/:topicId
 * Returns detailed DSA topic with dependencies, resources, and user progress
 */
router.get('/dsa/topic/:topicId', dsaRoadmapController.getDSATopicDetail);

/**
 * GET /api/roadmap/dsa/topic/:topicId/problems
 * Returns problems mapped to a specific DSA topic
 */
router.get('/dsa/topic/:topicId/problems', dsaRoadmapController.getDSATopicProblems);

/**
 * POST /api/roadmap/dsa/seed
 * Admin endpoint to seed/reseed the DSA roadmap from canonical sources
 * Requires admin role
 */
router.post('/dsa/seed', dsaRoadmapController.seedDSARoadmapEndpoint);

module.exports = router;

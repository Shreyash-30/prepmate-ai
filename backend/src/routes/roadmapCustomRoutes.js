/**
 * Roadmap Custom Creation Routes
 * Endpoints for creating and managing custom user-defined roadmaps
 */

const express = require('express');
const router = express.Router();
const roadmapCustomController = require('../controllers/roadmapCustomController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// All custom roadmap routes require authentication
router.use(authMiddleware);

// POST /roadmaps/custom - Create custom roadmap
router.post('/', roadmapCustomController.createCustomRoadmap);

// POST /roadmaps/custom/:roadmapId/topics - Add topics to roadmap
router.post('/:roadmapId/topics', roadmapCustomController.addTopicsToRoadmap);

// PUT /roadmaps/custom/:roadmapId/topics/:topicId - Update topic in roadmap
router.put('/:roadmapId/topics/:topicId', roadmapCustomController.updateRoadmapTopic);

module.exports = router;

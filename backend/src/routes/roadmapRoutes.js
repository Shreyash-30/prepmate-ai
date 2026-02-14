const express = require('express');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../middlewares/errorHandler');
const {
  getFullDSARoadmap,
  getDSALayers,
  getDSATopics,
  getDSATopicDetail,
  getDSATopicProblems,
} = require('../controllers/dsaRoadmapController');

const router = express.Router();

// ============= DSA Roadmap Endpoints =============

// GET /api/roadmap/dsa
// Full DSA roadmap with 4-layer structure
router.get('/dsa', authMiddleware, asyncHandler(getFullDSARoadmap));

// GET /api/roadmap/dsa/layers
// Roadmap grouped by layers
router.get('/dsa/layers', authMiddleware, asyncHandler(getDSALayers));

// GET /api/roadmap/dsa/topics
// Flattened list of DSA topics with optional filtering
router.get('/dsa/topics', authMiddleware, asyncHandler(getDSATopics));

// GET /api/roadmap/dsa/topic/:topicId
// Detailed information for a specific topic
router.get('/dsa/topic/:topicId', authMiddleware, asyncHandler(getDSATopicDetail));

// GET /api/roadmap/dsa/topic/:topicId/problems
// Problems for a specific topic
router.get('/dsa/topic/:topicId/problems', authMiddleware, asyncHandler(getDSATopicProblems));

// ============= Legacy Endpoints (Placeholders) =============

// Get user roadmap (placeholder)
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Roadmap endpoint - feature to be implemented',
    data: {
      roadmaps: [],
    },
  });
}));

// Get specific roadmap (placeholder)
router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Get specific roadmap - feature to be implemented',
    data: null,
  });
}));

// Create roadmap (placeholder)
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  res.status(201).json({
    success: true,
    message: 'Create roadmap - feature to be implemented',
    data: null,
  });
}));

// Update roadmap (placeholder)
router.put('/:id', authMiddleware, asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Update roadmap - feature to be implemented',
    data: null,
  });
}));

module.exports = router;

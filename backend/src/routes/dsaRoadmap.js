/**
 * DSA Roadmap Routes
 * Endpoints for comprehensive DSA roadmap with layered structure,
 * PCI compatibility, and AI/ML integration hooks
 */

const express = require('express');
const router = express.Router();
const dsaRoadmapController = require('../controllers/dsaRoadmapController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * PUBLIC ENDPOINTS (no auth required for GET)
 */

// GET /api/roadmap/dsa
// Returns full DSA roadmap with layered structure, weights, interview frequency
// Frontend uses to render complete roadmap view
router.get('/', dsaRoadmapController.getFullDSARoadmap);

// GET /api/roadmap/dsa/topics
// Returns flattened list of all topics with optional filtering
// Query params: ?layer=core&difficulty=medium&search=arrays
router.get('/topics', dsaRoadmapController.getDSATopics);

// GET /api/roadmap/dsa/layers
// Returns roadmap grouped by layers with statistics
// Useful for navigation and progress visualization
router.get('/layers', dsaRoadmapController.getDSALayers);

// GET /api/roadmap/dsa/topic/:topicId
// Returns detailed topic information with dependencies and resources
router.get('/topic/:topicId', dsaRoadmapController.getDSATopicDetail);

/**
 * ADMIN ENDPOINTS (require auth and admin role)
 */

// POST /api/roadmap/dsa/seed
// Admin only: Seeds/reseeds the DSA roadmap from canonical sources
router.post('/seed', authMiddleware, dsaRoadmapController.seedDSARoadmapEndpoint);

module.exports = router;

const express = require('express');
const { authMiddleware } = require('../middlewares/authMiddleware');
const mentorController = require('../controllers/mentorController');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/mentor/chat
 * Send message to AI mentor
 */
router.post('/chat', mentorController.chat);

/**
 * GET /api/mentor/history
 * Get chat history
 */
router.get('/history', mentorController.getHistory);

/**
 * GET /api/mentor/recommendations
 * Get personalized recommendations
 */
router.get('/recommendations', mentorController.getRecommendations);

module.exports = router;

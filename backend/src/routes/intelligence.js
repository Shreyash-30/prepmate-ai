/**
 * Intelligence Routes
 * Complete unified intelligence API endpoints
 * 
 * Base: /api/intelligence
 */

const express = require('express');
const router = express.Router();
const intelligenceController = require('../controllers/intelligenceController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

/**
 * Learner Model & Profiling
 */
router.get('/profile/:userId', intelligenceController.getLearnerProfile);
router.get('/behavior/:userId', intelligenceController.getBehavioralIntelligence);

/**
 * Readiness & Assessment
 */
router.get('/readiness/:userId', intelligenceController.getReadinessScore);

/**
 * Recommendations
 */
router.get('/recommendations/:userId', intelligenceController.getRecommendations);
router.post('/practice-problems', intelligenceController.getNextPracticeProblems);
router.post('/revision-problems', intelligenceController.getRevisionProblems);

/**
 * Dashboard Integration
 */
router.get('/dashboard/:userId', intelligenceController.getDashboardIntelligence);

/**
 * LLM-Powered Features
 */
router.post('/hint', intelligenceController.generateHint);
router.post('/explain-mistake', intelligenceController.explainMistake);
router.post('/tutor', intelligenceController.tutorChat);
router.post('/code-review', intelligenceController.generateCodeReview);

/**
 * Admin Operations
 */
router.post('/batch-recompute/:userId', intelligenceController.triggerBatchRecompute);

module.exports = router;

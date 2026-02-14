/**
 * AI Telemetry Routes
 * Endpoints for mastery/readiness analysis and ML predictions
 */

const express = require('express');
const router = express.Router();
const aiTelemetryController = require('../controllers/aiTelemetryController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

/**
 * Telemetry Processing
 */
router.post('/process/:userId', aiTelemetryController.processTelemetry);

/**
 * Mastery & Readiness Profiles
 */
router.get('/mastery/:userId', aiTelemetryController.getMasteryProfile);
router.get('/readiness/:userId', aiTelemetryController.getReadinessProfile);

/**
 * AI Predictions & Insights
 */
router.get('/predictions/:userId', aiTelemetryController.getPredictions);
router.get('/insights/:userId', aiTelemetryController.getInsights);

/**
 * Data Transmission to AI Services
 */
router.post('/mastery-input/:userId', aiTelemetryController.sendMasteryInput);
router.post('/readiness-input/:userId', aiTelemetryController.sendReadinessInput);

module.exports = router;

/**
 * AI Telemetry Routes
 * Router for all AI/ML telemetry endpoints
 */

const express = require('express');
const aiTelemetryRoutes = require('./aiTelemetry');

const router = express.Router();

// Register AI telemetry sub-routes
// All /api/ai/* routes are delegated to aiTelemetry routes
router.use('/', aiTelemetryRoutes);

module.exports = router;

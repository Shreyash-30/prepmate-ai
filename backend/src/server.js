// Load environment variables from root .env file (central configuration)
const path = require('path');
const dotenv = require('dotenv');

const rootEnvPath = path.join(__dirname, '../../.env');
dotenv.config({ path: rootEnvPath });

// Also load from local .env if it exists (overrides root)
dotenv.config();

const app = require('./app');
const { connectDB } = require('./config/db');
const scheduledSyncService = require('./services/scheduledSyncService');
const { initializeSubmissionQueue } = require('./workers/submissionIntelligenceWorker');
const { initializeSchedulers, stopAllSchedulers } = require('./workers/automationSchedulers');
const { initializeWebSocket } = require('./services/websocket');
const http = require('http');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create HTTP server for WebSocket support
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Initialize scheduled sync service
if (process.env.ENABLE_SCHEDULED_SYNC !== 'false') {
  scheduledSyncService.initialize().catch(error => {
    console.error('Failed to initialize scheduled sync:', error);
  });
}

// Initialize submission intelligence queue
if (process.env.ENABLE_SUBMISSION_QUEUE !== 'false' && process.env.ENABLE_SUBMISSION_QUEUE !== 'disabled') {
  try {
    initializeSubmissionQueue();
    console.log('✅ Submission Intelligence Queue initialized');
  } catch (error) {
    console.warn('⚠️ Submission Intelligence Queue failed to initialize:', error.message);
    console.warn('Continuing without queue - check Redis connection');
  }
}

// Initialize automation schedulers
if (process.env.ENABLE_AUTOMATION_SCHEDULERS !== 'false') {
  initializeSchedulers();
  console.log('✅ Automation Schedulers initialized');
}

// Initialize WebSocket
if (process.env.ENABLE_WEBSOCKET !== 'false') {
  try {
    initializeWebSocket(server);
    console.log('✅ WebSocket initialized');
  } catch (error) {
    console.warn('WebSocket initialization failed:', error.message);
  }
}

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
  console.log(`📍 Frontend URL: ${process.env.CLIENT_URL}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  scheduledSyncService.stopAll();
  stopAllSchedulers();
  server.close(() => process.exit(0));
});

module.exports = server;

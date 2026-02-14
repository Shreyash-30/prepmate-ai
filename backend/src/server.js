require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');
const scheduledSyncService = require('./services/scheduledSyncService');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Connect to MongoDB
connectDB();

// Initialize scheduled sync service
if (process.env.ENABLE_SCHEDULED_SYNC !== 'false') {
  scheduledSyncService.initialize().catch(error => {
    console.error('Failed to initialize scheduled sync:', error);
  });
}

// Start server
const server = app.listen(PORT, () => {
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
  server.close(() => process.exit(0));
});

module.exports = server;

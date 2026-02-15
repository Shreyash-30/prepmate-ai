/**
 * WebSocket Setup for Real-time Automation Updates
 * Integrates socket.io with Express server
 */

const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;
const connectedUsers = new Map(); // userId -> socket

/**
 * Initialize WebSocket server
 */
function initializeWebSocket(server) {
  io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Middleware: Authentication
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const userId = socket.handshake.auth.userId;

      if (!token || !userId) {
        return next(new Error('Authentication error'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

      if (decoded.id !== userId) {
        return next(new Error('Token userId mismatch'));
      }

      socket.userId = userId;
      socket.decoded = decoded;

      next();
    } catch (error) {
      next(new Error(`Authentication failed: ${error.message}`));
    }
  });

  // Connection handler
  io.on('connection', socket => {
    const userId = socket.userId;

    console.log(`✅ User ${userId} connected via WebSocket (${socket.id})`);

    // Store user connection
    connectedUsers.set(userId, socket);

    // Join user-specific room
    socket.join(`user:${userId}`);

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`❌ User ${userId} disconnected`);
      connectedUsers.delete(userId);
    });

    // Error handler
    socket.on('error', error => {
      console.error(`WebSocket error for user ${userId}:`, error);
    });
  });

  console.log('✅ WebSocket server initialized');

  return io;
}

/**
 * Get socket instance
 */
function getIO() {
  if (!io) {
    throw new Error('WebSocket not initialized. Call initializeWebSocket first.');
  }
  return io;
}

/**
 * Send event to specific user
 */
function sendToUser(userId, event, data) {
  const socket = connectedUsers.get(userId.toString());
  if (socket) {
    socket.emit(event, data);
  }
}

/**
 * Broadcast to all connected users
 */
function broadcastToAll(event, data) {
  getIO().emit(event, data);
}

/**
 * Broadcast to all except one user
 */
function broadcastToAllExcept(userId, event, data) {
  getIO().to(`user:${userId}`).emit(event, data);
}

// ============================================================================
// Automation Event Emitters
// ============================================================================

/**
 * Emit task completed event
 */
function emitTaskCompleted(userId, taskData) {
  sendToUser(userId, 'task:completed', {
    taskId: taskData._id,
    title: taskData.title,
    completedAt: taskData.completedAt,
    score: taskData.score,
  });
}

/**
 * Emit task created event
 */
function emitTaskCreated(userId, taskData) {
  sendToUser(userId, 'task:created', {
    taskId: taskData._id,
    title: taskData.title,
    type: taskData.taskType,
    priority: taskData.priority,
    scheduledDate: taskData.scheduledDate,
  });
}

/**
 * Emit compliance updated event
 */
function emitComplianceUpdated(userId, complianceData) {
  sendToUser(userId, 'compliance:updated', {
    userId,
    completionRate: complianceData.completionRate,
    consistency_index: complianceData.consistency_index,
    currentStreak: complianceData.currentStreak,
    complianceStatus: complianceData.complianceStatus,
  });
}

/**
 * Emit readiness calculated event
 */
function emitReadinessCalculated(userId, readinessData) {
  sendToUser(userId, 'readiness:calculated', {
    userId,
    score: readinessData.overallReadinessScore,
    level: readinessData.readinessLevel,
    trend: readinessData.readinessTrend,
  });
}

/**
 * Emit plan generated event
 */
function emitPlanGenerated(userId, planData) {
  sendToUser(userId, 'plan:generated', {
    userId,
    tasksCreated: planData.tasksCreated,
    executionId: planData.executionId,
    timestamp: new Date(),
  });
}

/**
 * Emit automation started event
 */
function emitAutomationTriggered(userId, automationData) {
  sendToUser(userId, 'automation:triggered', {
    userId,
    pipelineType: automationData.pipelineType,
    executionId: automationData.executionId,
    startTime: automationData.startTime,
  });
}

/**
 * Emit automation completed event
 */
function emitAutomationCompleted(userId, automationData) {
  sendToUser(userId, 'automation:completed', {
    userId,
    pipelineType: automationData.pipelineType,
    executionId: automationData.executionId,
    duration: automationData.duration,
    status: automationData.status,
  });
}

/**
 * Emit automation failed event
 */
function emitAutomationFailed(userId, automationData) {
  sendToUser(userId, 'automation:failed', {
    userId,
    pipelineType: automationData.pipelineType,
    executionId: automationData.executionId,
    error: automationData.error,
  });
}

/**
 * Emit streak milestone
 */
function emitStreakMilestone(userId, milestone) {
  sendToUser(userId, 'compliance:streakMilestone', {
    userId,
    streak: milestone.streak,
    message: milestone.message,
    timestamp: new Date(),
  });
}

module.exports = {
  initializeWebSocket,
  getIO,
  sendToUser,
  broadcastToAll,
  broadcastToAllExcept,
  emitTaskCompleted,
  emitTaskCreated,
  emitComplianceUpdated,
  emitReadinessCalculated,
  emitPlanGenerated,
  emitAutomationTriggered,
  emitAutomationCompleted,
  emitAutomationFailed,
  emitStreakMilestone,
};

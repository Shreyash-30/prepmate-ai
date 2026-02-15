/**
 * PRODUCTION INTEGRATION QUICK START
 * ===================================
 * 
 * Implementation checklist to get the unified intelligence system running
 */

// ============================================================
// 1. SERVER INITIALIZATION
// ============================================================
// Add to backend/src/server.js or app.js startup:

/*
// Smart Intelligence Initialization
const intelligenceCore = require('./services/intelligenceCore');
const { intelligenceQueue, mlUpdateQueue, getWorkerStatus } = require('./workers/intelligenceWorker');

// Initialize all intelligence services
intelligenceCore.initialize();
console.log('✅ Intelligence services initialized');

// Monitor worker health
app.get('/api/health/workers', async (req, res) => {
  const status = await getWorkerStatus();
  res.json({ success: true, data: status });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await require('./workers/intelligenceWorker').shutdown();
  process.exit(0);
});
*/

// ============================================================
// 2. SUBMISSION PROCESSING - NOW INTEGRATED
// ============================================================
// This is already in submissionsController.js line 13:

import { queueSubmissionIntelligence } from '../workers/intelligenceWorker';

// When submission is created:
async function createSubmission(req, res) {
  const submission = await UserSubmission.create(submissionData);
  
  // ✓ Automatically queued for intelligence processing
  queueSubmissionIntelligence(submission._id);
  
  return res.status(201).json({ success: true, data: submission });
}

// ============================================================
// 3. API ENDPOINTS - USE THESE IN YOUR FRONTEND
// ============================================================

// Get learner profile (all intelligence in one place):
// GET /api/intelligence/profile/:userId
// Response: {
//   skillIntelligence: { topics: [...], overall_mastery: 0.7, ... },
//   performanceIntelligence: { accuracy_trend, solving_speed, ... },
//   behavioralIntelligence: { consistency_score, persistence_score, ... },
//   interviewIntelligence: { avg_coding_score, reasoning_score, ... },
//   readiness: { score: 0.75, ... }
// }

// Get recommendations:
// GET /api/intelligence/recommendations/:userId
// Response: {
//   practice: [...],
//   revision: [...],
//   learning: [...],
//   interview: [...],
//   adaptive: [...]
// }

// Get dashboard intelligence (what dashboard needs):
// GET /api/intelligence/dashboard/:userId
// Response: {
//   skillIntelligence: {...},
//   performanceIntelligence: {...},
//   behavioralIntelligence: {...},
//   readiness: {...},
//   topRecommendations: { practice: [...], revision: [...], ... },
//   lastUpdated: ISO timestamp
// }

// Get next practice problems:
// POST /api/intelligence/practice-problems
// Body: { count: 3 }
// Response: [{ problemId, difficulty, reason, ... }, ...]

// Generate hint:
// POST /api/intelligence/hint
// Body: { problemId, problemDescription, userAttempt, hintsCount, masteryLevel }
// Response: { hint, hintLevel, guidanceType }

// Get hint:
// POST /api/intelligence/explain-mistake
// Body: { problemId, userCode, expectedOutput, actualOutput, errorMessage, ... }
// Response: { explanation, errorType, correctionSteps, conceptsToReview }

// Tutor/Mentor:
// POST /api/intelligence/tutor
// Body: { topic, userMessage, masteryLevel, conversationId }
// Response: { response, suggestedActions, conversationId }

// ============================================================
// 4. SERVICE CONFIGURATION
// ============================================================

const SERVICE_URLS = {
  backend: 'http://localhost:5000',
  aiServices: 'http://localhost:8000',
  frontend: 'http://localhost:8080'
};

// ============================================================
// 5. FRONTEND INTEGRATION EXAMPLES
// ============================================================

// DASHBOARD INTEGRATION:
async function loadDashboard(userId) {
  const response = await fetch(`${SERVICE_URLS.backend}/api/intelligence/dashboard/${userId}`);
  const { data } = await response.json();
  
  // Display learner profile
  displayProfile(data.skillIntelligence);
  
  // Display performance trends
  displayPerformance(data.performanceIntelligence);
  
  // Display readiness indicator
  displayReadiness(data.readiness);
  
  // Display top recommendations
  displayRecommendations(data.topRecommendations);
}

// PRACTICE PAGE INTEGRATION:
async function loadPracticeRecommendations(userId) {
  const response = await fetch(`${SERVICE_URLS.backend}/api/intelligence/practice-problems`, {
    method: 'POST',
    body: JSON.stringify({ count: 5 })
  });
  const { data: problems } = await response.json();
  
  // Display recommended problems
  renderProblems(problems);
}

// REVISION PAGE INTEGRATION:
async function loadRevisionTasks(userId) {
  const response = await fetch(`${SERVICE_URLS.backend}/api/intelligence/recommendations/${userId}?type=revision`);
  const { data } = await response.json();
  
  // Display revision recommendations
  renderRevisionTasks(data.revision);
}

// INTERVIEW PAGE INTEGRATION:
async function loadInterviewReadiness(userId) {
  const response = await fetch(`${SERVICE_URLS.backend}/api/intelligence/readiness/${userId}`);
  const { data: readiness } = await response.json();
  
  // Display readiness score and breakdown
  renderReadiness(readiness);
  
  // Display interview recommendations
  const recsResponse = await fetch(`${SERVICE_URLS.backend}/api/intelligence/recommendations/${userId}?type=interview`);
  const { data: recs } = await recsResponse.json();
  renderInterviewRecs(recs.interview);
}

// MENTOR CHAT INTEGRATION:
async function sendMentorMessage(userId, message, topic) {
  const response = await fetch(`${SERVICE_URLS.backend}/api/intelligence/tutor`, {
    method: 'POST',
    body: JSON.stringify({
      topic,
      userMessage: message,
      masteryLevel: 'intermediate'
    })
  });
  const { data } = await response.json();
  
  // Display mentor response
  addToChatHistory({
    role: 'assistant',
    content: data.response
  });
}

// HINT GENERATION INTEGRATION:
async function getHintForProblem(problemId, attempt) {
  const response = await fetch(`${SERVICE_URLS.backend}/api/intelligence/hint`, {
    method: 'POST',
    body: JSON.stringify({
      problemId,
      userAttempt: attempt,
      hintsCount: 1,
      masteryLevel: 'beginner'
    })
  });
  const { data } = await response.json();
  
  // Display hint
  showHint(data.hint, data.guidanceType);
}

// ============================================================
// 6. BEHAVIORAL SIGNALS CAPTURED (AUTOMATIC)
// ============================================================
// These are automatically extracted when submissions are processed:

const automaticSignals = {
  practice: [
    'timeToFirstValidStrategy',     // How quickly found approach
    'improvementAfterHint',          // Did hints help?
    'errorPattern',                  // Type of error (efficiency/logic/edge case)
    'strategyChangeCount',           // Number of different approaches
    'consistencySignal',             // Success rate stability
    'persistenceIndicator',          // Recovery from failures
    'efficacyScore',                 // Overall learning efficiency
    'learningVelocity'               // Improvement rate
  ],
  interview: [
    'communicationScore',            // Clarity of explanation
    'reasoningAccuracy',             // Logical correctness
    'codeQuality',                   // Code readability/patterns
    'timeManagement',                // Time allocation
    'pressurePerformance',           // Performance under stress
    'algorithmicThinking',           // Algorithmic approach quality
    'clarityScore',                  // Verbal clarity
    'confidenceLevel'                // Confidence indicators
  ]
};

// ============================================================
// 7. LEARNER PROFILE STRUCTURE
// ============================================================
// What the unified profile contains:

const learnerProfile = {
  userId: 'user-123',
  timestamp: new Date(),
  
  skillIntelligence: {
    topics: [
      {
        topicId: 'arrays',
        mastery_score: 0.85,
        attempts: 45,
        success_rate: 82,
        difficulty_level_reached: 'hard',
        readiness_score: 0.88,
        trend: 'improving'
      },
      // ... more topics
    ],
    overall_mastery: 0.72,
    priority_topics: ['graphs', 'dp'] // Weak areas
  },
  
  performanceIntelligence: {
    accuracy_trend: 'improving',
    success_rate: 75,
    avg_time_ms: 420000,
    solving_speed_vs_expected: 'above_avg',
    retry_patterns: { retries_needed: 12, avg_attempts: 1.3 },
    hint_dependency: 0.15,
    improvement_velocity: 0.08,
    total_problems_solved: 145,
    total_attempts: 189
  },
  
  behavioralIntelligence: {
    consistency_score: 0.82,
    persistence_score: 0.75,
    topic_switching_behavior: 8,
    learning_efficiency_score: 0.79,
    study_streak: 14
  },
  
  interviewIntelligence: {
    avg_coding_score: 0.78,
    reasoning_score: 0.82,
    communication_score: 0.71,
    pressure_performance_score: 0.68,
    time_management_score: 0.75,
    sessions_count: 5,
    trend: 'improving'
  },
  
  readiness: {
    score: 0.74,
    details: {
      mastery_component: 0.72,
      consistency_component: 0.82,
      velocity_component: 0.08
    }
  }
};

// ============================================================
// 8. RECOMMENDATION STRUCTURE
// ============================================================
// What recommendations look like:

const recommendations = {
  practice: [
    {
      type: 'practice',
      priority: 'high',
      topicId: 'graphs',
      difficulty: 'medium',
      rationale: 'High risk score (0.72) - reinforce fundamentals',
      estimatedTime: 30,
      problemCount: 5
    }
  ],
  revision: [
    {
      type: 'revision',
      priority: 'high',
      topicId: 'arrays',
      rationale: 'Retention-based review (Last: 12d ago)',
      problemCount: 3,
      estimatedTime: 20
    }
  ],
  interview: [
    {
      type: 'interview',
      priority: 'high',
      action: 'mock_interview',
      message: 'You\'re ready for mock interviews',
      frequency: 'weekly'
    }
  ]
};

// ============================================================
// 9. ENVIRONMENT SETUP REQUIRED
// ============================================================
// Add to .env:

/*
# Backend Server
BACKEND_PORT=5000

# Frontend
FRONTEND_PORT=8080

# Intelligence Queue
REDIS_HOST=localhost
REDIS_PORT=6379

# AI Services
AI_SERVICES_URL=http://localhost:8000

# LLM Service
GEMINI_API_KEY=your_key_here
*/

// ============================================================
// 10. TESTING THE SYSTEM
// ============================================================

async function testIntelligenceSystem() {
  const userId = 'test-user-123';
  
  // 1. Create test submission
  const submission = await UserSubmission.create({
    userId,
    problemId: 'problem-1',
    isCorrect: true,
    submittedAt: new Date(),
    solutionTimeMs: 180000
  });
  
  console.log('Created submission:', submission._id);
  
  // 2. Wait for worker to process
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // 3. Check profile
  const profileRes = await fetch(`${SERVICE_URLS.backend}/api/intelligence/profile/${userId}`);
  const profile = await profileRes.json();
  console.log('Profile:', profile.data);
  
  // 4. Check recommendations
  const recsRes = await fetch(`${SERVICE_URLS.backend}/api/intelligence/recommendations/${userId}`);
  const recs = await recsRes.json();
  console.log('Recommendations:', recs.data);
  
  // 5. Check dashboard
  const dashRes = await fetch(`${SERVICE_URLS.backend}/api/intelligence/dashboard/${userId}`);
  const dash = await dashRes.json();
  console.log('Dashboard:', dash.data);
}

// ============================================================
// 11. PRODUCTION DEPLOYMENT
// ============================================================

const deploymentChecklist = [
  '✓ Redis configured and running',
  '✓ Python ML services deployed',
  '✓ All models have indexes created',
  '✓ Behavioral signal models created',
  '✓ Interview intelligence models created',
  '✓ Queue monitoring set up',
  '✓ Error logging configured',
  '✓ Cache strategy implemented for dashboard',
  '✓ Load tested with 1000+ simultaneous submissions',
  '✓ Graceful shutdown implemented',
  '✓ Monitor memory/CPU with worker load',
  '✓ Set up alerts for queue growth',
  '✓ Document API endpoints for frontend team',
  '✓ Create admin tools for batch recomputation',
  '✓ Implement user-facing insights display'
];

module.exports = {
  deploymentChecklist,
  testIntelligenceSystem,
  integrationExamples: {
    dashboard: 'loadDashboard',
    practice: 'loadPracticeRecommendations',
    revision: 'loadRevisionTasks',
    interview: 'loadInterviewReadiness',
    mentor: 'sendMentorMessage',
    hints: 'getHintForProblem'
  }
};

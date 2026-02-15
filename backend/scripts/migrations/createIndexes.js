const mongoose = require('mongoose');

/**
 * Index Creation Script: Learning Intelligence Profile
 * 
 * Creates all necessary indexes for optimal query performance
 * Run AFTER migrations and deduplication are complete
 * 
 * Indexes created:
 * - User query indexes (userId, lookups)
 * - Temporal indexes (timestamps, schedules)
 * - Score/metric indexes (readiness, mastery)
 * - Compound indexes (userId + other frequently joined fields)
 * - Text indexes (for search if needed)
 * 
 * Usage:
 *   node createIndexes.js
 */

require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/prepmate-ai';

const UserTopicMastery = require('../models/UserTopicMastery');
const UserSubmissionEvent = require('../models/UserSubmissionEvent');
const ExternalPlatformSubmission = require('../models/ExternalPlatformSubmission');
const PracticeBehavioralSignal = require('../models/PracticeBehavioralSignal');
const MockInterviewSession = require('../models/MockInterviewSession');
const MockInterviewVoiceSignal = require('../models/MockInterviewVoiceSignal');
const InterviewPerformanceProfile = require('../models/InterviewPerformanceProfile');
const UserRecommendationLog = require('../models/UserRecommendationLog');
const RevisionRecommendationTask = require('../models/RevisionRecommendationTask');
const UserTopicPracticeProgress = require('../models/UserTopicPracticeProgress');
const UserTopicProgression = require('../models/UserTopicProgression');

async function createIndexes() {
  try {
    console.log('🚀 Creating indexes...');
    
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    let indexCount = 0;

    // UserTopicMastery indexes
    console.log('\n📑 Creating UserTopicMastery indexes...');
    await UserTopicMastery.collection.createIndex({ userId: 1, topicId: 1 }, { unique: true });
    await UserTopicMastery.collection.createIndex({ userId: 1, readinessScore: -1 });
    await UserTopicMastery.collection.createIndex({ userId: 1, masteryScore: -1 });
    await UserTopicMastery.collection.createIndex({ userId: 1, improvementTrend: 1 });
    await UserTopicMastery.collection.createIndex({ userId: 1, lastPracticedAt: -1 });
    await UserTopicMastery.collection.createIndex({ topicId: 1, masteryScore: -1 });
    console.log('   ✔ 6 indexes created');
    indexCount += 6;

    // UserSubmissionEvent indexes
    console.log('\n📑 Creating UserSubmissionEvent indexes...');
    await UserSubmissionEvent.collection.createIndex({ userId: 1, timestamp: -1 });
    await UserSubmissionEvent.collection.createIndex({ userId: 1, topicId: 1, timestamp: -1 });
    await UserSubmissionEvent.collection.createIndex({ userId: 1, isCorrect: 1, timestamp: -1 });
    await UserSubmissionEvent.collection.createIndex({ platform: 1, timestamp: -1 });
    await UserSubmissionEvent.collection.createIndex({ timestamp: -1 });
    await UserSubmissionEvent.collection.createIndex({ _deduplicationKey: 1 }, { unique: true, sparse: true });
    console.log('   ✔ 6 indexes created');
    indexCount += 6;

    // ExternalPlatformSubmission indexes
    console.log('\n📑 Creating ExternalPlatformSubmission indexes...');
    await ExternalPlatformSubmission.collection.createIndex({ userId: 1, platform: 1 });
    await ExternalPlatformSubmission.collection.createIndex({ platform: 1, accepted: 1 });
    await ExternalPlatformSubmission.collection.createIndex({ userId: 1, accepted: 1, lastSubmissionDate: -1 });
    await ExternalPlatformSubmission.collection.createIndex({ canonicalProblemId: 1 });
    await ExternalPlatformSubmission.collection.createIndex({ _deduplicationKey: 1 }, { unique: true, sparse: true });
    console.log('   ✔ 5 indexes created');
    indexCount += 5;

    // PracticeBehavioralSignal indexes
    console.log('\n📑 Creating PracticeBehavioralSignal indexes...');
    await PracticeBehavioralSignal.collection.createIndex({ userId: 1, recordedAt: -1 });
    await PracticeBehavioralSignal.collection.createIndex({ userId: 1, topicId: 1, result: 1 });
    await PracticeBehavioralSignal.collection.createIndex({ recordedAt: -1 });
    await PracticeBehavioralSignal.collection.createIndex({ _deduplicationKey: 1 }, { unique: true, sparse: true });
    console.log('   ✔ 4 indexes created');
    indexCount += 4;

    // MockInterviewSession indexes
    console.log('\n📑 Creating MockInterviewSession indexes...');
    await MockInterviewSession.collection.createIndex({ userId: 1, startTime: -1 });
    await MockInterviewSession.collection.createIndex({ userId: 1, overallScore: -1 });
    await MockInterviewSession.collection.createIndex({ targetCompany: 1 });
    await MockInterviewSession.collection.createIndex({ startTime: -1 });
    await MockInterviewSession.collection.createIndex({ sessionId: 1 }, { unique: true });
    console.log('   ✔ 5 indexes created');
    indexCount += 5;

    // MockInterviewVoiceSignal indexes
    console.log('\n📑 Creating MockInterviewVoiceSignal indexes...');
    await MockInterviewVoiceSignal.collection.createIndex({ userId: 1, recordedAt: -1 });
    await MockInterviewVoiceSignal.collection.createIndex({ sessionId: 1 });
    await MockInterviewVoiceSignal.collection.createIndex({ userId: 1, overallCommunicationScore: -1 });
    console.log('   ✔ 3 indexes created');
    indexCount += 3;

    // InterviewPerformanceProfile indexes
    console.log('\n📑 Creating InterviewPerformanceProfile indexes...');
    await InterviewPerformanceProfile.collection.createIndex({ userId: 1 }, { unique: true });
    await InterviewPerformanceProfile.collection.createIndex({ avgOverallScore: -1 });
    await InterviewPerformanceProfile.collection.createIndex({ isReadyForInterview: 1 });
    await InterviewPerformanceProfile.collection.createIndex({ profileLastCalculatedAt: -1 });
    console.log('   ✔ 4 indexes created');
    indexCount += 4;

    // UserRecommendationLog indexes
    console.log('\n📑 Creating UserRecommendationLog indexes...');
    await UserRecommendationLog.collection.createIndex({ userId: 1, generatedAt: -1 });
    await UserRecommendationLog.collection.createIndex({ userId: 1, status: 1 });
    await UserRecommendationLog.collection.createIndex({ userId: 1, topicId: 1 });
    await UserRecommendationLog.collection.createIndex({ generatedBy: 1, outcome: 1 });
    await UserRecommendationLog.collection.createIndex({ expiresAt: 1 });
    await UserRecommendationLog.collection.createIndex({ _deduplicationKey: 1 }, { unique: true, sparse: true });
    console.log('   ✔ 6 indexes created');
    indexCount += 6;

    // RevisionRecommendationTask indexes
    console.log('\n📑 Creating RevisionRecommendationTask indexes...');
    await RevisionRecommendationTask.collection.createIndex({ userId: 1, nextScheduledRevisionDate: 1 });
    await RevisionRecommendationTask.collection.createIndex({ userId: 1, revisionPriority: -1 });
    await RevisionRecommendationTask.collection.createIndex({ userId: 1, status: 1 });
    await RevisionRecommendationTask.collection.createIndex({ nextScheduledRevisionDate: 1 });
    await RevisionRecommendationTask.collection.createIndex({ userId: 1, topicId: 1 }, { unique: true });
    console.log('   ✔ 5 indexes created');
    indexCount += 5;

    // UserTopicPracticeProgress indexes
    console.log('\n📑 Creating UserTopicPracticeProgress indexes...');
    await UserTopicPracticeProgress.collection.createIndex({ userId: 1, topicId: 1 }, { unique: true });
    await UserTopicPracticeProgress.collection.createIndex({ userId: 1, status: 1 });
    await UserTopicPracticeProgress.collection.createIndex({ userId: 1, currentLevel: 1 });
    await UserTopicPracticeProgress.collection.createIndex({ userId: 1, lastPracticeAt: -1 });
    console.log('   ✔ 4 indexes created');
    indexCount += 4;

    // UserTopicProgression indexes
    console.log('\n📑 Creating UserTopicProgression indexes...');
    await UserTopicProgression.collection.createIndex({ userId: 1, topicId: 1 }, { unique: true });
    await UserTopicProgression.collection.createIndex({ userId: 1, currentDifficultyLevel: 1 });
    await UserTopicProgression.collection.createIndex({ userId: 1, readyForNextLevel: 1 });
    await UserTopicProgression.collection.createIndex({ userId: 1, lastProgressionCheck: 1 });
    await UserTopicProgression.collection.createIndex({ nextProgressionCheckDue: 1 });
    console.log('   ✔ 5 indexes created');
    indexCount += 5;

    console.log(`\n✅ Index creation completed:`);
    console.log(`   Total indexes created: ${indexCount}`);
    console.log('   🚀 Database is now optimized!');

  } catch (error) {
    console.error('❌ Index creation failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Execute
createIndexes();

const mongoose = require('mongoose');

/**
 * Deduplication Script: Learning Intelligence Profile
 * 
 * Identifies and removes duplicate records across all new collections
 * Ensures data integrity before indexes are created
 * 
 * Collections to deduplicate:
 * 1. user_topic_mastery (by userId + topicId)
 * 2. user_submission_events (by _deduplicationKey)
 * 3. external_platform_submissions (by _deduplicationKey)
 * 4. practice_behavioral_signals (by _deduplicationKey)
 * 5. mock_interview_sessions (by sessionId)
 * 6. user_recommendation_log (by _deduplicationKey)
 * 
 * Usage:
 *   node deduplicateIntelligenceCollections.js
 */

require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/prepmate-ai';

const UserTopicMastery = require('../models/UserTopicMastery');
const UserSubmissionEvent = require('../models/UserSubmissionEvent');
const ExternalPlatformSubmission = require('../models/ExternalPlatformSubmission');
const PracticeBehavioralSignal = require('../models/PracticeBehavioralSignal');
const MockInterviewSession = require('../models/MockInterviewSession');
const UserRecommendationLog = require('../models/UserRecommendationLog');
const RevisionRecommendationTask = require('../models/RevisionRecommendationTask');
const UserTopicPracticeProgress = require('../models/UserTopicPracticeProgress');
const UserTopicProgression = require('../models/UserTopicProgression');

async function deduplicateCollection(Model, uniqueFields, description) {
  console.log(`\n🔍 Deduplicating ${description}...`);

  try {
    const collection = Model.collection;
    
    // Build aggregation pipeline for duplicate detection
    const pipeline = [
      {
        $group: {
          _id: uniqueFields.reduce((acc, field) => {
            acc[field] = `$${field}`;
            return acc;
          }, {}),
          duplicateIds: {
            $push: '$_id',
          },
          count: {
            $sum: 1,
          },
        },
      },
      {
        $match: {
          count: {
            $gt: 1,
          },
        },
      },
    ];

    const duplicates = await collection.aggregate(pipeline).toArray();
    console.log(`   Found ${duplicates.length} duplicate groups`);

    let deletedCount = 0;

    // Delete duplicates, keeping the first one
    for (const dupGroup of duplicates) {
      const idsToDelete = dupGroup.duplicateIds.slice(1); // Keep first, delete rest
      const result = await Model.deleteMany({ _id: { $in: idsToDelete } });
      deletedCount += result.deletedCount;
    }

    console.log(`   ✔ Deleted ${deletedCount} duplicate records`);
    
    const finalCount = await Model.countDocuments({});
    console.log(`   📊 Collection now has ${finalCount} unique records`);

    return deletedCount;
  } catch (error) {
    console.error(`   ❌ Error during deduplication: ${error.message}`);
    return 0;
  }
}

async function deduplicateAll() {
  try {
    console.log('🚀 Starting deduplication process...');
    
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    let totalDeleted = 0;

    // Deduplicate each collection
    totalDeleted += await deduplicateCollection(
      UserTopicMastery,
      ['userId', 'topicId'],
      'UserTopicMastery'
    );

    totalDeleted += await deduplicateCollection(
      UserSubmissionEvent,
      ['_deduplicationKey'],
      'UserSubmissionEvent'
    );

    totalDeleted += await deduplicateCollection(
      ExternalPlatformSubmission,
      ['_deduplicationKey'],
      'ExternalPlatformSubmission'
    );

    totalDeleted += await deduplicateCollection(
      PracticeBehavioralSignal,
      ['_deduplicationKey'],
      'PracticeBehavioralSignal'
    );

    totalDeleted += await deduplicateCollection(
      MockInterviewSession,
      ['sessionId'],
      'MockInterviewSession'
    );

    totalDeleted += await deduplicateCollection(
      UserRecommendationLog,
      ['_deduplicationKey'],
      'UserRecommendationLog'
    );

    totalDeleted += await deduplicateCollection(
      RevisionRecommendationTask,
      ['userId', 'topicId'],
      'RevisionRecommendationTask'
    );

    totalDeleted += await deduplicateCollection(
      UserTopicPracticeProgress,
      ['userId', 'topicId'],
      'UserTopicPracticeProgress'
    );

    totalDeleted += await deduplicateCollection(
      UserTopicProgression,
      ['userId', 'topicId'],
      'UserTopicProgression'
    );

    console.log(`\n✅ Deduplication completed:`);
    console.log(`   Total records deleted: ${totalDeleted}`);
    console.log('   💪 All collections are now clean!');

  } catch (error) {
    console.error('❌ Deduplication failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Execute
deduplicateAll();

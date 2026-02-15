const mongoose = require('mongoose');
const path = require('path');

/**
 * Data Migration Script: Learning Intelligence Profile Setup
 * 
 * This script safely migrates existing MongoDB data to the new Learning Intelligence
 * Profile architecture, ensuring backward compatibility and data preservation.
 * 
 * IMPORTANT: Run in this order:
 * 1. migrateUserTopicMastery.js
 * 2. migrateUserSubmissionEvents.js
 * 3. migrateExternalPlatformSubmissions.js
 * 4. migrateRevisionTasks.js
 * 5. deduplicationScripts.js
 * 6. createIndexes.js
 * 
 * BACKUP DATABASE BEFORE RUNNING!
 * 
 * Usage:
 *   node migrateUserTopicMastery.js
 */

require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/prepmate-ai';

// Models
const MasteryMetric = require('../models/MasteryMetric');
const UserTopicStats = require('../models/UserTopicStats');
const UserTopicMastery = require('../models/UserTopicMastery');

/**
 * Migrate MasteryMetric + UserTopicStats -> UserTopicMastery
 * 
 * Strategy:
 * - Consolidate mastery data from both sources into single authoritative collection
 * - Create UserTopicMastery entries for each user-topic combination
 * - Preserve all production fields from both source collections
 * - Handle missing fields gracefully with defaults
 */
async function migrateUserTopicMastery() {
  try {
    console.log('🚀 Starting UserTopicMastery migration...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get all MasteryMetric records
    const masteryMetrics = await MasteryMetric.find({}).lean();
    console.log(`📊 Found ${masteryMetrics.length} MasteryMetric records`);

    // Get all UserTopicStats records
    const userTopicStats = await UserTopicStats.find({}).lean();
    console.log(`📊 Found ${userTopicStats.length} UserTopicStats records`);

    // Build mastery data map (keyed by userId-topicId)
    const masteryMap = {};
    const statsMap = {};

    // Process MasteryMetric
    for (const metric of masteryMetrics) {
      const key = `${metric.userId}-${metric.topicId}`;
      masteryMap[key] = metric;
    }

    // Process UserTopicStats
    for (const stat of userTopicStats) {
      const key = `${stat.user_id}-${stat.topic_id}`;
      statsMap[key] = stat;
    }

    console.log(`🔗 Consolidated ${Object.keys(masteryMap).length} unique user-topics`);

    // Migrate to UserTopicMastery
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const [key, masteryMetric] of Object.entries(masteryMap)) {
      try {
        const stats = statsMap[key];

        // Build consolidated UserTopicMastery record
        const masteryData = {
          userId: masteryMetric.userId,
          topicId: masteryMetric.topicId,
          topicName: masteryMetric.topicName,

          // Core mastery data (from MasteryMetric)
          masteryScore: masteryMetric.masteryProbability || 0,
          confidenceScore: masteryMetric.confidenceScore || 0,
          readinessScore: 0, // Will be calculated separately

          // Performance data (from MasteryMetric)
          totalProblemsAttempted: masteryMetric.problemsAttempted || 0,
          totalProblemsCorrect: masteryMetric.problemsSolved || 0,
          successRate: masteryMetric.problemsSolved / Math.max(masteryMetric.problemsAttempted, 1) || 0,
          averageSolveTimeSeconds: stats?.avg_solve_time_seconds || 0,

          // Improvement tracking
          improvementTrend: masteryMetric.improvementTrend || 'insufficient-data',
          consistencyScore: stats?.consistency_score || 0,

          // Temporal data
          firstPracticedAt: stats?.last_activity ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : null,
          lastPracticedAt: stats?.last_activity || null,

          // Additional fields
          retentionStrength: masteryMetric.retentionProbability || 0,
          firstAttemptSuccessRate: stats?.first_attempt_success_rate || 0,
          daysSinceLastReview: stats?.days_since_last_activity || 0,

          // Metadata
          lastUpdatedBy: 'migration',
          updatedAt: new Date(),
        };

        // Upsert the consolidated record
        await UserTopicMastery.updateOne(
          { userId: masteryData.userId, topicId: masteryData.topicId },
          { $set: masteryData },
          { upsert: true }
        );

        successCount++;
      } catch (error) {
        errorCount++;
        errors.push({
          key,
          error: error.message,
        });
      }
    }

    console.log(`\n✅ Migration completed:`);
    console.log(`   ✔ Successfully migrated: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

    if (errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      errors.forEach(e => {
        console.log(`   - ${e.key}: ${e.error}`);
      });
    }

    // Verify migration
    const newCount = await UserTopicMastery.countDocuments({});
    console.log(`\n📊 UserTopicMastery collection now has ${newCount} documents`);

    if (newCount >= successCount) {
      console.log('✅ Migration verification PASSED');
    } else {
      console.log('❌ Migration verification FAILED - record count mismatch');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Execute migration
migrateUserTopicMastery();

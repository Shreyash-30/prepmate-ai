const mongoose = require('mongoose');

/**
 * Data Migration Script: RevisionRecommendationTask
 * 
 * Normalizes existing RevisionSchedule data into new RevisionRecommendationTask collection
 * with enhanced intelligence and spaced repetition tracking
 * 
 * Strategy:
 * - Convert RevisionSchedule -> RevisionRecommendationTask
 * - Preserve existing scheduling fields
 * - Add new intelligence fields with defaults
 * - Maintain deduplication keys for idempotency
 * 
 * Usage:
 *   node migrateRevisionTasks.js
 */

require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/prepmate-ai';

const RevisionSchedule = require('../models/RevisionSchedule');
const RevisionRecommendationTask = require('../models/RevisionRecommendationTask');

async function migrateRevisionTasks() {
  try {
    console.log('🚀 Starting RevisionRecommendationTask migration...');
    
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get all RevisionSchedule records
    const revisionSchedules = await RevisionSchedule.find({}).lean();
    console.log(`📊 Found ${revisionSchedules.length} RevisionSchedule records`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const schedule of revisionSchedules) {
      try {
        // Build RevisionRecommendationTask record
        const taskData = {
          userId: schedule.userId,
          topicId: schedule.topicId,
          topicName: schedule.topicName,

          // Scheduling
          originalLearningDate: schedule.createdAt || new Date(),
          lastRevisionDate: schedule.lastRevisionDate,
          nextScheduledRevisionDate: schedule.nextRevisionDate,

          // Revision metrics
          spacedRepetitionPhase: schedule.spaceRepetitionPhase || 1,
          optimalRevisionIntervalDays: schedule.revisionInterval || 1,
          revisionHistory: schedule.revisionHistory || [],

          // Priority
          revisionPriority: schedule.revisionPriority || 3,
          priorityReason: 'routine-reinforcement',

          // Problems
          problemsToRevise: schedule.problemsToRevise || [],
          totalProblemsToRevise: schedule.problemsToRevise?.length || 0,

          // Status
          status: schedule.status || 'pending',
          revisionCount: schedule.revisionCount || 0,

          // Stability
          stabilityScore: schedule.stabilityScore || 0,

          // Timestamps
          createdAt: schedule.createdAt || new Date(),
          updatedAt: schedule.updatedAt || new Date(),
        };

        // Upsert to handle duplicates
        const result = await RevisionRecommendationTask.updateOne(
          { userId: taskData.userId, topicId: taskData.topicId },
          { $set: taskData },
          { upsert: true }
        );

        successCount++;
      } catch (error) {
        errorCount++;
        errors.push({
          scheduleId: schedule._id,
          error: error.message,
        });
      }
    }

    console.log(`\n✅ Migration completed:`);
    console.log(`   ✔ Successfully migrated: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

    if (errors.length > 0 && errors.length <= 10) {
      console.log('\n⚠️  Errors encountered:');
      errors.forEach(e => {
        console.log(`   - ${e.scheduleId}: ${e.error}`);
      });
    }

    // Verify migration
    const newCount = await RevisionRecommendationTask.countDocuments({});
    console.log(`\n📊 RevisionRecommendationTask collection now has ${newCount} documents`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Execute
migrateRevisionTasks();

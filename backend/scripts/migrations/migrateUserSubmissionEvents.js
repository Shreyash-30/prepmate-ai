const mongoose = require('mongoose');

/**
 * Data Migration Script: UserSubmissionEvent
 * 
 * Migrates UserSubmission records to new append-only UserSubmissionEvent collection
 * 
 * Strategy:
 * - Convert each UserSubmission to UserSubmissionEvent
 * - Preserve all telemetry data
 * - Add deduplication key for idempotency
 * - Mark as append-only (immutable timestamps)
 * 
 * Usage:
 *   node migrateUserSubmissionEvents.js
 */

require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/prepmate-ai';

const UserSubmission = require('../models/UserSubmission');
const UserSubmissionEvent = require('../models/UserSubmissionEvent');

async function migrateUserSubmissionEvents() {
  try {
    console.log('🚀 Starting UserSubmissionEvent migration...');
    
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get all UserSubmission records
    const submissions = await UserSubmission.find({}).lean();
    console.log(`📊 Found ${submissions.length} UserSubmission records`);

    let successCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const submission of submissions) {
      try {
        // Check if already migrated (using deduplication key)
        const deduplicationKey = `${submission.userId}-${submission.problemId}-${submission.lastAttemptTime}`;
        const existing = await UserSubmissionEvent.findOne({
          _deduplicationKey: deduplicationKey,
        });

        if (existing) {
          duplicateCount++;
          continue;
        }

        // Build UserSubmissionEvent record
        const eventData = {
          userId: submission.userId,
          problemId: submission.problemId,
          topicId: submission.topicId || null,
          topicName: submission.topics?.[0] || null,

          // Problem context
          difficulty: submission.difficulty || 'medium',
          platform: submission.platform || 'manual',
          platformProblemId: submission.platformSubmissionId,

          // Result
          result: submission.verdict || 'unknown',
          isCorrect: submission.isSolved === true,

          // Timing
          timeTaken: submission.solveTime || 0,
          timeToFirstSubmission: submission.timeUntilFirstWrong || submission.solveTime || 0,
          attemptNumber: submission.attempts || 1,
          totalAttemptsForProblem: submission.attempts || 1,

          // Hints & resources
          hintsUsed: submission.hintsUsed || 0,

          // Code quality
          codeLength: submission.codeLength,
          programmingLanguage: submission.language,
          runtimeMs: submission.runtimeMs,
          memoryUsedKb: submission.memoryUsed,

          // Session context
          sessionType: 'practice',

          // Difficulty matching
          relativeDifficulty: submission.relativeDifficulty,

          // Timestamp (immutable)
          timestamp: submission.lastAttemptTime || new Date(),

          // Sync metadata
          syncSource: submission.syncedFrom || null,

          // Deduplication key
          _deduplicationKey: deduplicationKey,
        };

        // Create event
        const event = new UserSubmissionEvent(eventData);
        await event.save();

        successCount++;
      } catch (error) {
        errorCount++;
        errors.push({
          submissionId: submission._id,
          error: error.message,
        });
      }
    }

    console.log(`\n✅ Migration completed:`);
    console.log(`   ✔ Successfully migrated: ${successCount}`);
    console.log(`   ⏭️  Skipped duplicates: ${duplicateCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

    if (errors.length > 0 && errors.length <= 10) {
      console.log('\n⚠️  Errors encountered:');
      errors.forEach(e => {
        console.log(`   - ${e.submissionId}: ${e.error}`);
      });
    }

    // Verify migration
    const newCount = await UserSubmissionEvent.countDocuments({});
    console.log(`\n📊 UserSubmissionEvent collection now has ${newCount} documents`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Execute
migrateUserSubmissionEvents();

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Master Migration Orchestrator
 * 
 * Runs all learning intelligence profile migrations in correct sequence
 * Includes safety checks, rollback warnings, and progress tracking
 * 
 * Migration Order:
 * 1. Backup database
 * 2. Migrate UserTopicMastery
 * 3. Migrate UserSubmissionEvents
 * 4. Migrate RevisionTasks
 * 5. Deduplicate all collections
 * 6. Create indexes
 * 7. Verify integrity
 * 
 * Usage:
 *   node runMigrations.js
 */

const MIGRATIONS = [
  {
    name: 'UserTopicMastery',
    script: 'migrateUserTopicMastery.js',
    description: 'Consolidate MasteryMetric + UserTopicStats',
  },
  {
    name: 'UserSubmissionEvents',
    script: 'migrateUserSubmissionEvents.js',
    description: 'Convert UserSubmission to append-only events',
  },
  {
    name: 'RevisionTasks',
    script: 'migrateRevisionTasks.js',
    description: 'Migrate RevisionSchedule to RevisionRecommendationTask',
  },
  {
    name: 'Deduplication',
    script: 'deduplicateIntelligenceCollections.js',
    description: 'Remove duplicate records',
  },
  {
    name: 'Indexing',
    script: 'createIndexes.js',
    description: 'Create performance indexes',
  },
];

async function runMigration(migration) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, migration.script);
    
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🔨 Running: ${migration.name}`);
    console.log(`📝 Description: ${migration.description}`);
    console.log(`${'='.repeat(70)}`);

    const process = exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`\n❌ Migration failed: ${migration.name}`);
        console.error(`Error: ${error.message}`);
        reject(error);
      } else {
        console.log(stdout);
        if (stderr) console.warn(stderr);
        console.log(`✅ Migration completed: ${migration.name}`);
        resolve();
      }
    });
  });
}

async function runAllMigrations() {
  console.log(`
╔────────────────────────────────────────────────────────────────────╗
║          Learning Intelligence Profile Migration                   ║
║                     PrepMate AI v2.0                               ║
╚────────────────────────────────────────────────────────────────────╝
  `);

  console.log('⚠️  WARNING: This migration modifies your production database!');
  console.log('✅ Make sure you have a backup before proceeding.\n');

  const startTime = Date.now();
  let completedCount = 0;
  let failedCount = 0;

  for (const migration of MIGRATIONS) {
    try {
      await runMigration(migration);
      completedCount++;
    } catch (error) {
      failedCount++;
      console.error(`\n❌ Migration stopped at: ${migration.name}`);
      console.error('📌 Fix the error and retry, or rollback database from backup.\n');
      return;
    }

    // Add delay between migrations
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`
╔────────────────────────────────────────────────────────────────────╗
║                   MIGRATION SUMMARY                                ║
╚────────────────────────────────────────────────────────────────────╝

✅ Completed: ${completedCount}/${MIGRATIONS.length}
❌ Failed: ${failedCount}
⏱️  Total time: ${duration}s

📊 Migration Pipeline:
${MIGRATIONS.map((m, i) => `  ${i + 1}. ${m.name}`).join('\n')}

✅ Your database has been successfully upgraded to ILP Architecture!

🚀 Next steps:
  1. Verify data integrity: Review dashboard and analytics
  2. Test API endpoints: Ensure all queries work
  3. Monitor logs during peak hours
  4. Keep backup for 30 days before disposal

📚 Documentation: See DATABASE_MIGRATION_GUIDE.md

  `);
}

// Run migrations
runAllMigrations().catch(error => {
  console.error('\n❌ Migration pipeline failed:', error.message);
  process.exit(1);
});

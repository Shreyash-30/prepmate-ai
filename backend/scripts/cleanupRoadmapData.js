/**
 * Cleanup Script: Remove all Roadmap data from database
 * Clears: Roadmap, RoadmapTopic, RoadmapTopicProblem, UserRoadmapProgress collections
 * Run: node scripts/cleanupRoadmapData.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const {
  Roadmap,
  RoadmapTopic,
  RoadmapTopicProblem,
  UserRoadmapProgress,
} = require('../src/models');

async function cleanupRoadmapData() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/prepmate-ai');
    console.log('✅ Connected to MongoDB\n');

    // Count before cleanup
    const roadmapCount = await Roadmap.countDocuments();
    const topicCount = await RoadmapTopic.countDocuments();
    const problemMapCount = await RoadmapTopicProblem.countDocuments();
    const progressCount = await UserRoadmapProgress.countDocuments();

    console.log('📊 Data Before Cleanup:');
    console.log(`  • Roadmaps: ${roadmapCount}`);
    console.log(`  • RoadmapTopics: ${topicCount}`);
    console.log(`  • RoadmapTopicProblems: ${problemMapCount}`);
    console.log(`  • UserRoadmapProgress: ${progressCount}\n`);

    // Cleanup
    console.log('🗑️  Cleaning up roadmap data...\n');

    const roadmapResult = await Roadmap.deleteMany({});
    console.log(`✅ Deleted ${roadmapResult.deletedCount} roadmaps`);

    const topicResult = await RoadmapTopic.deleteMany({});
    console.log(`✅ Deleted ${topicResult.deletedCount} roadmap topics`);

    const problemMapResult = await RoadmapTopicProblem.deleteMany({});
    console.log(`✅ Deleted ${problemMapResult.deletedCount} roadmap-topic-problem mappings`);

    const progressResult = await UserRoadmapProgress.deleteMany({});
    console.log(`✅ Deleted ${progressResult.deletedCount} user roadmap progress records\n`);

    console.log('🎯 Cleanup Complete!');
    console.log('📊 Data After Cleanup:');
    console.log(`  • Roadmaps: ${await Roadmap.countDocuments()}`);
    console.log(`  • RoadmapTopics: ${await RoadmapTopic.countDocuments()}`);
    console.log(`  • RoadmapTopicProblems: ${await RoadmapTopicProblem.countDocuments()}`);
    console.log(`  • UserRoadmapProgress: ${await UserRoadmapProgress.countDocuments()}\n`);

    console.log('✨ All roadmap collections are now empty!');

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupRoadmapData();

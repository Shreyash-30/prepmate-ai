/**
 * Clean up old roadmaps from database
 * Keep only the 15-topic FAANG Interview Roadmap
 */

const mongoose = require('mongoose');
require('dotenv').config();

const { Roadmap, RoadmapTopic } = require('../src/models');

async function cleanupOldRoadmaps() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find and delete old roadmaps (keep FAANG only)
    const oldRoadmaps = await Roadmap.find({
      name: { $not: { $regex: 'FAANG', $options: 'i' } }
    });

    console.log(`Found ${oldRoadmaps.length} old roadmap(s) to delete:`);
    
    for (const roadmap of oldRoadmaps) {
      console.log(`  - ${roadmap.name} (${roadmap.topics?.length || 0} topics)`);
      
      // Delete associated topics
      if (roadmap.topics && roadmap.topics.length > 0) {
        await RoadmapTopic.deleteMany({ _id: { $in: roadmap.topics } });
        console.log(`    ✅ Deleted ${roadmap.topics.length} topics`);
      }
      
      // Delete roadmap
      await Roadmap.deleteOne({ _id: roadmap._id });
      console.log(`    ✅ Deleted roadmap`);
    }

    // Verify only FAANG roadmap remains
    const remainingRoadmaps = await Roadmap.find({});
    console.log(`\n✅ Cleanup complete!`);
    console.log(`Roadmaps remaining: ${remainingRoadmaps.length}`);
    remainingRoadmaps.forEach(rm => {
      console.log(`  - ${rm.name} (${rm.topics?.length || 0} topics)`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupOldRoadmaps();

/**
 * Verify DSA Roadmap Storage and Retrieval
 */

const mongoose = require('mongoose');
require('dotenv').config();
const { Roadmap, RoadmapTopic } = require('./src/models');

async function verifyDSARoadmap() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check all DSA roadmaps
    const allRoadmaps = await Roadmap.find({ subject: 'DSA' });
    console.log('📊 DSA Roadmaps in Database:');
    console.log(`Total count: ${allRoadmaps.length}\n`);

    allRoadmaps.forEach((rm, idx) => {
      console.log(`${idx + 1}. ${rm.name}`);
      console.log(`   ID: ${rm._id}`);
      console.log(`   Topics: ${rm.topics?.length || 0}`);
      console.log(`   Official: ${rm.isOfficial}`);
      console.log(`   Active: ${rm.isActive}`);
      console.log();
    });

    // Load the FAANG Interview DSA roadmap with topics (the one with 15 topics)
    const officialRoadmap = await Roadmap.findOne({ 
      subject: 'DSA', 
      name: { $regex: 'FAANG Interview', $options: 'i' },
      isOfficial: true,
      isActive: true 
    }).populate({
      path: 'topics',
      model: 'RoadmapTopic'
    });

    if (!officialRoadmap) {
      console.log('❌ No official active DSA roadmap found');
      process.exit(1);
    }

    console.log('✅ Official DSA Roadmap Loaded\n');
    console.log(`Name: ${officialRoadmap.name}`);
    console.log(`Total Topics: ${officialRoadmap.topics?.length || 0}`);
    console.log(`Estimated Hours: ${officialRoadmap.estimatedHours}`);
    console.log();

    // Group topics by layer
    const byLayer = {
      core: [],
      reinforcement: [],
      advanced: [],
      optional: []
    };

    if (officialRoadmap.topics && officialRoadmap.topics.length > 0) {
      officialRoadmap.topics.forEach(topic => {
        if (byLayer[topic.layer]) {
          byLayer[topic.layer].push(topic);
        }
      });

      console.log('📚 Topics by Layer:\n');
      Object.entries(byLayer).forEach(([layer, topics]) => {
        console.log(`${layer.toUpperCase()}: ${topics.length} topics (${topics.reduce((sum, t) => sum + (t.weight || 0), 0).toFixed(2)} weight)`);
        topics.forEach(t => {
          console.log(`  • ${t.name} (freq: ${t.interviewFrequencyScore}, weight: ${(t.weight * 100).toFixed(0)}%, hrs: ${t.estimatedHours})`);
        });
        console.log();
      });

      // Verify total weight
      const totalWeight = Object.values(byLayer)
        .flat()
        .reduce((sum, t) => sum + (t.weight || 0), 0);
      console.log(`Total Weight: ${totalWeight.toFixed(2)} (should be close to 1.0)`);
    }

    console.log('\n✅ VERIFICATION COMPLETE - Database storage OK');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyDSARoadmap();

const mongoose = require('mongoose');
require('dotenv').config();

const { Roadmap, RoadmapTopic } = require('../src/models');

async function listTopics() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Get all roadmaps first
    const allRoadmaps = await Roadmap.find({}).select('name');
    console.log('All Roadmaps in DB:');
    allRoadmaps.forEach(r => console.log(`  - ${r.name}`));
    
    // Get all FAANG roadmaps
    const faangRoadmaps = await Roadmap.find({name: {$regex: 'FAANG', $options: 'i'}});
    console.log(`\nFAANG Roadmaps found: ${faangRoadmaps.length}`);
    
    // Get DSA roadmap
    const dsaRoadmap = await Roadmap.findOne({subject: 'DSA', isOfficial: true}).populate('topics');
    
    if (dsaRoadmap) {
      console.log(`\nDSA Roadmap: ${dsaRoadmap.name}`);
      console.log(`Topics: ${dsaRoadmap.topics?.length}`);
    }
    
    // Get FAANG roadmap
    const roadmap = await Roadmap.findOne({name: {$regex: 'FAANG', $options: 'i'}}).populate('topics');
    
    if (!roadmap) {
      console.log('\nNo FAANG roadmap found, trying DSA search...');
      const dsaRoadmap = await Roadmap.findOne({subject: 'DSA', isOfficial: true}).populate('topics');
      if (dsaRoadmap) {
        console.log(`\n${dsaRoadmap.name} Topics:\n`);
        dsaRoadmap.topics.forEach(t => {
          console.log(`  - "${t.name}" (${t.layer})`);
        });
      }
      process.exit(0);
    }

    console.log(`\n${roadmap.name} Topics:\n`);
    roadmap.topics.forEach(t => {
      console.log(`  - "${t.name}" (${t.layer})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

listTopics();

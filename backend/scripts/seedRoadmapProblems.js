/**
 * Seed Script: Map Problems to DSA Roadmap Topics
 * Links the 101 seeded problems to appropriate DSA topics
 * Run: node scripts/seedRoadmapProblems.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const {
  Roadmap,
  RoadmapTopic,
  Problem,
  RoadmapTopicProblem,
} = require('../src/models');

// Problem mappings: topic name -> external problem IDs
const PROBLEM_MAPPINGS = {
  'Arrays & Lists': [
    'lc-1', 'lc-26', 'lc-27', 'lc-35', 'lc-66', 'lc-88', 
    'lc-189', 'lc-217', 'lc-238', 'lc-283'
  ],
  'Strings & Pattern Matching': [
    'lc-3', 'lc-14', 'lc-28', 'lc-151', 'lc-205', 'lc-242', 
    'lc-290', 'lc-344'
  ],
  'Hash Tables': [
    'lc-49', 'lc-128', 'lc-136', 'lc-169', 'lc-202', 'lc-260', 
    'lc-349', 'lc-350'
  ],
  'Two Pointers': [
    'lc-11', 'lc-125', 'lc-141', 'lc-167', 'lc-345', 'lc-633', 'lc-680'
  ],
  'Sliding Window': [
    'lc-30', 'lc-76', 'lc-159', 'lc-209', 'lc-438', 'lc-567'
  ],
  'Linked Lists': [
    'lc-2', 'lc-21', 'lc-83', 'lc-92', 'lc-206', 'lc-237', 'lc-328', 'lc-430'
  ],
  'Stacks': [
    'lc-20', 'lc-71', 'lc-155', 'lc-456', 'lc-496', 'lc-503'
  ],
  'Queues': [
    'lc-225', 'lc-232', 'lc-622', 'lc-641', 'cf-1'
  ],
  'Binary Search': [
    'lc-33', 'lc-34', 'lc-69', 'lc-162', 'lc-270', 'lc-540', 'lc-658'
  ],
  'Trees & Binary Trees': [
    'lc-94', 'lc-100', 'lc-101', 'lc-102', 'lc-104', 'lc-110', 
    'lc-124', 'lc-235', 'lc-236', 'lc-297'
  ],
  'Recursion & Backtracking': [
    'lc-17', 'lc-39', 'lc-40', 'lc-46', 'lc-47', 'lc-77', 'lc-79', 'lc-90'
  ],
  'Graph Traversal (BFS/DFS)': [
    'lc-97', 'lc-103', 'lc-133', 'lc-200', 'lc-207', 'lc-210', 'lc-269', 'lc-310'
  ],
  'Dynamic Programming': [
    'lc-5', 'lc-10', 'lc-62', 'lc-63', 'lc-70', 'lc-72', 
    'lc-121', 'lc-139', 'lc-198', 'lc-213'
  ],
};

const seedRoadmapProblems = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/prepmate-ai';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Get the official DSA roadmap
    const roadmap = await Roadmap.findOne({
      subject: 'DSA',
      isOfficial: true,
    });

    if (!roadmap) {
      console.error('❌ DSA Roadmap not found. Run: npm run seed:dsa');
      process.exit(1);
    }

    console.log(`📌 Found DSA Roadmap: ${roadmap._id}`);

    // Clear existing mappings
    await RoadmapTopicProblem.deleteMany({
      topicId: { $in: roadmap.topics },
    });

    console.log('🗑️  Cleared existing problem mappings');

    // Map problems to topics
    let totalMappings = 0;
    const mappingPromises = [];

    for (const [topicName, externalIds] of Object.entries(PROBLEM_MAPPINGS)) {
      // Find the topic
      const topic = await RoadmapTopic.findOne({
        roadmapId: roadmap._id,
        name: topicName,
      });

      if (!topic) {
        console.warn(`⚠️  Topic not found: ${topicName}`);
        continue;
      }

      // Find all problems with matching externalIds
      const problems = await Problem.find({
        externalId: { $in: externalIds },
      });

      if (problems.length === 0) {
        console.warn(`⚠️  No problems found for topic: ${topicName}`);
        continue;
      }

      // Create mappings with proper ordering
      const mappings = problems.map((problem, index) => ({
        topicId: topic._id,
        problemId: problem._id,
        recommendedOrder: index + 1,
        importanceScore: problem.difficulty === 'easy' ? 0.8 : problem.difficulty === 'medium' ? 0.6 : 0.4,
        importance_weight: problem.difficulty === 'easy' ? 0.8 : problem.difficulty === 'medium' ? 0.6 : 0.4,
        difficulty: problem.difficulty,
      }));

      mappingPromises.push(
        RoadmapTopicProblem.insertMany(mappings).catch(err => {
          console.error(`Error mapping problems to ${topicName}:`, err.message);
        })
      );

      totalMappings += mappings.length;
      console.log(`✅ Mapped ${mappings.length} problems to topic: ${topicName}`);
    }

    // Wait for all mappings to complete
    await Promise.all(mappingPromises);

    console.log(`\n✨ Seeding Complete!`);
    console.log(`📊 Total Problem-Topic Mappings: ${totalMappings}`);
    console.log(`\n🎯 Roadmap is now ready to serve problems by topic!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding problems:', error);
    process.exit(1);
  }
};

seedRoadmapProblems();

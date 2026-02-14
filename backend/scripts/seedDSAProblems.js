/**
 * Seed DSA Topic Problems
 * Maps curated problems from multiple platforms (LeetCode, Codeforces, HackerRank) to DSA topics
 * Creates RoadmapTopicProblem associations with importance scoring
 */

const mongoose = require('mongoose');
require('dotenv').config();

const { RoadmapTopic, Problem, RoadmapTopicProblem, Roadmap } = require('../src/models');

// Curated problem mappings for each DSA topic
// Maps problems to topics in the 15-topic FAANG Interview roadmap
const TOPIC_PROBLEM_MAPPINGS = {
  'Arrays & Lists': [
    { externalId: 'lc-1', importance: 0.95, order: 1 },
  ],
  'Strings & Pattern Matching': [
    { externalId: 'lc-3', importance: 0.90, order: 1 },
  ],
  'Hash Tables': [
    { externalId: 'lc-1', importance: 0.92, order: 1 },
  ],
  'Two Pointers': [
    { externalId: 'lc-1', importance: 0.88, order: 1 },
  ],
  'Sliding Window': [
    { externalId: 'lc-3', importance: 0.85, order: 1 },
  ],
  'Linked Lists': [
    { externalId: 'lc-2', importance: 0.88, order: 1 },
  ],
  'Stacks': [
    { externalId: 'lc-2', importance: 0.80, order: 1 },
  ],
  'Queues': [
    { externalId: 'cf-1', importance: 0.75, order: 1 },
  ],
  'Binary Search': [
    { externalId: 'lc-1', importance: 0.85, order: 1 },
  ],
  'Trees & Binary Trees': [
    { externalId: 'hc-1', importance: 0.85, order: 1 },
  ],
  'Recursion & Backtracking': [
    { externalId: 'lc-3', importance: 0.82, order: 1 },
  ],
  'Graph Traversal (BFS/DFS)': [
    { externalId: 'hc-1', importance: 0.85, order: 1 },
  ],
  'Dynamic Programming': [
    { externalId: 'lc-3', importance: 0.88, order: 1 },
  ],
};

const seedDSAProblems = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing topic-problem mappings
    await RoadmapTopicProblem.deleteMany({});
    console.log('Cleared existing problem mappings');

    // Get all topics
    const topics = await RoadmapTopic.find({}).select('_id name');
    console.log(`Found ${topics.length} topics\n`);

    let mappingsCreated = 0;
    let problemsNotFound = [];

    // Create mappings
    for (const [topicName, problemMappings] of Object.entries(TOPIC_PROBLEM_MAPPINGS)) {
      // Find the topic
      const topic = topics.find(t => t.name === topicName);
      if (!topic) {
        console.log(`⚠️ Topic not found: ${topicName}`);
        continue;
      }

      console.log(`\n📌 Processing: ${topicName}`);

      // Process each problem
      for (const mapping of problemMappings) {
        // Find the problem by externalId
        const problem = await Problem.findOne({ externalId: mapping.externalId });
        
        if (!problem) {
          console.log(`  ❌ Problem not found: ${mapping.externalId}`);
          problemsNotFound.push(mapping.externalId);
          continue;
        }

        // Create the topic-problem mapping
        const topicProblem = new RoadmapTopicProblem({
          topicId: topic._id,
          problemId: problem._id,
          recommendedOrder: mapping.order,
          importanceScore: mapping.importance,
          importance_weight: mapping.importance,
          difficulty: problem.difficulty,
        });

        await topicProblem.save();
        console.log(`  ✅ Linked: ${problem.title} (importance: ${(mapping.importance * 100).toFixed(0)}%)`);
        mappingsCreated++;
      }
    }

    console.log(`\n\n📊 Summary:`);
    console.log(`✅ Created ${mappingsCreated} topic-problem mappings`);
    
    if (problemsNotFound.length > 0) {
      console.log(`⚠️ Problems not found: ${problemsNotFound.join(', ')}`);
      console.log('\nTo add these problems, run: npm run seed');
    }

    // Verify the mappings
    const totalMappings = await RoadmapTopicProblem.countDocuments();
    console.log(`\n✅ Total mappings in database: ${totalMappings}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedDSAProblems();

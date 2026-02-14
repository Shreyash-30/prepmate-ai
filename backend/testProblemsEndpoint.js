const axios = require('axios');

async function testProblemsEndpoint() {
  try {
    // Step 1: Login
    console.log('🔐 Step 1: Logging in...');
    const loginResp = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'john@example.com',
      password: 'TestPassword123!',
    });

    const token = loginResp.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Login successful\n');

    // Step 2: Get roadmap and first topic ID
    console.log('📖 Step 2: Getting DSA roadmap...');
    const roadmapResp = await axios.get('http://localhost:5000/api/roadmap/dsa', { headers });
    
    console.log(`Roadmap: ${roadmapResp.data.data.roadmap_name}`);
    console.log(`Total topics: ${roadmapResp.data.data.stats.total_topics}`);
    
    // Debug: Check the response structure
    if (!roadmapResp.data.data.layers || roadmapResp.data.data.layers.length === 0) {
      throw new Error('No layers found in roadmap');
    }

    const firstLayer = roadmapResp.data.data.layers[0];
    
    if (!firstLayer.topics || firstLayer.topics.length === 0) {
      throw new Error('No topics in first layer');
    }

    const firstTopic = firstLayer.topics[0];
    console.log(`✅ Got roadmap with first topic: ${firstTopic.name}`);
    console.log(`   Topic ID: ${firstTopic.topic_id}\n`);

    // Step 3: Get problems for that topic
    console.log(`📚 Step 3: Fetching problems for "${firstTopic.name}"...`);
    const problemsResp = await axios.get(`http://localhost:5000/api/roadmap/dsa/topic/${firstTopic.topic_id}/problems`, { headers });
    
    const problemsData = problemsResp.data.data;
    console.log(`✅ Found ${problemsData.total_problems} problems\n`);

    if (problemsData.problems.length > 0) {
      console.log('📋 Problems:');
      problemsData.problems.forEach((problem, idx) => {
        console.log(`\n  ${idx + 1}. ${problem.title}`);
        console.log(`     Difficulty: ${problem.difficulty}`);
        console.log(`     Platform: ${problem.platform}`);
        console.log(`     Importance: ${(problem.importance_score * 100).toFixed(0)}%`);
        console.log(`     URL: ${problem.url}`);
      });
    }

    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testProblemsEndpoint();

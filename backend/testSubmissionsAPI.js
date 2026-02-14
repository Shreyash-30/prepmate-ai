/**
 * Submissions API Test
 * Tests the new submissions endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test credentials
const johnLogin = {
  email: 'john@example.com',
  password: 'TestPassword123!',
};

const janeLogin = {
  email: 'jane@example.com',
  password: 'TestPassword123!',
};

let johnToken = '';
let janeToken = '';

async function login(credentials) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
    return response.data.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    return null;
  }
}

async function testSubmissionsAPI() {
  try {
    console.log('🧪 Testing Submissions API\n');
    console.log('=' .repeat(60));

    // Login both users
    console.log('\n📝 Logging in users...');
    johnToken = await login(johnLogin);
    janeToken = await login(janeLogin);

    if (!johnToken || !janeToken) {
      console.error('❌ Login failed');
      return;
    }

    console.log('✅ Both users logged in successfully!\n');

    // Test 1: Get all solved problems - John
    console.log('=' .repeat(60));
    console.log('\n1️⃣  TEST: Get All Solved Problems (John Doe)');
    console.log('-' .repeat(60));
    try {
      const response = await axios.get(`${BASE_URL}/submissions/user/solved`, {
        headers: { Authorization: `Bearer ${johnToken}` },
        params: { limit: 10 },
      });
      console.log(`✅ Total Solved: ${response.data.summary.totalSolved}`);
      console.log(`📊 By Difficulty:`, response.data.summary.solvedByDifficulty);
      console.log(`🖥️  By Platform:`, response.data.summary.solvedByPlatform);
      console.log(`\n📋 Sample Problems:`);
      response.data.data.slice(0, 3).forEach((p, i) => {
        console.log(`  ${i + 1}. [${p.difficulty.toUpperCase()}] ${p.title} (${p.platform})`);
      });
    } catch (error) {
      console.error('❌ Error:', error.response?.data?.error || error.message);
    }

    // Test 2: Get filtered solved problems - Easy only
    console.log('\n' + '=' .repeat(60));
    console.log('\n2️⃣  TEST: Get Easy Problems Only');
    console.log('-' .repeat(60));
    try {
      const response = await axios.get(`${BASE_URL}/submissions/user/solved`, {
        headers: { Authorization: `Bearer ${johnToken}` },
        params: { difficulty: 'easy', limit: 5 },
      });
      console.log(`✅ Easy Problems Solved: ${response.data.data.length}`);
      console.log(`\n📋 Problems:`);
      response.data.data.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.title} on ${p.platform}`);
      });
    } catch (error) {
      console.error('❌ Error:', error.response?.data?.error || error.message);
    }

    // Test 3: Get statistics
    console.log('\n' + '=' .repeat(60));
    console.log('\n3️⃣  TEST: Get Submission Statistics');
    console.log('-' .repeat(60));
    try {
      const response = await axios.get(`${BASE_URL}/submissions/user/stats`, {
        headers: { Authorization: `Bearer ${johnToken}` },
      });
      const stats = response.data.data;
      console.log(`✅ Statistics Retrieved:`);
      console.log(`  📊 Total Submissions: ${stats.totalSubmissions}`);
      console.log(`  ✔️  Total Solved: ${stats.totalSolved}`);
      console.log(`  📈 Success Rate: ${stats.successRate}%`);
      console.log(`  ⏱️  Average Solve Time: ${Math.round(stats.averageSolveTime / 60)} minutes`);
      console.log(`  🎯 Average Attempts: ${stats.averageAttemptsPerProblem}`);
      console.log(`\n  By Difficulty:`);
      Object.entries(stats.byDifficulty).forEach(([diff, data]) => {
        console.log(`    • ${diff.toUpperCase()}: ${data.solved}/${data.total}`);
      });
      console.log(`\n  By Platform:`);
      Object.entries(stats.byPlatform).forEach(([plat, data]) => {
        if (data.total > 0) {
          console.log(`    • ${plat.toUpperCase()}: ${data.solved}/${data.total}`);
        }
      });
    } catch (error) {
      console.error('❌ Error:', error.response?.data?.error || error.message);
    }

    // Test 4: Get by topic
    console.log('\n' + '=' .repeat(60));
    console.log('\n4️⃣  TEST: Get Solved Problems by Topic');
    console.log('-' .repeat(60));
    try {
      const response = await axios.get(`${BASE_URL}/submissions/user/by-topic`, {
        headers: { Authorization: `Bearer ${johnToken}` },
      });
      console.log(`✅ Topics Found: ${response.data.summary.totalTopics}`);
      console.log(`\n📚 Topic Distribution:`);
      const distribution = response.data.summary.topicDistribution;
      Object.entries(distribution)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([topic, count]) => {
          console.log(`  • ${topic}: ${count} problems`);
        });
    } catch (error) {
      console.error('❌ Error:', error.response?.data?.error || error.message);
    }

    // Test 5: Get LeetCode submissions
    console.log('\n' + '=' .repeat(60));
    console.log('\n5️⃣  TEST: Get LeetCode Platform Submissions');
    console.log('-' .repeat(60));
    try {
      const response = await axios.get(`${BASE_URL}/submissions/platform/leetcode`, {
        headers: { Authorization: `Bearer ${johnToken}` },
        params: { limit: 5 },
      });
      console.log(`✅ LeetCode Stats:`);
      console.log(`  📊 Total: ${response.data.stats.total}`);
      console.log(`  ✔️  Solved: ${response.data.stats.solved}`);
      console.log(`  🎯 Success Rate: ${response.data.stats.successRate}%`);
      console.log(`\n📋 Recent Submissions:`);
      response.data.data.slice(0, 3).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.title} - ${p.verdict === 'accepted' ? '✅' : '❌'}`);
      });
    } catch (error) {
      console.error('❌ Error:', error.response?.data?.error || error.message);
    }

    // Test 6: Jane's submissions
    console.log('\n' + '=' .repeat(60));
    console.log('\n6️⃣  TEST: Get Jane Smith\'s Solved Problems');
    console.log('-' .repeat(60));
    try {
      const response = await axios.get(`${BASE_URL}/submissions/user/solved`, {
        headers: { Authorization: `Bearer ${janeToken}` },
      });
      console.log(`✅ Jane's Statistics:`);
      console.log(`  Total Solved: ${response.data.summary.totalSolved}`);
      console.log(`\n📋 Her Problems:`);
      response.data.data.forEach((p, i) => {
        console.log(`  ${i + 1}. [${p.difficulty}] ${p.title} on ${p.platform}`);
      });
    } catch (error) {
      console.error('❌ Error:', error.response?.data?.error || error.message);
    }

    console.log('\n' + '=' .repeat(60));
    console.log('\n✅ All tests completed!');
    console.log('=' .repeat(60));
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run tests
console.log('🚀 Starting Submissions API Tests\n');
testSubmissionsAPI().catch(console.error);

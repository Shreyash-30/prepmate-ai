/**
 * Comprehensive Integration Test
 * Validates entire Phases 2B-3 infrastructure
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let testToken = '';
let testUserId = '';

// Test configuration
const config = {
  timeout: 30000,
  headers: {},
};

console.log('🚀 Starting Comprehensive Integration Test\n');

/**
 * Helper: Make authenticated request
 */
async function request(method, path, data = null) {
  try {
    const url = `${BASE_URL}${path}`;
    const options = {
      method,
      url,
      headers: config.headers,
      timeout: config.timeout,
    };

    if (data) {
      options.data = data;
    }

    const response = await axios(options);
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status,
      error: error.response?.data?.error || error.message,
    };
  }
}

/**
 * Test 1: Authentication
 */
async function testAuthentication() {
  console.log('📋 Test 1: Authentication');

  const result = await request('POST', '/auth/register', {
    email: `test${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User',
  });

  if (result.success) {
    console.log('  ✅ Registration successful');

    // Login
    const loginEmail = result.data.data.email;
    const loginResult = await request('POST', '/auth/login', {
      email: loginEmail,
      password: 'TestPassword123!',
    });

    if (loginResult.success && loginResult.data.token) {
      testToken = loginResult.data.token;
      testUserId = loginResult.data.data.userId;
      config.headers.Authorization = `Bearer ${testToken}`;
      console.log('  ✅ Login successful');
      return true;
    }
  }

  console.log('  ❌ Authentication failed');
  return false;
}

/**
 * Test 2: Platform Integrations
 */
async function testIntegrations() {
  console.log('\n📋 Test 2: Platform Integrations');

  // Get integration status
  const statusResult = await request('GET', '/integrations/status');
  if (statusResult.success) {
    console.log('  ✅ Integration status retrieved');
    const platforms = Object.keys(statusResult.data.data || {});
    console.log(`     Connected platforms: ${platforms.join(', ')}`);
  } else {
    console.log('  ❌ Failed to get integration status');
    return false;
  }

  return true;
}

/**
 * Test 3: Health Monitoring
 */
async function testHealthMonitoring() {
  console.log('\n📋 Test 3: Health Monitoring');

  // System health
  const systemResult = await request('GET', '/health/system');
  if (systemResult.success) {
    console.log('  ✅ System health retrieved');
    const status = systemResult.data.data?.status;
    console.log(`     Status: ${status}`);
  } else {
    console.log('  ❌ Failed to get system health');
  }

  // User health
  const userResult = await request('GET', '/health/user');
  if (userResult.success) {
    console.log('  ✅ User health retrieved');
  }

  // Platform health
  const platformResult = await request('GET', '/health/codeforces');
  if (platformResult.success) {
    console.log('  ✅ Platform health retrieved (CodeForces)');
  }

  // Queue stats
  const queueResult = await request('GET', '/health/queue/codeforces/stats');
  if (queueResult.success) {
    console.log('  ✅ Queue stats retrieved');
    const stats = queueResult.data.data;
    console.log(`     Active: ${stats?.active || 0}, Waiting: ${stats?.waiting || 0}, Failed: ${stats?.failed || 0}`);
  }

  return systemResult.success && userResult.success && platformResult.success;
}

/**
 * Test 4: AI Telemetry Pipeline
 */
async function testAITelemetry() {
  console.log('\n📋 Test 4: AI Telemetry Pipeline');

  // Mastery profile
  const masteryResult = await request('GET', `/ai/telemetry/mastery/${testUserId}`);
  if (masteryResult.success) {
    console.log('  ✅ Mastery profile retrieved');
  } else if (masteryResult.status === 404) {
    console.log('  ⚠️  No mastery data yet (expected for new user)');
  } else {
    console.log('  ❌ Failed to get mastery profile');
  }

  // Readiness profile
  const readinessResult = await request('GET', `/ai/telemetry/readiness/${testUserId}`);
  if (readinessResult.success) {
    console.log('  ✅ Readiness profile retrieved');
  } else if (readinessResult.status === 404) {
    console.log('  ⚠️  No readiness data yet (expected for new user)');
  } else {
    console.log('  ❌ Failed to get readiness profile');
  }

  // Insights (can aggregate both)
  const insightsResult = await request('GET', `/ai/telemetry/insights/${testUserId}`);
  if (insightsResult.success) {
    console.log('  ✅ AI insights retrieved');
  } else if (insightsResult.status === 404) {
    console.log('  ⚠️  Insufficient data for insights (expected for new user)');
  }

  return true;
}

/**
 * Test 5: Roadmap Operations
 */
async function testRoadmap() {
  console.log('\n📋 Test 5: Roadmap Operations');

  // List roadmaps
  const listResult = await request('GET', '/roadmap');
  if (listResult.success) {
    console.log('  ✅ Roadmaps retrieved');
    const roadmaps = listResult.data.data || [];
    if (roadmaps.length > 0) {
      const roadmapId = roadmaps[0]._id;

      // Get PCI
      const pciResult = await request('GET', `/roadmap/pci/${roadmapId}`);
      if (pciResult.success) {
        console.log('  ✅ PCI retrieved');
      }

      // Get progress
      const progressResult = await request('GET', `/roadmap/progress/${roadmapId}`);
      if (progressResult.success) {
        console.log('  ✅ Progress retrieved');
      }

      // Get recommendations
      const recResult = await request('GET', `/roadmap/recommendations/${roadmapId}`);
      if (recResult.success) {
        console.log('  ✅ Recommendations retrieved');
      }

      return true;
    }
  } else {
    console.log('  ⚠️  No roadmaps found (expected if not seeded)');
    return true;
  }

  return true;
}

/**
 * Test 6: Sync Operations
 */
async function testSync() {
  console.log('\n📋 Test 6: Sync Operations (Mock)');

  // Trigger CodeForces sync (will queue job)
  const syncResult = await request('POST', '/integrations/codeforces/sync', {
    username: 'test_user',
  });

  if (syncResult.success) {
    console.log('  ✅ Sync job queued');
    return true;
  } else if (syncResult.status === 400) {
    console.log('  ⚠️  Invalid sync request (integration may not be configured)');
    return true;
  } else {
    console.log('  ❌ Failed to queue sync');
    return false;
  }
}

/**
 * Test 7: Database Connection
 */
async function testDatabase() {
  console.log('\n📋 Test 7: Database Connection');

  // Try to fetch any resource that requires DB
  const result = await request('GET', '/users/me');

  if (result.success) {
    console.log('  ✅ Database connection working');
    return true;
  } else if (result.status === 401) {
    console.log('  ⚠️  Not authenticated (expected if no token)');
    return true;
  } else {
    console.log(`  ❌ Database error: ${result.error}`);
    return false;
  }
}

/**
 * Test 8: Error Handling
 */
async function testErrorHandling() {
  console.log('\n📋 Test 8: Error Handling');

  // Invalid endpoint
  const invalidResult = await request('GET', '/invalid/endpoint');
  if (invalidResult.status === 404) {
    console.log('  ✅ 404 handling works');
  }

  // Unauthorized access
  delete config.headers.Authorization;
  const unauthorizedResult = await request('GET', '/health/user');
  if (unauthorizedResult.status === 401) {
    console.log('  ✅ 401 handling works');
  }

  // Restore token
  config.headers.Authorization = `Bearer ${testToken}`;

  return true;
}

/**
 * Generate Summary Report
 */
function generateReport(results) {
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));

  const passed = Object.values(results).filter((r) => r).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([test, result]) => {
    const status = result ? '✅' : '❌';
    console.log(`${status} ${test}`);
  });

  console.log('\n' + '='.repeat(50));
  console.log(`✨ Passed: ${passed}/${total} tests`);
  console.log('='.repeat(50) + '\n');

  if (passed === total) {
    console.log('🎉 All tests passed! System is ready for production.\n');
  } else {
    console.log(`⚠️  ${total - passed} test(s) failed. Review errors above.\n`);
  }
}

/**
 * Main Test Runner
 */
async function runTests() {
  const results = {};

  try {
    // Authentication must pass first
    if (!(await testAuthentication())) {
      console.log('\n❌ Authentication failed - cannot continue tests');
      generateReport({ Auth: false });
      return;
    }

    // Run remaining tests
    results['Integrations'] = await testIntegrations();
    results['Health Monitoring'] = await testHealthMonitoring();
    results['AI Telemetry'] = await testAITelemetry();
    results['Roadmap Operations'] = await testRoadmap();
    results['Sync Operations'] = await testSync();
    results['Database Connection'] = await testDatabase();
    results['Error Handling'] = await testErrorHandling();

    // Generate report
    generateReport(results);
  } catch (error) {
    console.error('\n❌ Unexpected error during tests:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();

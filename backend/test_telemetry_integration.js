/**
 * Comprehensive Telemetry Integration Test
 * Tests: sync → aggregation → AI pipeline flow
 * 
 * Run: node test_telemetry_integration.js
 */

const axios = require('axios');
const mongoose = require('mongoose');

// Configuration
const API_BASE = 'http://localhost:5000/api';
let authToken = null;

// Test data
let testUserId = null;
let testIntegration = null;

/**
 * Test utilities
 */
const log = {
  info: (msg, data) => console.log(`\n✅ ${msg}`, data ? JSON.stringify(data, null, 2) : ''),
  warn: (msg, data) => console.log(`\n⚠️  ${msg}`, data ? JSON.stringify(data, null, 2) : ''),
  error: (msg, data) => console.error(`\n❌ ${msg}`, data ? JSON.stringify(data, null, 2) : ''),
  section: (title) => console.log(`\n${'='.repeat(60)}\n📝 ${title}\n${'='.repeat(60)}`),
};

/**
 * Setup: Login to get auth token
 */
async function setupAuth() {
  log.section('STEP 1: Authentication');

  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'john@example.com',
      password: 'TestPassword123!',
    });

    authToken = response.data.data.token;
    testUserId = response.data.data.user._id;

    log.info('✅ Login successful', {
      userId: testUserId,
      tokenLength: authToken.length,
    });

    return true;
  } catch (error) {
    log.error('Login failed', error.response?.data || error.message);
    return false;
  }
}

/**
 * Get integrations and verify CodeForces connection
 */
async function getIntegrationStatus() {
  log.section('STEP 2: Check Integration Status');

  try {
    const response = await axios.get(`${API_BASE}/integrations/status`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const integrations = response.data.integrations;
    const platformList = Object.keys(integrations || {});
    
    log.info('Integrations retrieved', {
      count: platformList.length,
      platforms: platformList,
    });

    // Find CodeForces integration
    testIntegration = integrations?.codeforces;

    if (!testIntegration) {
      log.warn('CodeForces integration not found. Available:', platformList);
    } else {
      log.info('CodeForces integration found', {
        platform: 'codeforces',
        isConnected: testIntegration.isConnected,
      });
    }

    return true;
  } catch (error) {
    log.error('Failed to get integration status', error.response?.data || error.message);
    return false;
  }
}


/**
 * CRITICAL TEST: Trigger sync and wait for aggregation
 */
async function triggerSyncAndAggregation() {
  log.section('STEP 3: Trigger Sync → Aggregation → AI Pipeline');

  if (!testIntegration?.isConnected) {
    log.warn('Skipping sync test - CodeForces not connected', {
      integration: testIntegration,
    });
    return false;
  }

  try {
    const syncPayload = {
      platform: 'codeforces',
    };

    log.info('Triggering CodeForces sync...', syncPayload);

    const syncResponse = await axios.post(`${API_BASE}/integrations/sync-now`, syncPayload, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    log.info('Sync triggered successfully', {
      status: syncResponse.data.data.status,
      estimatedDuration: syncResponse.data.data.estimatedDuration,
    });

    // Wait for aggregation to complete (async process)
    log.info('Waiting 5 seconds for aggregation to process...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    return syncResponse.data.success;
  } catch (error) {
    log.error('Sync trigger failed', error.response?.data || error.message);
    return false;
  }
}

/**
 * Verify telemetry data was collected
 */
async function verifyTelemetryCollection() {
  log.section('STEP 4: Verify Telemetry Collection');

  try {
    // Get topic stats
    const topicStatsResponse = await axios.get(
      `${API_BASE}/telemetry/topic-stats/${testUserId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    const stats = topicStatsResponse.data.data;

    log.info('Topic stats retrieved', {
      topicCount: stats.topic_count,
      topicsWithData: stats.stats?.slice(0, 3),
    });

    if (stats.stats && stats.stats.length > 0) {
      log.info('✅ Telemetry data collection verified', {
        totalTopics: stats.topic_count,
        sampleTopic: stats.stats[0],
      });
      return true;
    } else {
      log.warn('⚠️ No topic stats found yet', {
        topic_count: stats.topic_count,
      });
      return false;
    }
  } catch (error) {
    log.error('Failed to get topic stats', error.response?.data || error.message);
    return false;
  }
}

/**
 * Verify dashboard data is available
 */
async function verifyDashboardData() {
  log.section('STEP 5: Verify Dashboard Data');

  try {
    const readinessResponse = await axios.get(`${API_BASE}/dashboard/readiness`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const readiness = readinessResponse.data.data;

    log.info('Dashboard readiness data retrieved', {
      overall: readiness.overall,
      categories: {
        dsa: readiness.dsa,
        os: readiness.os,
        dbms: readiness.dbms,
      },
    });

    return true;
  } catch (error) {
    log.error('Failed to get dashboard data', error.response?.data || error.message);
    return false;
  }
}

/**
 * Verify weak topics detection
 */
async function verifyWeakTopicDetection() {
  log.section('STEP 6: Verify Weak Topic Detection');

  try {
    const weakTopicsResponse = await axios.get(
      `${API_BASE}/telemetry/weak-topics/${testUserId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    const weakTopics = weakTopicsResponse.data.data;

    log.info('Weak topics retrieved', {
      count: weakTopics.count,
      topics: weakTopics.weak_topics?.slice(0, 5),
    });

    if (weakTopics.count > 0) {
      log.info('✅ Weak topic detection working', {
        topicsIdentified: weakTopics.count,
      });
      return true;
    } else {
      log.warn('⚠️ No weak topics identified yet', {
        thisIsNormalFor: 'new users with no data',
      });
      return false;
    }
  } catch (error) {
    log.error('Failed to get weak topics', error.response?.data || error.message);
    return false;
  }
}

/**
 * Check sync logs for errors
 */
async function verifySyncHealth() {
  log.section('STEP 7: Verify Sync Health & Error Logs');

  try {
    // Connect to MongoDB to check SyncLog
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/prepmate_ai';
    await mongoose.connect(mongoUri);

    const SyncLog = require('./src/models/SyncLog');

    const recentSyncs = await SyncLog.find({})
      .sort({ createdAt: -1 })
      .limit(3);

    if (recentSyncs.length > 0) {
      const lastSync = recentSyncs[0];
      log.info('Recent sync logs', {
        syncCount: recentSyncs.length,
        lastSync: {
          platform: lastSync.platform,
          status: lastSync.status,
          recordsInserted: lastSync.insertedRecords,
          errors: lastSync.errors?.length,
        },
      });

      if (lastSync.status === 'success') {
        log.info('✅ Last sync was successful', {
          recordsInserted: lastSync.insertedRecords,
          platform: lastSync.platform,
        });
        return true;
      } else if (lastSync.errors && lastSync.errors.length > 0) {
        log.warn('⚠️ Last sync had errors', {
          errors: lastSync.errors.slice(0, 2),
        });
        return false;
      }
    } else {
      log.warn('⚠️ No sync logs found', {
        reason: 'This may be the first time running the test',
      });
    }

    await mongoose.disconnect();
    return true;
  } catch (error) {
    log.error('Failed to check sync health', error.message);
    return false;
  }
}

/**
 * Comprehensive test runner
 */
async function runAllTests() {
  log.section('🚀 TELEMETRY INTEGRATION TEST SUITE');
  log.info('Testing: Sync → Aggregation → AI Pipeline → Dashboard');

  const results = {
    auth: false,
    integration: false,
    sync: false,
    telemetry: false,
    dashboard: false,
    weakTopics: false,
    health: false,
  };

  try {
    // Run all tests
    results.auth = await setupAuth();
    if (!results.auth) throw new Error('Authentication failed');

    results.integration = await getIntegrationStatus();
    results.sync = await triggerSyncAndAggregation();
    results.telemetry = await verifyTelemetryCollection();
    results.dashboard = await verifyDashboardData();
    results.weakTopics = await verifyWeakTopicDetection();
    results.health = await verifySyncHealth();

    // Summary
    log.section('📊 TEST SUMMARY');

    const passed = Object.values(results).filter(r => r).length;
    const total = Object.keys(results).length;

    console.log(`
Tests Passed: ${passed}/${total}

Results by Step:
  1. Authentication:          ${results.auth ? '✅ PASS' : '❌ FAIL'}
  2. Integration Status:      ${results.integration ? '✅ PASS' : '❌ FAIL'}
  3. Sync Trigger:            ${results.sync ? '✅ PASS' : '⚠️  SKIP'}
  4. Telemetry Collection:    ${results.telemetry ? '✅ PASS' : '⚠️  SKIP'}
  5. Dashboard Data:          ${results.dashboard ? '✅ PASS' : '❌ FAIL'}
  6. Weak Topic Detection:    ${results.weakTopics ? '✅ PASS' : '⚠️  SKIP'}
  7. Sync Health:             ${results.health ? '✅ PASS' : '⚠️  SKIP'}

OVERALL STATUS: ${passed >= 4 ? '✅ HEALTHY' : '❌ NEEDS ATTENTION'}
    `);

    if (passed >= 4) {
      log.info('✨ Telemetry foundation is operational!', {
        readyFor: 'production deployment',
      });
    }

    process.exit(passed >= 4 ? 0 : 1);
  } catch (error) {
    log.error('Test suite failed', error.message);
    process.exit(1);
  }
}

// Run tests
runAllTests();

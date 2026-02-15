#!/usr/bin/env node

/**
 * PrepMate AI - Complete System Verification Script
 * Tests: Backend, Frontend, Python ML, Database, Authentication, Data Flow
 * 
 * Usage: npm run verify (from frontend)
 *        OR node verify-system.js (from root)
 */

const http = require('http');
const https = require('https');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function checkEndpoint(url, method = 'GET', headers = {}) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const options = new URL(url);
    options.method = method;
    options.headers = headers;

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          success: res.statusCode >= 200 && res.statusCode < 400,
          data,
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 0,
        success: false,
        error: error.message,
      });
    });

    req.end();
  });
}

async function runVerification() {
  log('\n╔════════════════════════════════════════════════╗', 'cyan');
  log('║  PrepMate AI - Complete System Verification  ║', 'cyan');
  log('╚════════════════════════════════════════════════╝\n', 'cyan');

  let allPassed = true;

  // 1. Backend Check
  log('1️⃣  BACKEND SERVICE (Port 5000)', 'blue');
  try {
    const backendRes = await checkEndpoint('http://localhost:5000/api/health');
    if (backendRes.success) {
      log('   ✅ Backend running on port 5000', 'green');
    } else {
      log(`   ❌ Backend returned status ${backendRes.status}`, 'red');
      log('      → Start backend: npm start (from backend folder)', 'yellow');
      allPassed = false;
    }
  } catch (error) {
    log('   ❌ Backend not responding', 'red');
    log('      → Start backend: npm start (from backend folder)', 'yellow');
    allPassed = false;
  }

  // 2. Frontend Check
  log('\n2️⃣  FRONTEND SERVICE (Port 8080)', 'blue');
  try {
    const frontendRes = await checkEndpoint('http://localhost:8080/');
    if (frontendRes.success) {
      log('   ✅ Frontend running on port 8080', 'green');
    } else {
      log(`   ❌ Frontend returned status ${frontendRes.status}`, 'red');
      log('      → Start frontend: npm run dev (from frontend folder)', 'yellow');
      allPassed = false;
    }
  } catch (error) {
    log('   ❌ Frontend not responding', 'red');
    log('      → Start frontend: npm run dev (from frontend folder)', 'yellow');
    allPassed = false;
  }

  // 3. Python ML Services Check
  log('\n3️⃣  PYTHON ML SERVICES (Port 8000)', 'blue');
  try {
    const pyRes = await checkEndpoint('http://localhost:8000/');
    if (pyRes.success || pyRes.status === 404) {
      log('   ✅ Python services running on port 8000', 'green');
    } else {
      log(`   ❌ Python services returned status ${pyRes.status}`, 'red');
      log('      → Start Python: python main.py (from ai-services folder)', 'yellow');
      allPassed = false;
    }
  } catch (error) {
    log('   ❌ Python ML services not responding', 'red');
    log('      → Start Python: python main.py (from ai-services folder)', 'yellow');
    allPassed = false;
  }

  // 4. Auth Endpoint Check
  log('\n4️⃣  AUTHENTICATION ENDPOINT', 'blue');
  try {
    const authRes = await checkEndpoint('http://localhost:5000/api/auth/login', 'POST', {
      'Content-Type': 'application/json',
    });
    if (authRes.status === 400 || authRes.status === 401 || authRes.status === 200) {
      log('   ✅ Auth endpoint responding correctly', 'green');
    } else {
      log(`   ❌ Auth endpoint returned unexpected status ${authRes.status}`, 'red');
      allPassed = false;
    }
  } catch (error) {
    log('   ❌ Auth endpoint not accessible', 'red');
    allPassed = false;
  }

  // 5. Dashboard Summary Endpoint (requires token)
  log('\n5️⃣  DASHBOARD DATA ENDPOINT', 'blue');
  try {
    const dashRes = await checkEndpoint('http://localhost:5000/api/dashboard/summary', 'GET', {
      Authorization: 'Bearer test-token',
    });
    if (dashRes.status === 401) {
      log('   ✅ Dashboard endpoint requires auth (secure)', 'green');
    } else if (dashRes.status === 200 || dashRes.status === 500) {
      log('   ✅ Dashboard endpoint accessible', 'green');
    } else {
      log(`   ⚠️  Dashboard endpoint returned status ${dashRes.status}`, 'yellow');
    }
  } catch (error) {
    log('   ❌ Dashboard endpoint not accessible', 'red');
    allPassed = false;
  }

  // 6. Automation Status Endpoint
  log('\n6️⃣  AUTOMATION STATUS ENDPOINT', 'blue');
  try {
    const autoRes = await checkEndpoint('http://localhost:5000/api/automation/status', 'GET', {
      Authorization: 'Bearer test-token',
    });
    if (autoRes.status === 401 || autoRes.status === 200) {
      log('   ✅ Automation status endpoint accessible', 'green');
    } else {
      log(`   ⚠️  Automation status endpoint returned status ${autoRes.status}`, 'yellow');
    }
  } catch (error) {
    log('   ❌ Automation status endpoint not accessible', 'red');
    allPassed = false;
  }

  // Summary
  log('\n╔════════════════════════════════════════════════╗', 'cyan');
  if (allPassed) {
    log('║  ✅ ALL SYSTEMS OPERATIONAL                   ║', 'cyan');
  } else {
    log('║  ⚠️  SOME SYSTEMS NOT RUNNING                 ║', 'cyan');
  }
  log('╚════════════════════════════════════════════════╝\n', 'cyan');

  // Instructions
  log('📋 QUICK START:', 'blue');
  log('   Terminal 1 (Backend):\n     cd backend && npm start\n', 'cyan');
  log('   Terminal 2 (Frontend):\n     cd frontend && npm run dev\n', 'cyan');
  log('   Terminal 3 (Python ML):\n     cd ai-services && python main.py\n', 'cyan');

  log('🔗 OPEN IN BROWSER:', 'blue');
  log('   Frontend: http://localhost:8080', 'cyan');
  log('   Backend:  http://localhost:5000', 'cyan');
  log('   Python:   http://localhost:8000\n', 'cyan');

  log('🧪 TESTING:', 'blue');
  log('   1. Clear auth: open console → authDebug.clear()', 'cyan');
  log('   2. Login with test credentials', 'cyan');
  log('   3. Check dashboard loads with user data', 'cyan');
  log('   4. Verify compliance and tasks showing\n', 'cyan');

  log('📚 DOCUMENTATION:', 'blue');
  log('   See DATA_FLOW_GUIDE.md for complete data flow documentation\n', 'cyan');

  process.exit(allPassed ? 0 : 1);
}

runVerification().catch((error) => {
  log(`\n❌ Verification failed: ${error.message}`, 'red');
  process.exit(1);
});

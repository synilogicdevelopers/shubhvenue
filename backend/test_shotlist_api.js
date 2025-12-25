import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:8030/api';
const TEST_DEVICE_ID = 'test-device-shotlist-' + Date.now();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logTest(name) {
  log(`\n🧪 Testing: ${name}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'reset');
}

// Test helper function
async function testAPI(name, method, endpoint, options = {}) {
  logTest(name);
  
  try {
    const url = `${BASE_URL}${endpoint}`;
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    if (options.deviceId) {
      config.headers['x-device-id'] = options.deviceId;
    }

    logInfo(`URL: ${url}`);
    if (config.body) {
      logInfo(`Body: ${config.body}`);
    }

    const response = await fetch(url, config);
    const data = await response.json();
    const status = response.status;

    logInfo(`Status: ${status}`);

    if (status >= 200 && status < 300) {
      logSuccess(`Response: ${JSON.stringify(data, null, 2)}`);
      return { success: true, data, status };
    } else {
      logError(`Error: ${JSON.stringify(data, null, 2)}`);
      return { success: false, data, status, error: data.error || data.message };
    }
  } catch (error) {
    logError(`Request failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Get a test venue ID
async function getTestVenueId() {
  logInfo('Fetching a venue to test with...');
  
  try {
    // First check if backend is running
    const healthCheck = await fetch(`${BASE_URL.replace('/api', '')}/api/health`).catch(() => null);
    if (!healthCheck || !healthCheck.ok) {
      logWarning('Backend might not be running. Trying to connect anyway...');
    }
    
    // Try public search endpoint first
    const searchResponse = await fetch(`${BASE_URL}/vendor/venues/search?limit=1`);
    const searchData = await searchResponse.json();
    
    if (searchData.success && searchData.data && searchData.data.length > 0) {
      const venueId = searchData.data[0]._id || searchData.data[0].id;
      logSuccess(`Found venue via search: ${searchData.data[0].name} (ID: ${venueId})`);
      return venueId;
    }
    
    // Try to get a public venue
    const response = await fetch(`${BASE_URL}/vendor/venues?limit=1`);
    const data = await response.json();
    
    if (data.success && data.data && data.data.length > 0) {
      const venueId = data.data[0]._id || data.data[0].id;
      logSuccess(`Found venue: ${data.data[0].name} (ID: ${venueId})`);
      return venueId;
    } else if (Array.isArray(data) && data.length > 0) {
      const venueId = data[0]._id || data[0].id;
      logSuccess(`Found venue: ${data[0].name} (ID: ${venueId})`);
      return venueId;
    }
    
    logWarning('No venues found in database');
    logInfo('You can manually provide a venue ID by editing the test script');
    return null;
  } catch (error) {
    logError(`Error fetching venues: ${error.message}`);
    logWarning('Make sure the backend server is running on port 8030');
    logInfo('Start backend with: cd backend && npm run dev');
    return null;
  }
}

// Main test function
async function runTests() {
  logSection('🧪 SHOTLIST API TEST SUITE');
  log(`Base URL: ${BASE_URL}`);
  log(`Test Device ID: ${TEST_DEVICE_ID}\n`);

  const results = {
    passed: 0,
    failed: 0,
    errors: 0,
  };

  // Get a test venue ID
  const venueId = await getTestVenueId();
  if (!venueId) {
    logError('Cannot proceed without a venue ID');
    logWarning('Please create at least one venue first.');
    return;
  }

  // Test 1: Check if venue is liked (should be false initially)
  logSection('Test 1: GET /api/shotlist/venue/:venueId/status');
  const test1 = await testAPI(
    'Check if venue is liked (initial status)',
    'GET',
    `/shotlist/venue/${venueId}/status`,
    { deviceId: TEST_DEVICE_ID }
  );
  
  if (test1.success && test1.data.isLiked === false) {
    logSuccess('Initial status is correct (not liked)');
    results.passed++;
  } else if (test1.success) {
    logWarning('Venue is already liked, will test unlike functionality');
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 2: Like a venue (add to shotlist)
  logSection('Test 2: POST /api/shotlist/venue/:venueId/like (Like)');
  const test2 = await testAPI(
    'Like a venue (add to shotlist)',
    'POST',
    `/shotlist/venue/${venueId}/like`,
    {
      body: { deviceId: TEST_DEVICE_ID },
      deviceId: TEST_DEVICE_ID
    }
  );
  
  if (test2.success && test2.data.isLiked === true) {
    logSuccess('Venue successfully added to shotlist');
    results.passed++;
  } else {
    logError('Failed to add venue to shotlist');
    results.failed++;
  }

  // Test 3: Check if venue is liked (should be true now)
  logSection('Test 3: GET /api/shotlist/venue/:venueId/status (After Like)');
  const test3 = await testAPI(
    'Check if venue is liked (after like)',
    'GET',
    `/shotlist/venue/${venueId}/status`,
    { deviceId: TEST_DEVICE_ID }
  );
  
  if (test3.success && test3.data.isLiked === true) {
    logSuccess('Status correctly shows venue is liked');
    results.passed++;
  } else {
    logError('Status check failed after like');
    results.failed++;
  }

  // Test 4: Get all shotlisted venues
  logSection('Test 4: GET /api/shotlist (Get All Shotlisted Venues)');
  const test4 = await testAPI(
    'Get all shotlisted venues',
    'GET',
    '/shotlist',
    { deviceId: TEST_DEVICE_ID }
  );
  
  if (test4.success && test4.data.venues && Array.isArray(test4.data.venues)) {
    logSuccess(`Found ${test4.data.count} venue(s) in shotlist`);
    if (test4.data.venues.length > 0) {
      logInfo(`First venue: ${test4.data.venues[0].name}`);
    }
    results.passed++;
  } else {
    logError('Failed to get shotlist');
    results.failed++;
  }

  // Test 5: Unlike a venue (remove from shotlist)
  logSection('Test 5: POST /api/shotlist/venue/:venueId/like (Unlike)');
  const test5 = await testAPI(
    'Unlike a venue (remove from shotlist)',
    'POST',
    `/shotlist/venue/${venueId}/like`,
    {
      body: { deviceId: TEST_DEVICE_ID },
      deviceId: TEST_DEVICE_ID
    }
  );
  
  if (test5.success && test5.data.isLiked === false) {
    logSuccess('Venue successfully removed from shotlist');
    results.passed++;
  } else {
    logError('Failed to remove venue from shotlist');
    results.failed++;
  }

  // Test 6: Check if venue is liked (should be false now)
  logSection('Test 6: GET /api/shotlist/venue/:venueId/status (After Unlike)');
  const test6 = await testAPI(
    'Check if venue is liked (after unlike)',
    'GET',
    `/shotlist/venue/${venueId}/status`,
    { deviceId: TEST_DEVICE_ID }
  );
  
  if (test6.success && test6.data.isLiked === false) {
    logSuccess('Status correctly shows venue is not liked');
    results.passed++;
  } else {
    logError('Status check failed after unlike');
    results.failed++;
  }

  // Test 7: Get shotlist again (should be empty)
  logSection('Test 7: GET /api/shotlist (After Unlike)');
  const test7 = await testAPI(
    'Get shotlist after unlike (should be empty)',
    'GET',
    '/shotlist',
    { deviceId: TEST_DEVICE_ID }
  );
  
  if (test7.success && test7.data.count === 0) {
    logSuccess('Shotlist is empty after unlike');
    results.passed++;
  } else {
    logWarning('Shotlist still has items after unlike');
    results.failed++;
  }

  // Test 8: Test error handling - invalid venue ID
  logSection('Test 8: Error Handling - Invalid Venue ID');
  const test8 = await testAPI(
    'Test with invalid venue ID',
    'POST',
    '/shotlist/venue/invalid-id/like',
    {
      body: { deviceId: TEST_DEVICE_ID },
      deviceId: TEST_DEVICE_ID
    }
  );
  
  if (!test8.success && (test8.status === 400 || test8.status === 404)) {
    logSuccess('Error handling works correctly for invalid venue ID');
    results.passed++;
  } else {
    logWarning('Error handling may need improvement');
    results.failed++;
  }

  // Test 9: Test without deviceId (should fail)
  logSection('Test 9: Error Handling - Missing deviceId');
  const test9 = await testAPI(
    'Test without deviceId (should fail)',
    'POST',
    `/shotlist/venue/${venueId}/like`,
    {}
  );
  
  if (!test9.success && test9.status === 400) {
    logSuccess('Error handling works correctly for missing deviceId');
    results.passed++;
  } else {
    logWarning('Error handling may need improvement for missing deviceId');
    results.failed++;
  }

  // Summary
  logSection('📊 TEST SUMMARY');
  log(`Total Tests: ${results.passed + results.failed + results.errors}`, 'cyan');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, 'red');
  log(`⚠️  Errors: ${results.errors}`, 'yellow');
  
  const successRate = ((results.passed / (results.passed + results.failed + results.errors)) * 100).toFixed(1);
  log(`\nSuccess Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');
  
  if (results.failed === 0 && results.errors === 0) {
    log('\n🎉 All tests passed!', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please review the errors above.', 'yellow');
  }
}

// Run tests
runTests().catch(error => {
  logError(`Test suite failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});


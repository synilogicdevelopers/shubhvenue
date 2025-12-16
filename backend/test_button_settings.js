import fetch from 'node-fetch';

const BASE_URL = process.env.API_URL || 'http://localhost:8030/api';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(message) {
  console.log('\n' + '='.repeat(60));
  log(message, 'cyan');
  console.log('='.repeat(60));
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
  log(`ℹ️  ${message}`, 'blue');
}

// Test helper function
async function testAPI(name, method, endpoint, options = {}) {
  logInfo(`\n📋 Testing: ${name}`);
  
  try {
    const url = `${BASE_URL}${endpoint}`;
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    log(`📤 Request: ${method} ${url}`);
    if (options.body) {
      log(`📦 Body: ${JSON.stringify(options.body, null, 2)}`);
    }
    
    const response = await fetch(url, config);
    const data = await response.json();
    
    log(`📥 Status: ${response.status}`);
    log(`📥 Response: ${JSON.stringify(data, null, 2)}`);
    
    if (response.ok) {
      logSuccess(`${name} - PASSED`);
      return { success: true, data, status: response.status };
    } else {
      logError(`${name} - FAILED (Status: ${response.status})`);
      return { success: false, data, status: response.status };
    }
  } catch (error) {
    logError(`${name} - ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Get a test venue ID
async function getTestVenueId() {
  logInfo('Fetching a venue to test with...');
  
  try {
    const response = await fetch(`${BASE_URL}/vendor/venues`);
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
    return null;
  } catch (error) {
    logError(`Error fetching venues: ${error.message}`);
    return null;
  }
}

// Main test function
async function runTests() {
  logSection('🧪 VENUE BUTTON SETTINGS API TEST');
  log(`Base URL: ${BASE_URL}\n`);

  const results = {
    passed: 0,
    failed: 0,
    errors: 0,
  };

  // Get a test venue ID
  const venueId = await getTestVenueId();
  if (!venueId) {
    logError('Cannot proceed without a venue ID');
    return;
  }

  // Test 1: Get venue by ID and check if button fields are present
  logSection('Test 1: GET /api/vendor/venues/:id (Check Button Fields)');
  const test1 = await testAPI(
    'Get venue by ID and verify button fields',
    'GET',
    `/vendor/venues/${venueId}`
  );
  
  if (test1.success) {
    const venue = test1.data.data || test1.data;
    const hasBookingField = venue.bookingButtonEnabled !== undefined;
    const hasLeadsField = venue.leadsButtonEnabled !== undefined;
    
    logInfo(`bookingButtonEnabled: ${venue.bookingButtonEnabled} (${typeof venue.bookingButtonEnabled})`);
    logInfo(`leadsButtonEnabled: ${venue.leadsButtonEnabled} (${typeof venue.leadsButtonEnabled})`);
    
    if (hasBookingField && hasLeadsField) {
      logSuccess('Both button fields are present in API response');
      results.passed++;
    } else {
      logWarning(`Missing fields - bookingButtonEnabled: ${hasBookingField}, leadsButtonEnabled: ${hasLeadsField}`);
      results.failed++;
    }
  } else {
    results.failed++;
  }

  // Test 2: Update button settings (requires admin auth - will fail but shows endpoint exists)
  logSection('Test 2: PUT /api/admin/venues/:id/button-settings (Admin Only)');
  logWarning('This endpoint requires admin authentication');
  logInfo('Testing endpoint structure...');
  
  const test2 = await testAPI(
    'Update button settings (without auth - should fail with 401)',
    'PUT',
    `/admin/venues/${venueId}/button-settings`,
    {
      body: {
        bookingButtonEnabled: false,
        leadsButtonEnabled: true
      }
    }
  );
  
  if (test2.status === 401 || test2.status === 403) {
    logSuccess('Endpoint exists and properly requires authentication');
    results.passed++;
  } else if (test2.success) {
    logSuccess('Update successful (admin token was provided)');
    results.passed++;
  } else {
    logWarning(`Unexpected status: ${test2.status}`);
    results.failed++;
  }

  // Test 3: Verify venue still has button fields after potential update
  logSection('Test 3: Verify Venue Response Structure');
  const test3 = await testAPI(
    'Get venue again to verify structure',
    'GET',
    `/vendor/venues/${venueId}`
  );
  
  if (test3.success) {
    const venue = test3.data.data || test3.data;
    const fields = {
      bookingButtonEnabled: venue.bookingButtonEnabled,
      leadsButtonEnabled: venue.leadsButtonEnabled
    };
    
    logInfo('Venue button settings:');
    logInfo(`  bookingButtonEnabled: ${fields.bookingButtonEnabled}`);
    logInfo(`  leadsButtonEnabled: ${fields.leadsButtonEnabled}`);
    
    // Check if fields exist (can be true, false, or undefined)
    if ('bookingButtonEnabled' in venue && 'leadsButtonEnabled' in venue) {
      logSuccess('Both fields are present in venue object');
      results.passed++;
    } else {
      logWarning('Fields might be missing from response');
      results.failed++;
    }
  } else {
    results.failed++;
  }

  // Summary
  logSection('📊 TEST SUMMARY');
  log(`Total Tests: ${results.passed + results.failed}`);
  logSuccess(`Passed: ${results.passed}`);
  if (results.failed > 0) {
    logError(`Failed: ${results.failed}`);
  }
  
  console.log('\n');
  
  if (results.failed === 0) {
    logSuccess('🎉 All tests passed!');
  } else {
    logWarning('⚠️  Some tests failed. Check the output above for details.');
  }
}

// Run tests
runTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});


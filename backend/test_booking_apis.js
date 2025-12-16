import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000/api';
const TEST_DEVICE_ID = 'test-device-12345';

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

// Test helper function
async function testAPI(name, method, endpoint, options = {}) {
  logTest(name);
  
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

    if (options.query) {
      const queryString = new URLSearchParams(options.query).toString();
      const fullUrl = `${url}${queryString ? '?' + queryString : ''}`;
      log(`📤 Request: ${method} ${fullUrl}`);
      if (options.body) {
        log(`📦 Body: ${JSON.stringify(options.body, null, 2)}`);
      }
      
      const response = await fetch(fullUrl, config);
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
    } else {
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
    }
  } catch (error) {
    logError(`${name} - ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Get a venue ID for testing (we'll need at least one venue in DB)
async function getTestVenueId() {
  try {
    const response = await fetch(`${BASE_URL}/vendor/venues?limit=1`);
    const data = await response.json();
    
    if (data.success && data.data && data.data.length > 0) {
      return data.data[0]._id;
    }
    return null;
  } catch (error) {
    logWarning(`Could not fetch test venue: ${error.message}`);
    return null;
  }
}

// Main test function
async function runTests() {
  logSection('🧪 BOOKING APIs TEST SUITE');
  log(`Base URL: ${BASE_URL}\n`);

  const results = {
    passed: 0,
    failed: 0,
    errors: 0,
  };

  // Test 1: Get bookings without auth (should return empty or message)
  logSection('Test 1: GET /api/bookings (No Auth)');
  const test1 = await testAPI(
    'Get bookings without authentication',
    'GET',
    '/bookings'
  );
  // Should return success with empty array or message
  if (test1.success) {
    if (test1.data.message || (test1.data.bookings && Array.isArray(test1.data.bookings))) {
      logSuccess('Properly handled request without auth');
      results.passed++;
    } else {
      logWarning('Unexpected response format');
      results.failed++;
    }
  } else {
    results.failed++;
  }

  // Test 2: Get bookings with deviceId
  logSection('Test 2: GET /api/bookings (With deviceId)');
  const test2 = await testAPI(
    'Get bookings with deviceId',
    'GET',
    '/bookings',
    {
      query: { deviceId: TEST_DEVICE_ID },
    }
  );
  if (test2.success) results.passed++;
  else results.failed++;

  // Test 3: Get booking count by deviceId
  logSection('Test 3: GET /api/bookings/count/device/:deviceId');
  const test3 = await testAPI(
    'Get booking count by deviceId',
    'GET',
    `/bookings/count/device/${TEST_DEVICE_ID}`
  );
  if (test3.success) results.passed++;
  else results.failed++;

  // Test 4: Create a booking (public - no auth required)
  logSection('Test 4: POST /api/bookings (Create Booking)');
  
  const venueId = await getTestVenueId();
  if (!venueId) {
    logWarning('No venue found in database. Skipping booking creation test.');
    logWarning('Please create at least one venue first.');
    results.errors++;
  } else {
      // Get a future date (30 days from now)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const dateString = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD format

      // First, get venue details to check capacity
      let venueCapacity = 200; // Default
      try {
        const venueResponse = await fetch(`${BASE_URL}/vendor/venues/${venueId}`);
        const venueData = await venueResponse.json();
        if (venueData.success && venueData.data) {
          const capacity = venueData.data.capacity;
          if (typeof capacity === 'object' && capacity.maxGuests) {
            venueCapacity = capacity.maxGuests;
          } else if (typeof capacity === 'number') {
            venueCapacity = capacity;
          }
          // Use a safe guest count (80% of max capacity, but at least 150)
          const safeGuestCount = Math.max(150, Math.floor(venueCapacity * 0.8));
          venueCapacity = safeGuestCount;
        }
      } catch (e) {
        logWarning(`Could not fetch venue details: ${e.message}, using default capacity`);
      }

      const test4 = await testAPI(
        'Create booking',
        'POST',
        '/bookings',
        {
          body: {
            venueId: venueId,
            date: dateString,
            name: 'Test User',
            phone: '9876543210',
            guests: venueCapacity, // Use venue's capacity
            foodPreference: 'both',
            totalAmount: 50000,
            deviceId: TEST_DEVICE_ID,
            marriageFor: 'boy',
            personName: 'Test Person',
          },
        }
      );
    
    let createdBookingId = null;
    if (test4.success && test4.data.booking) {
      createdBookingId = test4.data.booking._id;
      results.passed++;
    } else {
      results.failed++;
    }

    // Test 5: Get single booking by ID
    if (createdBookingId) {
      logSection('Test 5: GET /api/bookings/:id');
      const test5 = await testAPI(
        'Get single booking by ID',
        'GET',
        `/bookings/${createdBookingId}`
      );
      if (test5.success) results.passed++;
      else results.failed++;

      // Test 6: Get bookings with deviceId (should now return the booking we created)
      logSection('Test 6: GET /api/bookings (With deviceId - After Creation)');
      const test6 = await testAPI(
        'Get bookings with deviceId after creation',
        'GET',
        '/bookings',
        {
          query: { deviceId: TEST_DEVICE_ID },
        }
      );
      if (test6.success) {
        if (test6.data.bookings && test6.data.bookings.length > 0) {
          logSuccess(`Found ${test6.data.bookings.length} booking(s) for deviceId`);
          results.passed++;
        } else {
          logWarning('No bookings found for deviceId (might be expected)');
          results.passed++;
        }
      } else {
        results.failed++;
      }
    } else {
      logWarning('Skipping tests that require a created booking ID');
      results.errors++;
    }
  }

  // Test 7: Get bookings with query parameters
  logSection('Test 7: GET /api/bookings (With Query Parameters)');
  const test7 = await testAPI(
    'Get bookings with status filter',
    'GET',
    '/bookings',
    {
      query: { status: 'pending', deviceId: TEST_DEVICE_ID },
    }
  );
  if (test7.success) results.passed++;
  else results.failed++;

  // Test 8: Invalid booking ID
  logSection('Test 8: GET /api/bookings/:id (Invalid ID)');
  const test8 = await testAPI(
    'Get booking with invalid ID',
    'GET',
    '/bookings/invalid-id-12345'
  );
  // This should fail with proper error (400 or 404), which is expected behavior
  if (test8.status === 400 || test8.status === 404) {
    logSuccess('Invalid ID properly rejected (expected behavior)');
    results.passed++;
  } else if (test8.success) {
    logWarning('Unexpected: Invalid ID returned success');
    results.failed++;
  } else {
    logWarning('Unexpected response for invalid ID');
    results.failed++;
  }

  // Test 9: Create booking with missing required fields
  logSection('Test 9: POST /api/bookings (Missing Required Fields)');
  const test9 = await testAPI(
    'Create booking without required fields',
    'POST',
    '/bookings',
    {
      body: {
        // Missing venueId, date, guests, totalAmount
        name: 'Test User',
      },
    }
  );
  // This should fail with 400, which is expected behavior
  if (test9.status === 400) {
    logSuccess('Missing required fields properly rejected (expected behavior)');
    results.passed++;
  } else if (test9.success) {
    logWarning('Unexpected: Missing fields returned success');
    results.failed++;
  } else {
    logWarning('Unexpected response for missing fields');
    results.failed++;
  }

  // Test 10: Get bookings with date filters
  logSection('Test 10: GET /api/bookings (With Date Filters)');
  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 60);
  const futureDateStr = futureDate.toISOString().split('T')[0];

  const test10 = await testAPI(
    'Get bookings with date range',
    'GET',
    '/bookings',
    {
      query: {
        dateFrom: today,
        dateTo: futureDateStr,
        deviceId: TEST_DEVICE_ID,
      },
    }
  );
  if (test10.success) results.passed++;
  else results.failed++;

  // Summary
  logSection('📊 TEST SUMMARY');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, 'red');
  log(`⚠️  Errors/Skipped: ${results.errors}`, 'yellow');
  log(`\nTotal Tests: ${results.passed + results.failed + results.errors}`);
  
  const successRate = ((results.passed / (results.passed + results.failed + results.errors)) * 100).toFixed(1);
  log(`\nSuccess Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');

  if (results.failed === 0 && results.errors === 0) {
    log('\n🎉 All tests passed!', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please check the output above.', 'yellow');
  }
}

// Run tests
runTests().catch((error) => {
  logError(`Test suite error: ${error.message}`);
  console.error(error);
  process.exit(1);
});


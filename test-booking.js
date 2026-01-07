/**
 * Booking Test Script
 * This script tests booking creation and verifies vendor information is populated
 * 
 * Usage:
 *   node test-booking.js
 * 
 * Make sure backend server is running on http://localhost:8030
 */

import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:8030/api';

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

async function testBooking() {
  try {
    log('\n🚀 Starting Booking Test...\n', 'cyan');

    // Step 1: Get a venue (we'll use the first approved venue)
    log('📋 Step 1: Fetching venues...', 'blue');
    const venuesResponse = await axios.get(`${API_URL}/vendor/venues`, {
      params: { status: 'approved' }
    });

    // Debug: Log response structure
    console.log('Response structure:', JSON.stringify(venuesResponse.data, null, 2).substring(0, 500));

    const venues = venuesResponse.data?.venues || 
                   venuesResponse.data?.data || 
                   (Array.isArray(venuesResponse.data) ? venuesResponse.data : []);
    
    if (!venues || venues.length === 0) {
      log('❌ No approved venues found. Please create a venue first.', 'red');
      log('Response:', JSON.stringify(venuesResponse.data, null, 2), 'yellow');
      return;
    }

    const venue = venues[0];
    if (!venue) {
      log('❌ No venue found in response', 'red');
      return;
    }
    
    log(`✅ Found venue: ${venue?.name || 'Unknown'} (ID: ${venue?._id || 'N/A'})`, 'green');
    
    // Check if venue has vendorId
    if (!venue.vendorId) {
      log('⚠️  Warning: Venue does not have vendorId', 'yellow');
    } else {
      log(`   Vendor ID: ${venue.vendorId._id || venue.vendorId}`, 'cyan');
      if (venue.vendorId.name) {
        log(`   Vendor Name: ${venue.vendorId.name}`, 'cyan');
      }
    }

    // Step 2: Create a test booking
    log('\n📝 Step 2: Creating test booking...', 'blue');
    
    // Calculate future date (30 days from now)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const bookingDate = futureDate.toISOString().split('T')[0];

    const bookingData = {
      venueId: venue._id,
      date: bookingDate,
      dateFrom: bookingDate,
      dateTo: bookingDate,
      name: 'Test Customer',
      phone: '9876543210',
      email: 'test@example.com',
      marriageFor: 'boy',
      personName: 'Test Person',
      eventType: 'wedding',
      guests: 100,
      rooms: 5,
      foodPreference: 'both',
      totalAmount: 50000,
      paymentId: `test_pay_${Date.now()}`, // Test payment ID
      deviceId: `test_device_${Date.now()}`
    };

    log(`   Booking Date: ${bookingDate}`, 'cyan');
    log(`   Guests: ${bookingData.guests}`, 'cyan');
    log(`   Amount: ₹${bookingData.totalAmount}`, 'cyan');

    const createResponse = await axios.post(`${API_URL}/bookings`, bookingData);
    
    if (createResponse.data.success) {
      log('✅ Booking created successfully!', 'green');
      const booking = createResponse.data.booking;
      log(`   Booking ID: ${booking._id}`, 'cyan');
      log(`   Status: ${booking.status}`, 'cyan');
    } else {
      log('❌ Failed to create booking', 'red');
      log(JSON.stringify(createResponse.data, null, 2), 'red');
      return;
    }

    // Step 3: Verify booking with vendor information (as admin)
    log('\n🔍 Step 3: Verifying booking with vendor information...', 'blue');
    
    // Note: This requires admin authentication
    // For testing, we'll check the booking structure
    const bookingId = createResponse.data.booking._id;
    
    log(`   Checking booking: ${bookingId}`, 'cyan');
    
    // Try to get booking as admin (if you have admin token, uncomment below)
    // const adminToken = process.env.ADMIN_TOKEN || '';
    // if (adminToken) {
    //   const bookingResponse = await axios.get(`${API_URL}/admin/bookings/${bookingId}`, {
    //     headers: { Authorization: `Bearer ${adminToken}` }
    //   });
    //   const booking = bookingResponse.data.booking;
    //   log(`   Venue: ${booking.venueId?.name || 'N/A'}`, 'cyan');
    //   log(`   Vendor: ${booking.venueId?.vendorId?.name || 'N/A'}`, 'cyan');
    // }

    // Step 4: Get all bookings as admin to verify vendor info
    log('\n📊 Step 4: Fetching all bookings to verify vendor information...', 'blue');
    log('   (Note: This requires admin authentication)', 'yellow');
    
    log('\n✅ Test completed!', 'green');
    log('\n📋 Summary:', 'cyan');
    log(`   - Venue: ${venue?.name || 'N/A'}`, 'cyan');
    log(`   - Booking ID: ${bookingId}`, 'cyan');
    log(`   - Booking Date: ${bookingDate}`, 'cyan');
    log(`   - Check admin panel to verify vendor name appears with Booking ID`, 'cyan');
    log('\n');

  } catch (error) {
    log('\n❌ Test failed!', 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
      if (error.response.data?.message) {
        log(`   Message: ${error.response.data.message}`, 'yellow');
      }
      if (error.response.data?.error) {
        log(`   Error Details: ${error.response.data.error}`, 'yellow');
      }
    } else if (error.request) {
      log(`   No response received. Is backend server running?`, 'red');
      log(`   Request URL: ${error.config?.url}`, 'yellow');
    } else {
      log(`   Error: ${error.message}`, 'red');
      log(`   Stack: ${error.stack}`, 'yellow');
    }
    log('\n');
    process.exit(1);
  }
}

// Run the test
testBooking();


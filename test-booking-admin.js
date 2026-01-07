/**
 * Admin Booking Test Script
 * This script tests booking creation and verifies vendor information in admin panel
 * 
 * Usage:
 *   node test-booking-admin.js
 * 
 * Required:
 *   - Backend server running on http://localhost:8030
 *   - Admin token in ADMIN_TOKEN environment variable or .env file
 */

import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:8030/api';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testBookingWithAdmin() {
  try {
    log('\n🚀 Starting Admin Booking Test...\n', 'cyan');

    if (!ADMIN_TOKEN) {
      log('⚠️  Warning: ADMIN_TOKEN not set. Some tests will be skipped.', 'yellow');
      log('   Set ADMIN_TOKEN environment variable or add it to .env file\n', 'yellow');
    }

    // Step 1: Get venues
    log('📋 Step 1: Fetching venues...', 'blue');
    const venuesResponse = await axios.get(`${API_URL}/vendor/venues`, {
      params: { status: 'approved' }
    });

    const venues = venuesResponse.data?.venues || venuesResponse.data || [];
    
    if (venues.length === 0) {
      log('❌ No approved venues found. Please create a venue first.', 'red');
      return;
    }

    const venue = venues[0];
    log(`✅ Found venue: ${venue.name} (ID: ${venue._id})`, 'green');
    
    if (venue.vendorId) {
      const vendorId = venue.vendorId._id || venue.vendorId;
      log(`   Vendor ID: ${vendorId}`, 'cyan');
      if (venue.vendorId.name) {
        log(`   Vendor Name: ${venue.vendorId.name}`, 'cyan');
      }
    }

    // Step 2: Create a test booking
    log('\n📝 Step 2: Creating test booking...', 'blue');
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const bookingDate = futureDate.toISOString().split('T')[0];

    const bookingData = {
      venueId: venue._id,
      date: bookingDate,
      dateFrom: bookingDate,
      dateTo: bookingDate,
      name: 'Test Customer Admin',
      phone: '9876543211',
      email: 'testadmin@example.com',
      marriageFor: 'boy',
      personName: 'Test Person Admin',
      eventType: 'wedding',
      guests: 150,
      rooms: 10,
      foodPreference: 'both',
      totalAmount: 75000,
      paymentId: `test_pay_admin_${Date.now()}`,
      deviceId: `test_device_admin_${Date.now()}`
    };

    log(`   Booking Date: ${bookingDate}`, 'cyan');
    log(`   Guests: ${bookingData.guests}`, 'cyan');
    log(`   Amount: ₹${bookingData.totalAmount}`, 'cyan');

    const createResponse = await axios.post(`${API_URL}/bookings`, bookingData);
    
    if (!createResponse.data.success) {
      log('❌ Failed to create booking', 'red');
      log(JSON.stringify(createResponse.data, null, 2), 'red');
      return;
    }

    const booking = createResponse.data.booking;
    const bookingId = booking._id;
    log('✅ Booking created successfully!', 'green');
    log(`   Booking ID: ${bookingId}`, 'cyan');

    // Step 3: Get all bookings as admin to verify vendor info
    if (ADMIN_TOKEN) {
      log('\n🔍 Step 3: Fetching bookings as admin to verify vendor information...', 'blue');
      
      const bookingsResponse = await axios.get(`${API_URL}/admin/bookings`, {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
      });

      const bookings = bookingsResponse.data?.bookings || bookingsResponse.data || [];
      const testBooking = bookings.find(b => b._id === bookingId);

      if (testBooking) {
        log('✅ Found test booking in admin panel!', 'green');
        log('\n📊 Booking Details:', 'magenta');
        log(`   Booking ID: ${testBooking._id}`, 'cyan');
        log(`   Venue: ${testBooking.venueId?.name || 'N/A'}`, 'cyan');
        
        // Check vendor information
        const vendorId = testBooking.venueId?.vendorId;
        if (vendorId) {
          if (typeof vendorId === 'object' && vendorId.name) {
            log(`   ✅ Vendor Name: ${vendorId.name}`, 'green');
            log(`   ✅ Vendor ID: ${vendorId._id || vendorId}`, 'green');
            
            // Show first 3 words
            const words = vendorId.name.trim().split(/\s+/).slice(0, 3);
            log(`   ✅ First 3 words: "${words.join(' ')}"`, 'green');
          } else {
            log(`   ⚠️  Vendor ID exists but not populated: ${vendorId}`, 'yellow');
          }
        } else {
          log(`   ❌ No vendor information found`, 'red');
        }
        
        log(`   Customer: ${testBooking.customerId?.name || testBooking.name || 'N/A'}`, 'cyan');
        log(`   Status: ${testBooking.status}`, 'cyan');
        log(`   Amount: ₹${testBooking.totalAmount}`, 'cyan');
      } else {
        log('⚠️  Test booking not found in admin bookings list', 'yellow');
        log('   This might be normal if booking needs admin approval first', 'yellow');
      }

      // Step 4: Get single booking by ID
      log('\n🔍 Step 4: Fetching single booking by ID...', 'blue');
      try {
        const singleBookingResponse = await axios.get(`${API_URL}/admin/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
        });

        const singleBooking = singleBookingResponse.data?.booking;
        if (singleBooking) {
          log('✅ Single booking fetched successfully!', 'green');
          const vendorId = singleBooking.venueId?.vendorId;
          if (vendorId && typeof vendorId === 'object' && vendorId.name) {
            log(`   ✅ Vendor Name: ${vendorId.name}`, 'green');
            const words = vendorId.name.trim().split(/\s+/).slice(0, 3);
            log(`   ✅ First 3 words: "${words.join(' ')}"`, 'green');
          }
        }
      } catch (error) {
        log('⚠️  Could not fetch single booking (might need approval)', 'yellow');
      }
    } else {
      log('\n⚠️  Skipping admin verification (ADMIN_TOKEN not set)', 'yellow');
    }

    log('\n✅ Test completed!', 'green');
    log('\n📋 Summary:', 'cyan');
    log(`   - Venue: ${venue.name}`, 'cyan');
    log(`   - Booking ID: ${bookingId}`, 'cyan');
    log(`   - Booking Date: ${bookingDate}`, 'cyan');
    log(`   - Check admin panel at /admin/bookings to see vendor name with Booking ID`, 'cyan');
    log('\n');

  } catch (error) {
    log('\n❌ Test failed!', 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    } else {
      log(`   Error: ${error.message}`, 'red');
    }
    log('\n');
    process.exit(1);
  }
}

// Run the test
testBookingWithAdmin();


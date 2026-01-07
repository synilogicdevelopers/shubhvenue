/**
 * Simple Booking Test - Just verify existing bookings have vendor info
 * This script checks if existing bookings have vendor information populated
 */

import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:8030/api';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

async function testExistingBookings() {
  try {
    console.log('\n🚀 Testing Existing Bookings for Vendor Information...\n');

    if (!ADMIN_TOKEN) {
      console.log('⚠️  ADMIN_TOKEN not set. Trying without auth...\n');
    }

    // Get bookings
    const config = ADMIN_TOKEN ? {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
    } : {};

    console.log('📋 Fetching bookings...');
    const response = await axios.get(`${API_URL}/admin/bookings`, config);
    
    const bookings = response.data?.bookings || response.data || [];
    
    console.log(`✅ Found ${bookings.length} bookings\n`);

    if (bookings.length === 0) {
      console.log('ℹ️  No bookings found. Create a booking first.\n');
      return;
    }

    // Check first 3 bookings
    const bookingsToCheck = bookings.slice(0, 3);
    
    console.log('🔍 Checking vendor information in bookings:\n');
    
    bookingsToCheck.forEach((booking, index) => {
      console.log(`--- Booking ${index + 1} ---`);
      console.log(`Booking ID: ${booking._id?.slice(-8) || 'N/A'}`);
      console.log(`Venue: ${booking.venueId?.name || 'N/A'}`);
      
      const vendorId = booking.venueId?.vendorId;
      if (vendorId) {
        if (typeof vendorId === 'object' && vendorId.name) {
          console.log(`✅ Vendor Name: ${vendorId.name}`);
          console.log(`✅ Vendor ID: ${vendorId._id || vendorId}`);
          
          // Show first 3 words
          const words = vendorId.name.trim().split(/\s+/).slice(0, 3);
          console.log(`✅ First 3 words: "${words.join(' ')}"`);
          console.log(`\n   In table, should show:`);
          console.log(`   ${booking._id?.slice(-8)}`);
          console.log(`   ${words.join(' ')}\n`);
        } else {
          console.log(`⚠️  Vendor ID exists but not populated: ${vendorId}`);
        }
      } else {
        console.log(`❌ No vendor information found`);
      }
      console.log('');
    });

    console.log('✅ Test completed!\n');

  } catch (error) {
    console.error('\n❌ Test failed!');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error:`, error.response.data);
    } else {
      console.error(`Error:`, error.message);
    }
    process.exit(1);
  }
}

testExistingBookings();


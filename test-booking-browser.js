/**
 * Browser Console Test Script for Booking
 * 
 * Copy and paste this entire script into your browser console while on the admin bookings page
 * This will test if vendor information is showing correctly with Booking ID
 */

(async function testBookingInBrowser() {
  console.log('🚀 Starting Booking Test in Browser...\n');

  try {
    // Get API URL from environment or use default
    const API_URL = window.location.origin.includes('localhost') 
      ? 'http://localhost:8030/api' 
      : `${window.location.origin}/api`;

    console.log(`📡 API URL: ${API_URL}`);

    // Step 1: Get admin token from localStorage
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      console.error('❌ Admin token not found. Please login to admin panel first.');
      return;
    }
    console.log('✅ Admin token found\n');

    // Step 2: Get venues
    console.log('📋 Step 1: Fetching venues...');
    const venuesResponse = await fetch(`${API_URL}/vendor/venues?status=approved`);
    const venuesData = await venuesResponse.json();
    const venues = venuesData?.venues || venuesData || [];

    if (venues.length === 0) {
      console.error('❌ No approved venues found.');
      return;
    }

    const venue = venues[0];
    console.log(`✅ Found venue: ${venue.name} (ID: ${venue._id})`);
    if (venue.vendorId) {
      const vendorName = venue.vendorId.name || venue.vendorId;
      console.log(`   Vendor: ${vendorName}`);
    }
    console.log('');

    // Step 3: Create test booking
    console.log('📝 Step 2: Creating test booking...');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const bookingDate = futureDate.toISOString().split('T')[0];

    const bookingData = {
      venueId: venue._id,
      date: bookingDate,
      dateFrom: bookingDate,
      dateTo: bookingDate,
      name: 'Browser Test Customer',
      phone: '9876543212',
      email: 'browsertest@example.com',
      marriageFor: 'boy',
      personName: 'Browser Test Person',
      eventType: 'wedding',
      guests: 200,
      rooms: 15,
      foodPreference: 'both',
      totalAmount: 100000,
      paymentId: `test_pay_browser_${Date.now()}`,
      deviceId: `test_device_browser_${Date.now()}`
    };

    console.log(`   Date: ${bookingDate}`);
    console.log(`   Guests: ${bookingData.guests}`);
    console.log(`   Amount: ₹${bookingData.totalAmount}`);

    const createResponse = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData)
    });

    const createData = await createResponse.json();
    
    if (!createData.success) {
      console.error('❌ Failed to create booking:', createData);
      return;
    }

    const bookingId = createData.booking._id;
    console.log(`✅ Booking created! ID: ${bookingId}\n`);

    // Step 4: Get bookings as admin
    console.log('🔍 Step 3: Fetching bookings as admin...');
    const bookingsResponse = await fetch(`${API_URL}/admin/bookings`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const bookingsData = await bookingsResponse.json();
    const bookings = bookingsData?.bookings || bookingsData || [];
    const testBooking = bookings.find(b => b._id === bookingId);

    if (testBooking) {
      console.log('✅ Test booking found in admin panel!\n');
      console.log('📊 Booking Details:');
      console.log(`   Booking ID: ${testBooking._id}`);
      console.log(`   Venue: ${testBooking.venueId?.name || 'N/A'}`);
      
      // Check vendor information
      const vendorId = testBooking.venueId?.vendorId;
      if (vendorId) {
        if (typeof vendorId === 'object' && vendorId.name) {
          console.log(`   ✅ Vendor Name: ${vendorId.name}`);
          console.log(`   ✅ Vendor ID: ${vendorId._id || vendorId}`);
          
          // Show first 3 words
          const words = vendorId.name.trim().split(/\s+/).slice(0, 3);
          console.log(`   ✅ First 3 words: "${words.join(' ')}"`);
          console.log(`\n   🎯 In the table, Booking ID should show:`);
          console.log(`      ${testBooking._id.slice(-8)}`);
          console.log(`      ${words.join(' ')}`);
        } else {
          console.log(`   ⚠️  Vendor ID exists but not populated: ${vendorId}`);
        }
      } else {
        console.log(`   ❌ No vendor information found`);
      }
      
      console.log(`   Customer: ${testBooking.customerId?.name || testBooking.name || 'N/A'}`);
      console.log(`   Status: ${testBooking.status}`);
      console.log(`   Amount: ₹${testBooking.totalAmount}`);
    } else {
      console.log('⚠️  Test booking not found in list (might need refresh)');
    }

    console.log('\n✅ Test completed!');
    console.log('📋 Check the admin bookings table to see vendor name with Booking ID');
    console.log('   Refresh the page if booking is not visible yet.\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
})();


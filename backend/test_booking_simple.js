// Simple test to verify booking endpoints
// Run with: node test_booking_simple.js <token>
// Get token from browser: localStorage.getItem('vendor_token')

const BASE_URL = 'http://localhost:8030/api';
const token = process.argv[2];

if (!token) {
  console.log('❌ Please provide token as argument');
  console.log('   Usage: node test_booking_simple.js <your_token>');
  console.log('   Get token from browser: localStorage.getItem("vendor_token")');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
};

async function test() {
  console.log('🧪 Testing Vendor Booking APIs\n');

  // Test 1: Get bookings
  console.log('📋 Test 1: GET /vendor/bookings');
  try {
    const response = await fetch(`${BASE_URL}/vendor/bookings`, { headers });
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success');
      console.log(`   Count: ${data.count || data.bookings?.length || 0}`);
      if (data.bookings && data.bookings.length > 0) {
        console.log(`   First booking: ${data.bookings[0].venueName || data.bookings[0].venueId?.name || 'N/A'}`);
      }
    } else {
      console.log('❌ Failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${data.error || JSON.stringify(data)}`);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 2: Create booking with manual venue
  console.log('\n➕ Test 2: POST /vendor/bookings (Manual Venue)');
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  const dateString = futureDate.toISOString().split('T')[0];

  const bookingData = {
    venueId: null,
    venueName: `Test Venue ${Date.now()}`,
    date: dateString,
    dateFrom: dateString,
    dateTo: dateString,
    name: 'Test Customer',
    phone: '9876543210',
    email: 'test@example.com',
    eventType: 'wedding',
    marriageFor: 'boy',
    guests: 200,
    rooms: 5,
    foodPreference: 'both',
    totalAmount: 50000,
    paymentStatus: 'paid'
  };

  try {
    const response = await fetch(`${BASE_URL}/vendor/bookings`, {
      method: 'POST',
      headers,
      body: JSON.stringify(bookingData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success');
      console.log(`   Booking ID: ${data.booking?._id || data.booking?.id}`);
      console.log(`   Venue Name: ${data.booking?.venueName}`);
      console.log(`   Status: ${data.booking?.status}`);
      
      // Test 3: Verify it appears in list
      console.log('\n🔍 Test 3: Verify booking in list');
      await new Promise(r => setTimeout(r, 1000));
      
      const getResponse = await fetch(`${BASE_URL}/vendor/bookings`, { headers });
      const getData = await getResponse.json();
      
      if (getResponse.ok) {
        const bookingId = data.booking?._id || data.booking?.id;
        const found = getData.bookings?.find(b => (b._id || b.id) === bookingId);
        
        if (found) {
          console.log('✅ Booking found in list!');
        } else {
          console.log('⚠️  Booking not found yet (might need refresh)');
        }
      }
    } else {
      console.log('❌ Failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${data.error || data.message || JSON.stringify(data)}`);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n✅ Tests completed!');
}

test();


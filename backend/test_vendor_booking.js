import axios from 'axios';

const BASE_URL = 'http://localhost:8030/api';

// Test vendor booking creation and retrieval
async function testVendorBookings() {
  console.log('🧪 Testing Vendor Booking APIs\n');
  console.log('='.repeat(50));

  // You'll need to replace these with actual vendor credentials
  const VENDOR_EMAIL = 'abhibanaa706@gmail.com'; // From the logs
  const VENDOR_PASSWORD = 'your_password'; // You'll need to provide this

  let token = null;

  try {
    // Step 1: Login as vendor
    console.log('\n📝 Step 1: Login as vendor...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: VENDOR_EMAIL,
      password: VENDOR_PASSWORD
    });

    if (loginResponse.data.success && loginResponse.data.token) {
      token = loginResponse.data.token;
      console.log('✅ Login successful');
    } else {
      console.log('⚠️  Using existing token from localStorage or environment');
      // If login fails, you can manually set token here
      // token = 'your_token_here';
    }
  } catch (error) {
    console.log('⚠️  Login failed, continuing with manual token if available');
    console.log('   Error:', error.response?.data?.error || error.message);
  }

  if (!token) {
    console.log('\n❌ No token available. Please login first or set token manually.');
    console.log('   You can get token from browser localStorage: vendor_token');
    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // Step 2: Get existing bookings
  console.log('\n📋 Step 2: Getting existing bookings...');
  try {
    const getBookingsResponse = await axios.get(`${BASE_URL}/vendor/bookings`, { headers });
    console.log('✅ Get bookings successful');
    console.log(`   Total bookings: ${getBookingsResponse.data.count || getBookingsResponse.data.bookings?.length || 0}`);
    if (getBookingsResponse.data.bookings && getBookingsResponse.data.bookings.length > 0) {
      console.log('   Sample booking:', {
        id: getBookingsResponse.data.bookings[0]._id || getBookingsResponse.data.bookings[0].id,
        venueName: getBookingsResponse.data.bookings[0].venueName || getBookingsResponse.data.bookings[0].venueId?.name,
        customerName: getBookingsResponse.data.bookings[0].name,
        date: getBookingsResponse.data.bookings[0].date
      });
    }
  } catch (error) {
    console.log('❌ Get bookings failed');
    console.log('   Error:', error.response?.data?.error || error.message);
    console.log('   Status:', error.response?.status);
  }

  // Step 3: Create booking with manual venue name
  console.log('\n➕ Step 3: Creating booking with manual venue name...');
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  const dateString = futureDate.toISOString().split('T')[0];

  const bookingData = {
    venueId: null, // Manual venue
    venueName: 'Test Manual Venue - ' + new Date().getTime(), // Unique name
    date: dateString,
    dateFrom: dateString,
    dateTo: dateString,
    name: 'Test Customer',
    phone: '9876543210',
    email: 'test@example.com',
    eventType: 'wedding, reception',
    marriageFor: 'boy',
    personName: 'Test Person',
    guests: 200,
    rooms: 5,
    foodPreference: 'both',
    specialRequests: 'Test booking with manual venue name',
    totalAmount: 50000,
    paymentStatus: 'paid'
  };

  try {
    const createResponse = await axios.post(`${BASE_URL}/vendor/bookings`, bookingData, { headers });
    console.log('✅ Create booking successful');
    console.log('   Booking ID:', createResponse.data.booking?._id || createResponse.data.booking?.id);
    console.log('   Venue Name:', createResponse.data.booking?.venueName);
    console.log('   Status:', createResponse.data.booking?.status);
    console.log('   Message:', createResponse.data.message);

    const createdBookingId = createResponse.data.booking?._id || createResponse.data.booking?.id;

    // Step 4: Verify booking appears in list
    if (createdBookingId) {
      console.log('\n🔍 Step 4: Verifying booking appears in list...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

      try {
        const verifyResponse = await axios.get(`${BASE_URL}/vendor/bookings`, { headers });
        const foundBooking = verifyResponse.data.bookings?.find(
          b => (b._id || b.id) === createdBookingId
        );

        if (foundBooking) {
          console.log('✅ Booking found in list!');
          console.log('   Venue Name:', foundBooking.venueName || foundBooking.venueId?.name);
          console.log('   Customer:', foundBooking.name);
          console.log('   Date:', foundBooking.date || foundBooking.dateFrom);
        } else {
          console.log('⚠️  Booking created but not found in list yet');
          console.log('   This might be a timing issue - try refreshing');
        }
      } catch (error) {
        console.log('❌ Failed to verify booking');
        console.log('   Error:', error.response?.data?.error || error.message);
      }
    }
  } catch (error) {
    console.log('❌ Create booking failed');
    console.log('   Error:', error.response?.data?.error || error.response?.data?.message || error.message);
    console.log('   Status:', error.response?.status);
    if (error.response?.data) {
      console.log('   Response:', JSON.stringify(error.response.data, null, 2));
    }
  }

  // Step 5: Create booking with venue ID (if venues exist)
  console.log('\n➕ Step 5: Testing booking with venue ID...');
  try {
    // First, get vendor venues
    const venuesResponse = await axios.get(`${BASE_URL}/vendor/venues`, { headers });
    const venues = venuesResponse.data?.data || venuesResponse.data || [];

    if (venues.length > 0) {
      const venueId = venues[0]._id || venues[0].id;
      console.log(`   Using venue: ${venues[0].name} (${venueId})`);

      const bookingDataWithVenue = {
        venueId: venueId,
        venueName: null,
        date: dateString,
        dateFrom: dateString,
        dateTo: dateString,
        name: 'Test Customer 2',
        phone: '9876543211',
        email: 'test2@example.com',
        eventType: 'wedding',
        marriageFor: 'girl',
        personName: 'Test Person 2',
        guests: 150,
        rooms: 3,
        foodPreference: 'veg',
        specialRequests: 'Test booking with venue ID',
        totalAmount: 40000,
        paymentStatus: 'paid'
      };

      const createResponse2 = await axios.post(`${BASE_URL}/vendor/bookings`, bookingDataWithVenue, { headers });
      console.log('✅ Create booking with venue ID successful');
      console.log('   Booking ID:', createResponse2.data.booking?._id || createResponse2.data.booking?.id);
    } else {
      console.log('⚠️  No venues found, skipping venue ID test');
    }
  } catch (error) {
    console.log('❌ Create booking with venue ID failed');
    console.log('   Error:', error.response?.data?.error || error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Test completed!');
}

// Run tests
testVendorBookings().catch(console.error);


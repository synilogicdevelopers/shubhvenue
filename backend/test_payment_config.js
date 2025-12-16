import axios from 'axios';

const BASE_URL = process.env.API_URL || 'http://localhost:4000/api';

// Test Payment Configuration APIs
async function testPaymentConfig() {
  console.log('🧪 Testing Payment Configuration APIs...\n');

  try {
    // Test 1: Get Payment Config (Public - for app)
    console.log('1️⃣ Testing GET /api/payment/config (Public)...');
    try {
      const publicResponse = await axios.get(`${BASE_URL}/payment/config`);
      console.log('✅ Public Config API Response:');
      console.log('   Status:', publicResponse.status);
      console.log('   Success:', publicResponse.data.success);
      console.log('   Razorpay Key ID:', publicResponse.data.razorpayKeyId);
      console.log('   Is Active:', publicResponse.data.isActive);
      console.log('   Key ID starts with rzp_:', publicResponse.data.razorpayKeyId?.startsWith('rzp_'));
      console.log('   Key ID length:', publicResponse.data.razorpayKeyId?.length || 0);
    } catch (error) {
      console.log('❌ Public Config API Error:');
      if (error.code === 'ECONNREFUSED') {
        console.log('   ⚠️  Connection refused - Is backend server running?');
        console.log('   💡 Start backend server: npm start or node server.js');
      } else {
        console.log('   Status:', error.response?.status || 'N/A');
        console.log('   Message:', error.response?.data?.error || error.message);
        console.log('   Error Code:', error.code || 'N/A');
      }
    }

    console.log('\n');

    // Test 2: Get Payment Config (Admin - requires auth)
    console.log('2️⃣ Testing GET /api/admin/payment-config (Admin - requires auth)...');
    console.log('   ⚠️  This requires admin authentication token');
    console.log('   ⚠️  Skipping this test (requires login)');

    console.log('\n');

    // Test 3: Test Payment Order Creation (requires valid Razorpay keys)
    console.log('3️⃣ Testing POST /api/payment/create-order...');
    try {
      const orderResponse = await axios.post(`${BASE_URL}/payment/create-order`, {
        amount: 10000, // ₹100 in paise
        currency: 'INR',
        bookingId: 'test_booking_123'
      });
      console.log('✅ Payment Order Created:');
      console.log('   Status:', orderResponse.status);
      console.log('   Success:', orderResponse.data.success);
      console.log('   Order ID:', orderResponse.data.order?.id);
      console.log('   Amount:', orderResponse.data.order?.amount);
      console.log('   Currency:', orderResponse.data.order?.currency);
    } catch (error) {
      console.log('❌ Payment Order Creation Error:');
      if (error.code === 'ECONNREFUSED') {
        console.log('   ⚠️  Connection refused - Is backend server running?');
        console.log('   💡 Start backend server: npm start or node server.js');
      } else {
        console.log('   Status:', error.response?.status || 'N/A');
        console.log('   Error:', error.response?.data?.error || error.message);
        console.log('   Message:', error.response?.data?.message || 'N/A');
        
        if (error.response?.data?.message?.includes('not configured')) {
          console.log('   💡 Solution: Configure Razorpay keys in admin panel');
        }
      }
    }

    console.log('\n');

    // Summary
    console.log('📊 Test Summary:');
    console.log('   - Public config API: Tested');
    console.log('   - Admin config API: Requires authentication (skipped)');
    console.log('   - Payment order creation: Tested');
    console.log('\n✅ Testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testPaymentConfig();


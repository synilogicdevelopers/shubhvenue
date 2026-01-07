/**
 * Test Microservice Connection
 * Run this to test if microservice is accessible
 */

import axios from 'axios';

const MICROSERVICE_API_URL = process.env.MICROSERVICE_API_URL || 'https://payments.synilogic.in';

async function testMicroservice() {
  console.log('\n🧪 Testing Microservice Connection...\n');
  
  console.log('Configuration:');
  console.log(`  URL: ${MICROSERVICE_API_URL}`);
  console.log('  Auth: None (URL-only mode)\n');
  
  try {
    // Test 1: Health check or root endpoint
    console.log('📡 Test 1: Testing microservice connection...');
    const healthUrl = `${MICROSERVICE_API_URL}/health`;
    console.log(`   URL: ${healthUrl}`);
    
    try {
      const healthResponse = await axios.get(healthUrl, {
        timeout: 5000,
        validateStatus: () => true,
      });
      console.log(`   ✅ Status: ${healthResponse.status}`);
      console.log(`   Response:`, healthResponse.data);
    } catch (healthError) {
      console.log(`   ⚠️  Health check failed:`, healthError.message);
    }
    
    // Test 2: Payment order endpoint (without auth)
    console.log('\n📡 Test 2: Testing payment order endpoint (no auth)...');
    const orderUrl = `${MICROSERVICE_API_URL}/api/payment/order`;
    console.log(`   URL: ${orderUrl}`);
    
    const testPayload = {
      amount: 10000, // ₹100 in paise
      currency: 'INR',
      customer: {
        name: 'Test User',
        email: 'test@example.com',
        contact: '9876543210',
      },
      notes: {
        source: 'Shubhvenue Test',
        test: true,
      },
    };
    
    console.log('   Payload:', JSON.stringify(testPayload, null, 2));
    
    const orderResponse = await axios.post(orderUrl, testPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 10000,
      validateStatus: () => true,
    });
    
    console.log(`   Status: ${orderResponse.status}`);
    console.log(`   Response:`, JSON.stringify(orderResponse.data, null, 2));
    
    if (orderResponse.status === 200 || orderResponse.status === 201) {
      console.log('\n✅ Microservice is accessible and working!');
    } else {
      console.log('\n❌ Microservice returned error:');
      console.log(`   Error: ${orderResponse.data?.error || orderResponse.data?.message || 'Unknown error'}`);
      
      if (orderResponse.data?.error?.includes('Invalid project') || 
          orderResponse.data?.message?.includes('Invalid project')) {
        console.log('\n💡 Solution:');
        console.log('   Microservice requires authentication. You need to:');
        console.log('   1. Get Project Code and Secret from microservice admin panel');
        console.log('   2. Configure them in admin settings');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Test failed!');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error:`, error.response.data);
    } else if (error.request) {
      console.error(`   Network Error: Could not reach microservice`);
      console.error(`   URL: ${MICROSERVICE_API_URL}`);
      console.error(`   Check if microservice server is running and accessible`);
    } else {
      console.error(`   Error:`, error.message);
    }
  }
  
  console.log('\n');
}

testMicroservice();


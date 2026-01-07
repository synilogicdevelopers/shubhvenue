/**
 * Test Microservice with Provided Credentials
 */

import axios from 'axios';
import crypto from 'crypto';

const MICROSERVICE_API_URL = process.env.MICROSERVICE_API_URL || 'https://payments.synilogic.in';
const PROJECT_CODE = 'Shubhvenue_01';
const PROJECT_SECRET = 'sg24EgNojqyPmV6ih6JgjhCHykozNpf8VfDVkUsXuyKYVEHD0uydqbIfA0QUtTBa';

function generateSignature(bodyString, secret) {
  return crypto.createHmac('sha256', secret).update(bodyString).digest('hex');
}

async function testMicroservice() {
  console.log('\n🧪 Testing Microservice with Credentials...\n');
  
  console.log('Configuration:');
  console.log(`  URL: ${MICROSERVICE_API_URL}`);
  console.log(`  Project Code: ${PROJECT_CODE}`);
  console.log(`  Project Secret: ${PROJECT_SECRET.substring(0, 10)}...${PROJECT_SECRET.substring(PROJECT_SECRET.length - 5)}\n`);
  
  try {
    // Test payment order creation
    const endpoint = '/api/payment/order';
    const url = `${MICROSERVICE_API_URL}${endpoint}`;
    
    const payload = {
      amount: 10000, // ₹100 in paise
      currency: 'INR',
      customer: {
        name: 'Test User',
        email: 'test@example.com',
        contact: '9876543210',
      },
      notes: {
        source: 'Shubhvenue',
        test: true,
        venue_id: 'test_venue_id',
      },
    };
    
    const bodyString = JSON.stringify(payload);
    const signature = generateSignature(bodyString, PROJECT_SECRET);
    
    console.log('📤 Request Details:');
    console.log(`  URL: ${url}`);
    console.log(`  Method: POST`);
    console.log(`  Project Code: ${PROJECT_CODE}`);
    console.log(`  Signature: ${signature.substring(0, 20)}...`);
    console.log(`  Payload:`, JSON.stringify(payload, null, 2));
    console.log('');
    
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Project-Id': PROJECT_CODE,
        'X-Project-Signature': signature,
      },
      timeout: 10000,
      validateStatus: () => true,
    });
    
    console.log('📥 Response:');
    console.log(`  Status: ${response.status}`);
    console.log(`  Data:`, JSON.stringify(response.data, null, 2));
    console.log('');
    
    if (response.status === 200 || response.status === 201) {
      if (response.data?.success !== false && (response.data?.order_id || response.data?.data?.order_id)) {
        console.log('✅ SUCCESS! Microservice is working correctly!');
        console.log(`   Order ID: ${response.data?.order_id || response.data?.data?.order_id}`);
        console.log(`   Key ID: ${response.data?.key_id || response.data?.data?.key_id || 'N/A'}`);
        console.log('\n💡 These credentials are correct. Use them in admin panel:\n');
        console.log('   Project Code (Key ID): Shubhvenue_01');
        console.log('   Project Secret (Key Secret): sg24EgNojqyPmV6ih6JgjhCHykozNpf8VfDVkUsXuyKYVEHD0uydqbIfA0QUtTBa\n');
      } else {
        console.log('⚠️  Response received but format unexpected');
        console.log('   Check response structure above');
      }
    } else {
      console.log('❌ Error Response:');
      const errorMsg = response.data?.message || response.data?.error || 'Unknown error';
      console.log(`   Error: ${errorMsg}`);
      
      if (errorMsg.includes('Invalid project') || errorMsg.includes('invalid project')) {
        console.log('\n💡 Solution:');
        console.log('   Project Code or Secret might be incorrect.');
        console.log('   Verify in microservice admin panel that these exact values are correct.\n');
      } else if (errorMsg.includes('Missing authentication')) {
        console.log('\n💡 Solution:');
        console.log('   Authentication headers are missing or incorrect.\n');
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
    } else {
      console.error(`   Error:`, error.message);
    }
  }
  
  console.log('\n');
}

testMicroservice();


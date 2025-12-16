/**
 * Google Login API Test Script
 * 
 * Usage:
 * 1. Make sure backend server is running: npm run dev
 * 2. Get a valid Google ID token from Google Sign-In
 * 3. Run: node test_google_login.js <GOOGLE_ID_TOKEN>
 * 
 * Or use this script to test the endpoint structure
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000/api';
const GOOGLE_ID_TOKEN = process.argv[2];

async function testGoogleLogin() {
  console.log('🧪 Testing Google Login API...\n');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🔑 Google Client ID: ${process.env.GOOGLE_CLIENT_ID || 'NOT SET'}\n`);

  if (!GOOGLE_ID_TOKEN) {
    console.log('❌ Error: Google ID Token is required');
    console.log('\n📝 Usage:');
    console.log('   node test_google_login.js <GOOGLE_ID_TOKEN>');
    console.log('\n💡 To get Google ID Token:');
    console.log('   1. Use Google Sign-In in your Flutter app');
    console.log('   2. Copy the idToken from the response');
    console.log('   3. Use it in this test script\n');
    
    // Test endpoint availability
    console.log('🔍 Testing endpoint availability...');
    try {
      const response = await axios.post(
        `${BASE_URL}/auth/google-login`,
        {
          idToken: 'test_token_for_endpoint_check',
          role: 'customer'
        },
        {
          validateStatus: () => true // Don't throw on any status
        }
      );
      
      if (response.status === 401 || response.status === 400) {
        console.log('✅ Endpoint is accessible!');
        console.log(`   Status: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
      } else {
        console.log(`⚠️  Unexpected status: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('❌ Error: Cannot connect to server');
        console.log('   Make sure backend is running: npm run dev');
      } else {
        console.log(`❌ Error: ${error.message}`);
      }
    }
    return;
  }

  // Test with actual token
  console.log('📤 Sending Google Login Request...\n');
  
  const requestData = {
    idToken: GOOGLE_ID_TOKEN,
    role: 'customer',
    fcmToken: 'test_fcm_token_12345' // Optional
  };

  console.log('Request Data:');
  console.log(JSON.stringify({
    ...requestData,
    idToken: GOOGLE_ID_TOKEN.substring(0, 20) + '...' // Show only first 20 chars
  }, null, 2));
  console.log('');

  try {
    const response = await axios.post(
      `${BASE_URL}/auth/google-login`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ Success!');
    console.log(`   Status: ${response.status}`);
    console.log('\n📥 Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.token) {
      console.log('\n🎉 Google Login Successful!');
      console.log(`   Token: ${response.data.token.substring(0, 20)}...`);
      console.log(`   User: ${response.data.user?.name} (${response.data.user?.email})`);
      console.log(`   Role: ${response.data.user?.role}`);
    }

  } catch (error) {
    console.log('❌ Error occurred!\n');
    
    if (error.response) {
      // Server responded with error
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`);
      console.log('\n📥 Full Response:');
      console.log(JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // Request made but no response
      console.log('   Error: No response from server');
      console.log('   Make sure backend is running: npm run dev');
    } else {
      // Error setting up request
      console.log(`   Error: ${error.message}`);
    }
  }
}

// Run test
testGoogleLogin();





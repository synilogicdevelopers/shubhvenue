import axios from 'axios';

// Configuration
const BASE_URL = 'http://localhost:8030/api';

// Test vendor data
const testVendor = {
  name: 'Test Vendor',
  email: 'testvendor@example.com',
  password: 'test123456',
  phone: '9876543210',
  role: 'vendor'
};

async function createTestVendor() {
  try {
    console.log('📝 Creating test vendor...');
    console.log('📝 Vendor data:', testVendor);
    
    const response = await axios.post(`${BASE_URL}/auth/register`, testVendor);
    
    console.log('✅ Test vendor created successfully!');
    console.log('📥 Response:', JSON.stringify(response.data, null, 2));
    console.log('\n💡 Use these credentials in test-venue-api.mjs:');
    console.log(`   VENDOR_EMAIL = '${testVendor.email}'`);
    console.log(`   VENDOR_PASSWORD = '${testVendor.password}'`);
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('⚠️  Vendor already exists with this email');
      console.log('💡 You can use these credentials:');
      console.log(`   VENDOR_EMAIL = '${testVendor.email}'`);
      console.log(`   VENDOR_PASSWORD = '${testVendor.password}'`);
    } else {
      console.error('❌ Failed to create test vendor!');
      console.error('📥 Status:', error.response?.status);
      console.error('📥 Error data:', JSON.stringify(error.response?.data, null, 2));
      console.error('📥 Error message:', error.message);
    }
    throw error;
  }
}

// Run
createTestVendor().catch(() => process.exit(1));



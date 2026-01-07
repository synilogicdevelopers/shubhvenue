import axios from 'axios';
import FormData from 'form-data';

// Configuration
const BASE_URL = 'http://localhost:8030/api';
const VENDOR_EMAIL = 'vendor@example.com'; // Change this to your test vendor email
const VENDOR_PASSWORD = 'password123'; // Change this to your test vendor password

// Test data
const testVenueData = {
  name: 'Test Venue',
  capacity: 100,
  price: 5000,
  description: 'Test venue description',
  location: JSON.stringify({
    address: 'Test Address',
    city: 'Mumbai',
    state: 'Maharashtra'
  }),
  categoryId: '', // Optional
  menuId: '', // Optional
  subMenuId: '', // Optional
  amenities: ['Parking', 'AC', 'WiFi'],
  highlights: ['Beautiful venue', 'Great location'],
  services: JSON.stringify([]),
  rooms: JSON.stringify([]),
  availability: JSON.stringify({
    status: 'Open',
    openTime: '09:00',
    closeTime: '22:00',
    openDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  })
};

async function loginVendor() {
  try {
    console.log('🔐 Logging in vendor...');
    const response = await axios.post(`${BASE_URL}/vendor/login`, {
      email: VENDOR_EMAIL,
      password: VENDOR_PASSWORD
    });
    
    if (response.data.token) {
      console.log('✅ Login successful');
      return response.data.token;
    } else {
      throw new Error('No token received');
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testCreateVenue(token) {
  try {
    console.log('\n📤 Testing venue creation...');
    console.log('📤 Test data:', JSON.stringify(testVenueData, null, 2));
    
    const formData = new FormData();
    
    // Add all fields to FormData
    Object.keys(testVenueData).forEach(key => {
      const value = testVenueData[key];
      if (Array.isArray(value)) {
        value.forEach(item => formData.append(key, item));
      } else {
        formData.append(key, value);
      }
    });
    
    const response = await axios.post(`${BASE_URL}/vendor/venues`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    console.log('✅ Venue created successfully!');
    console.log('📥 Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Venue creation failed!');
    console.error('📥 Status:', error.response?.status);
    console.error('📥 Error data:', JSON.stringify(error.response?.data, null, 2));
    console.error('📥 Error message:', error.message);
    if (error.response?.data?.stack) {
      console.error('📥 Stack trace:', error.response.data.stack);
    }
    throw error;
  }
}

async function testCreateVenueWithFormConfig(token) {
  try {
    console.log('\n📤 Testing venue creation with formConfig (only name field)...');
    
    const formData = new FormData();
    formData.append('name', 'Test Venue - Name Only');
    // Only sending name, not sending location, capacity, etc.
    
    const response = await axios.post(`${BASE_URL}/vendor/venues`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    console.log('✅ Venue created successfully with formConfig!');
    console.log('📥 Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Venue creation with formConfig failed!');
    console.error('📥 Status:', error.response?.status);
    console.error('📥 Error data:', JSON.stringify(error.response?.data, null, 2));
    console.error('📥 Error message:', error.message);
    if (error.response?.data?.stack) {
      console.error('📥 Stack trace:', error.response.data.stack);
    }
    throw error;
  }
}

async function runTests() {
  try {
    console.log('🚀 Starting API Tests...\n');
    
    // Test 1: Login
    const token = await loginVendor();
    
    // Test 2: Create venue with all fields
    await testCreateVenue(token);
    
    // Test 3: Create venue with only name (formConfig test)
    await testCreateVenueWithFormConfig(token);
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Tests failed!');
    process.exit(1);
  }
}

// Run tests
runTests();


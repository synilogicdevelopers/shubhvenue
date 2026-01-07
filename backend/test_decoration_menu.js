import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:8030/api';
let adminToken = '';

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, token = null, isFormData = false) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {}
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (isFormData) {
      // Don't set Content-Type for FormData, let axios set it with boundary
      config.data = data;
    } else {
      config.headers['Content-Type'] = 'application/json';
      if (data) {
        config.data = data;
      }
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500,
      fullError: error
    };
  }
}

// Test login to get admin token
async function loginAsAdmin() {
  console.log('\n🔐 Testing Admin Login...');
  const result = await apiCall('POST', '/admin/login', {
    email: process.env.ADMIN_EMAIL || 'admin@admin.com',
    password: process.env.ADMIN_PASSWORD || 'admin123'
  });

  if (result.success && result.data.token) {
    adminToken = result.data.token;
    console.log('✅ Admin login successful');
    return true;
  } else {
    console.log('❌ Admin login failed:', result.error);
    return false;
  }
}

// Test creating Decoration menu with JSON (no file)
async function testCreateDecorationMenuJSON() {
  console.log('\n➕ Test 1: Create "Decoration" Menu with JSON (no image file)');
  const menuData = {
    name: 'Decoration',
    description: 'Decoration services for events',
    icon: 'decoration-icon',
    parentMenuId: 'null',
    isActive: true,
    sortOrder: 0
  };
  
  const result = await apiCall('POST', '/menus', menuData, adminToken);
  
  if (result.success) {
    console.log('✅ Menu created successfully');
    console.log('   ID:', result.data.menu._id);
    console.log('   Name:', result.data.menu.name);
    console.log('   Description:', result.data.menu.description);
    return result.data.menu;
  } else {
    console.log('❌ Failed:', result.error);
    console.log('   Status:', result.status);
    if (result.fullError?.response) {
      console.log('   Response:', JSON.stringify(result.fullError.response.data, null, 2));
    }
    return null;
  }
}

// Test creating Decoration menu with image URL
async function testCreateDecorationMenuWithImageURL() {
  console.log('\n➕ Test 2: Create "Decoration" Menu with Image URL');
  const menuData = {
    name: 'Decoration With Image',
    description: 'Decoration services with image URL',
    icon: 'decoration-icon',
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400',
    parentMenuId: 'null',
    isActive: true,
    sortOrder: 1
  };
  
  const result = await apiCall('POST', '/menus', menuData, adminToken);
  
  if (result.success) {
    console.log('✅ Menu created successfully with image URL');
    console.log('   ID:', result.data.menu._id);
    console.log('   Name:', result.data.menu.name);
    console.log('   Image:', result.data.menu.image);
    return result.data.menu;
  } else {
    console.log('❌ Failed:', result.error);
    console.log('   Status:', result.status);
    return null;
  }
}

// Main test function
async function runTest() {
  console.log('🚀 Testing Decoration Menu Creation...');
  console.log('='.repeat(50));
  console.log('Base URL:', BASE_URL);
  
  // Login as admin
  const loggedIn = await loginAsAdmin();
  if (!loggedIn) {
    console.log('\n⚠️ Cannot proceed without admin token');
    console.log('💡 Please set ADMIN_EMAIL and ADMIN_PASSWORD in .env file');
    return;
  }
  
  // Test 1: Create menu with JSON (no image)
  const menu1 = await testCreateDecorationMenuJSON();
  
  // Test 2: Create menu with image URL
  const menu2 = await testCreateDecorationMenuWithImageURL();
  
  console.log('\n' + '='.repeat(50));
  if (menu1 || menu2) {
    console.log('✅ Test completed!');
    if (menu1) {
      console.log(`   Created menu: ${menu1.name} (ID: ${menu1._id})`);
    }
    if (menu2) {
      console.log(`   Created menu: ${menu2.name} (ID: ${menu2._id})`);
    }
  } else {
    console.log('❌ Test failed - no menus were created');
  }
}

// Run test
runTest().catch(error => {
  console.error('❌ Test execution error:', error.message);
  console.error(error.stack);
  process.exit(1);
});


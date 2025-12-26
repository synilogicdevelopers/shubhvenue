/**
 * Test Script for Configure Forms Functionality
 * 
 * This script tests the vendor category form configuration API endpoints
 * Run with: node test-configure-forms.js
 */

import axios from 'axios';
import FormData from 'form-data';

// Configuration
const API_BASE_URL = 'http://localhost:8030/api';
// Get credentials from environment or use defaults
// Default admin credentials: admin@admin.com / admin123
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@admin.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Test data
const testFormConfig = {
  venue: {
    name: true,
    location: {
      enabled: true,
      city: true,
      state: true,
      address: true
    },
    priceType: {
      enabled: true,
      types: ['per_day', 'food_price_per_plate']
    },
    type: {
      enabled: true,
      allowCustom: true,
      options: ['Wedding', 'Corporate']
    },
    numberOfGuests: true,
    numberOfRooms: true,
    food: {
      enabled: true,
      options: ['veg', 'non_veg', 'both'],
      allowIndividualItems: true
    },
    amenities: true,
    highlights: true,
    timing: {
      enabled: true,
      openTime: true,
      closeTime: true
    },
    openDays: {
      enabled: true,
      allowAllDays: true,
      days: ['monday', 'tuesday', 'wednesday']
    },
    gender: false,
    category: true,
    menu: true,
    submenu: true,
    videos: true,
    galleryImages: true
  },
  booking: {
    date: true,
    numberOfGuests: true,
    numberOfRooms: true,
    type: {
      enabled: true,
      source: 'venue'
    },
    foodPrice: {
      enabled: true,
      autoCalculate: true
    },
    gender: false,
    pickupDrop: {
      enabled: false,
      pickup: false,
      drop: false
    },
    dateSelection: {
      enabled: true,
      allowMultipleDates: false
    }
  }
};

let adminToken = null;
let testCategoryId = null;

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        ...headers
      }
    };

    if (data) {
      if (data instanceof FormData) {
        // For FormData, don't set Content-Type - let axios set it with boundary
        config.headers = { 
          ...config.headers,
          ...data.getHeaders()
        };
        config.data = data;
      } else {
        config.headers['Content-Type'] = 'application/json';
        config.data = data;
      }
    } else {
      config.headers['Content-Type'] = 'application/json';
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

// Test 1: Admin Login
async function testAdminLogin() {
  console.log('\n📝 Test 1: Admin Login');
  console.log('='.repeat(50));
  
  const result = await apiCall('POST', '/admin/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });

  if (result.success && result.data.token) {
    adminToken = result.data.token;
    console.log('✅ Admin login successful');
    console.log(`   Token: ${adminToken.substring(0, 20)}...`);
    return true;
  } else {
    console.log('❌ Admin login failed');
    console.log('   Error:', result.error);
    return false;
  }
}

// Test 2: Create Vendor Category
async function testCreateCategory() {
  console.log('\n📝 Test 2: Create Vendor Category');
  console.log('='.repeat(50));

  const formData = new FormData();
  formData.append('name', 'Test Category - ' + Date.now());
  formData.append('description', 'Test category for form configuration');
  formData.append('isActive', 'true');

  const result = await apiCall('POST', '/admin/vendor-categories', formData, {
    Authorization: `Bearer ${adminToken}`,
    ...formData.getHeaders()
  });

  if (result.success && result.data.category) {
    testCategoryId = result.data.category._id;
    console.log('✅ Category created successfully');
    console.log(`   Category ID: ${testCategoryId}`);
    console.log(`   Name: ${result.data.category.name}`);
    return true;
  } else {
    console.log('❌ Category creation failed');
    console.log('   Error:', result.error);
    return false;
  }
}

// Test 3: Update Category with FormConfig
async function testUpdateFormConfig() {
  console.log('\n📝 Test 3: Update Category with FormConfig');
  console.log('='.repeat(50));

  const formData = new FormData();
  formData.append('formConfig', JSON.stringify(testFormConfig));

  const result = await apiCall('PUT', `/admin/vendor-categories/${testCategoryId}`, formData, {
    Authorization: `Bearer ${adminToken}`,
    ...formData.getHeaders()
  });

  if (result.success && result.data.category) {
    console.log('✅ FormConfig updated successfully');
    console.log(`   Category ID: ${result.data.category._id}`);
    
    // Verify formConfig was saved
    if (result.data.category.formConfig) {
      console.log('✅ FormConfig is present in response');
      console.log('   Venue config:', JSON.stringify(result.data.category.formConfig.venue, null, 2).substring(0, 100) + '...');
      console.log('   Booking config:', JSON.stringify(result.data.category.formConfig.booking, null, 2).substring(0, 100) + '...');
      return true;
    } else {
      console.log('❌ FormConfig not found in response');
      return false;
    }
  } else {
    console.log('❌ FormConfig update failed');
    console.log('   Error:', result.error);
    return false;
  }
}

// Test 4: Get Category and Verify FormConfig
async function testGetCategory() {
  console.log('\n📝 Test 4: Get Category and Verify FormConfig');
  console.log('='.repeat(50));

  const result = await apiCall('GET', `/admin/vendor-categories/${testCategoryId}`, null, {
    Authorization: `Bearer ${adminToken}`
  });

  if (result.success && result.data.category) {
    const category = result.data.category;
    console.log('✅ Category retrieved successfully');
    console.log(`   Category ID: ${category._id}`);
    console.log(`   Name: ${category.name}`);

    if (category.formConfig) {
      console.log('✅ FormConfig is present');
      
      // Verify structure
      if (category.formConfig.venue && category.formConfig.booking) {
        console.log('✅ FormConfig structure is correct');
        console.log(`   Venue fields: ${Object.keys(category.formConfig.venue).length} configured`);
        console.log(`   Booking fields: ${Object.keys(category.formConfig.booking).length} configured`);
        
        // Verify specific fields
        if (category.formConfig.venue.name === true) {
          console.log('✅ Venue.name is enabled');
        }
        if (category.formConfig.venue.location?.enabled === true) {
          console.log('✅ Venue.location is enabled');
        }
        if (category.formConfig.booking.date === true) {
          console.log('✅ Booking.date is enabled');
        }
        
        return true;
      } else {
        console.log('❌ FormConfig structure is incorrect');
        return false;
      }
    } else {
      console.log('❌ FormConfig not found');
      return false;
    }
  } else {
    console.log('❌ Failed to retrieve category');
    console.log('   Error:', result.error);
    return false;
  }
}

// Test 5: Update FormConfig with Partial Data
async function testPartialFormConfig() {
  console.log('\n📝 Test 5: Update FormConfig with Partial Data');
  console.log('='.repeat(50));

  const partialConfig = {
    venue: {
      name: false, // Disable name
      location: {
        enabled: true,
        city: false, // Disable city
        state: true,
        address: true
      }
    },
    booking: {
      date: true,
      numberOfGuests: false // Disable numberOfGuests
    }
  };

  const formData = new FormData();
  formData.append('formConfig', JSON.stringify(partialConfig));

  const result = await apiCall('PUT', `/admin/vendor-categories/${testCategoryId}`, formData, {
    Authorization: `Bearer ${adminToken}`,
    ...formData.getHeaders()
  });

  if (result.success && result.data.category) {
    const category = result.data.category;
    console.log('✅ Partial FormConfig updated successfully');
    
    if (category.formConfig) {
      // Check if partial update worked (should merge with existing)
      if (category.formConfig.venue?.name === false) {
        console.log('✅ Venue.name is correctly disabled');
      }
      if (category.formConfig.venue?.location?.city === false) {
        console.log('✅ Venue.location.city is correctly disabled');
      }
      if (category.formConfig.booking?.numberOfGuests === false) {
        console.log('✅ Booking.numberOfGuests is correctly disabled');
      }
      
      return true;
    } else {
      console.log('❌ FormConfig not found after partial update');
      return false;
    }
  } else {
    console.log('❌ Partial FormConfig update failed');
    console.log('   Error:', result.error);
    return false;
  }
}

// Test 6: Cleanup - Delete Test Category
async function testCleanup() {
  console.log('\n📝 Test 6: Cleanup - Delete Test Category');
  console.log('='.repeat(50));

  if (!testCategoryId) {
    console.log('⚠️  No test category to delete');
    return true;
  }

  const result = await apiCall('DELETE', `/admin/vendor-categories/${testCategoryId}`, null, {
    Authorization: `Bearer ${adminToken}`
  });

  if (result.success) {
    console.log('✅ Test category deleted successfully');
    return true;
  } else {
    console.log('❌ Failed to delete test category');
    console.log('   Error:', result.error);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('\n🚀 Starting Configure Forms API Tests');
  console.log('='.repeat(50));
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Admin Email: ${ADMIN_EMAIL}`);

  const results = {
    login: false,
    create: false,
    update: false,
    get: false,
    partial: false,
    cleanup: false
  };

  try {
    // Test 1: Login
    results.login = await testAdminLogin();
    if (!results.login) {
      console.log('\n❌ Cannot proceed without admin login');
      return;
    }

    // Test 2: Create Category
    results.create = await testCreateCategory();
    if (!results.create) {
      console.log('\n❌ Cannot proceed without creating category');
      return;
    }

    // Test 3: Update FormConfig
    results.update = await testUpdateFormConfig();

    // Test 4: Get and Verify
    results.get = await testGetCategory();

    // Test 5: Partial Update
    results.partial = await testPartialFormConfig();

    // Test 6: Cleanup
    results.cleanup = await testCleanup();

  } catch (error) {
    console.log('\n❌ Test execution error:', error.message);
  }

  // Summary
  console.log('\n📊 Test Summary');
  console.log('='.repeat(50));
  console.log(`Login:           ${results.login ? '✅' : '❌'}`);
  console.log(`Create Category: ${results.create ? '✅' : '❌'}`);
  console.log(`Update FormConfig: ${results.update ? '✅' : '❌'}`);
  console.log(`Get & Verify:    ${results.get ? '✅' : '❌'}`);
  console.log(`Partial Update:  ${results.partial ? '✅' : '❌'}`);
  console.log(`Cleanup:         ${results.cleanup ? '✅' : '❌'}`);

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  console.log(`\n${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
}

// Run tests
runTests().catch(console.error);


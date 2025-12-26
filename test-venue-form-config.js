/**
 * Test Script for Venue Form Configuration
 * 
 * This script tests that venue form correctly shows/hides fields based on formConfig
 * Run with: node test-venue-form-config.js
 */

import axios from 'axios';
import FormData from 'form-data';

// Configuration
const API_BASE_URL = 'http://localhost:8030/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@admin.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

let adminToken = null;
let testCategoryId = null;
let testVendorId = null;
let testVendorToken = null;

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
    return true;
  } else {
    console.log('❌ Admin login failed');
    console.log('   Error:', result.error);
    return false;
  }
}

// Test 2: Create Vendor Category with FormConfig
async function testCreateCategoryWithConfig() {
  console.log('\n📝 Test 2: Create Vendor Category with FormConfig');
  console.log('='.repeat(50));

  // Create category first
  const formData1 = new FormData();
  formData1.append('name', 'Test Venue Form Category - ' + Date.now());
  formData1.append('description', 'Test category for venue form configuration');
  formData1.append('isActive', 'true');

  const createResult = await apiCall('POST', '/admin/vendor-categories', formData1, {
    Authorization: `Bearer ${adminToken}`,
    ...formData1.getHeaders()
  });

  if (!createResult.success || !createResult.data.category) {
    console.log('❌ Category creation failed');
    return false;
  }

  testCategoryId = createResult.data.category._id;
  console.log('✅ Category created:', testCategoryId);

  // Now update with formConfig that disables some fields
  const formConfig = {
    venue: {
      name: true, // Enable name
      location: {
        enabled: true,
        city: true,
        state: true,
        address: false // Disable address
      },
      priceType: {
        enabled: false // Disable price type
      },
      type: {
        enabled: false // Disable type
      },
      numberOfGuests: true, // Enable
      numberOfRooms: false, // Disable
      food: {
        enabled: false // Disable food
      },
      amenities: true, // Enable
      highlights: false, // Disable
      timing: {
        enabled: false // Disable timing
      },
      openDays: {
        enabled: false // Disable open days
      },
      gender: false,
      category: true, // Enable
      menu: false, // Disable
      submenu: false, // Disable
      videos: true, // Enable
      galleryImages: false // Disable
    },
    booking: {
      date: true,
      numberOfGuests: true,
      numberOfRooms: true,
      type: { enabled: true, source: 'venue' },
      foodPrice: { enabled: true, autoCalculate: true },
      gender: false,
      pickupDrop: { enabled: false, pickup: false, drop: false },
      dateSelection: { enabled: true, allowMultipleDates: false }
    }
  };

  const formData2 = new FormData();
  formData2.append('formConfig', JSON.stringify(formConfig));

  const updateResult = await apiCall('PUT', `/admin/vendor-categories/${testCategoryId}`, formData2, {
    Authorization: `Bearer ${adminToken}`,
    ...formData2.getHeaders()
  });

  if (updateResult.success && updateResult.data.category?.formConfig) {
    console.log('✅ FormConfig updated successfully');
    console.log('   Disabled fields: address, priceType, type, numberOfRooms, food, highlights, timing, openDays, menu, submenu, galleryImages');
    console.log('   Enabled fields: name, location (city, state), numberOfGuests, amenities, category, videos');
    return true;
  } else {
    console.log('❌ FormConfig update failed');
    return false;
  }
}

// Test 3: Create Test Vendor with Category
async function testCreateVendor() {
  console.log('\n📝 Test 3: Create Test Vendor with Category');
  console.log('='.repeat(50));

  const vendorData = {
    name: 'Test Vendor - ' + Date.now(),
    email: `testvendor${Date.now()}@test.com`,
    password: 'test123456',
    phone: '1234567890',
    vendorStatus: 'approved'
  };

  const result = await apiCall('POST', '/admin/vendors', vendorData, {
    Authorization: `Bearer ${adminToken}`
  });

  if (result.success && result.data.vendor) {
    testVendorId = result.data.vendor._id;
    console.log('✅ Test vendor created:', testVendorId);
    
    // Assign category to vendor
    const assignResult = await apiCall('PUT', `/admin/vendors/${testVendorId}/category`, {
      categoryId: testCategoryId
    }, {
      Authorization: `Bearer ${adminToken}`
    });

    if (assignResult.success) {
      console.log('✅ Category assigned to vendor');
    } else {
      console.log('⚠️  Failed to assign category:', assignResult.error);
    }
    
    // Login as vendor to get token (use /auth/login endpoint)
    const loginResult = await apiCall('POST', '/auth/login', {
      email: vendorData.email,
      password: vendorData.password
    });

    if (loginResult.success && loginResult.data.token) {
      testVendorToken = loginResult.data.token;
      console.log('✅ Vendor login successful');
      return true;
    } else {
      console.log('❌ Vendor login failed');
      return false;
    }
  } else {
    console.log('❌ Vendor creation failed');
    console.log('   Error:', result.error);
    return false;
  }
}

// Test 4: Get Vendor Profile and Verify FormConfig
async function testGetVendorProfile() {
  console.log('\n📝 Test 4: Get Vendor Profile and Verify FormConfig');
  console.log('='.repeat(50));

  const result = await apiCall('GET', '/auth/profile', null, {
    Authorization: `Bearer ${testVendorToken}`
  });

  if (result.success && result.data.user) {
    const user = result.data.user;
    console.log('✅ Vendor profile retrieved');
    console.log('   User data:', JSON.stringify(user, null, 2).substring(0, 200) + '...');
    
    if (user.vendorCategory) {
      console.log('✅ VendorCategory is present');
      console.log('   Category:', user.vendorCategory.name);
      
      if (user.vendorCategory.formConfig) {
        console.log('✅ FormConfig is present in vendor profile');
        const venueConfig = user.vendorCategory.formConfig.venue;
      
      // Verify specific configurations
      const checks = [
        { field: 'name', expected: true, actual: venueConfig.name },
        { field: 'location.address', expected: false, actual: venueConfig.location?.address },
        { field: 'location.city', expected: true, actual: venueConfig.location?.city },
        { field: 'location.state', expected: true, actual: venueConfig.location?.state },
        { field: 'priceType.enabled', expected: false, actual: venueConfig.priceType?.enabled },
        { field: 'numberOfRooms', expected: false, actual: venueConfig.numberOfRooms },
        { field: 'amenities', expected: true, actual: venueConfig.amenities },
        { field: 'highlights', expected: false, actual: venueConfig.highlights },
        { field: 'category', expected: true, actual: venueConfig.category },
        { field: 'videos', expected: true, actual: venueConfig.videos },
        { field: 'galleryImages', expected: false, actual: venueConfig.galleryImages }
      ];

      let allCorrect = true;
      checks.forEach(check => {
        const status = check.actual === check.expected ? '✅' : '❌';
        if (check.actual !== check.expected) allCorrect = false;
        console.log(`   ${status} ${check.field}: expected ${check.expected}, got ${check.actual}`);
      });

      if (allCorrect) {
        console.log('\n✅ All formConfig values are correct!');
        return true;
      } else {
        console.log('\n❌ Some formConfig values are incorrect');
        return false;
      }
      } else {
        console.log('❌ FormConfig not found in vendorCategory');
        console.log('   vendorCategory:', JSON.stringify(user.vendorCategory, null, 2));
        return false;
      }
    } else {
      console.log('❌ vendorCategory not found in vendor profile');
      console.log('   User object keys:', Object.keys(user));
      return false;
    }
  } else {
    console.log('❌ Failed to get vendor profile');
    console.log('   Response:', JSON.stringify(result, null, 2).substring(0, 300));
    return false;
  }
}

// Test 5: Test Venue Form Field Visibility (Manual Verification Guide)
async function testVenueFormFields() {
  console.log('\n📝 Test 5: Venue Form Field Visibility');
  console.log('='.repeat(50));
  console.log('📋 Manual Verification Steps:');
  console.log('');
  console.log('1. Login to vendor panel with:');
  console.log(`   Email: testvendor${Date.now()}@test.com`);
  console.log('   Password: test123456');
  console.log('');
  console.log('2. Go to Venues → Add Venue');
  console.log('');
  console.log('3. Verify these fields are VISIBLE (enabled in formConfig):');
  console.log('   ✅ Venue Name');
  console.log('   ✅ Location - City');
  console.log('   ✅ Location - State');
  console.log('   ✅ Number of Guests');
  console.log('   ✅ Amenities');
  console.log('   ✅ Category');
  console.log('   ✅ Videos');
  console.log('');
  console.log('4. Verify these fields are HIDDEN (disabled in formConfig):');
  console.log('   ❌ Location - Address');
  console.log('   ❌ Price Type');
  console.log('   ❌ Type');
  console.log('   ❌ Number of Rooms');
  console.log('   ❌ Food');
  console.log('   ❌ Highlights');
  console.log('   ❌ Timing');
  console.log('   ❌ Open Days');
  console.log('   ❌ Menu');
  console.log('   ❌ Submenu');
  console.log('   ❌ Gallery Images');
  console.log('');
  console.log('💡 Note: When editing a venue, ALL fields should be visible');
  console.log('   (formConfig is ignored in edit mode)');
  console.log('');
  
  return true;
}

// Test 6: Cleanup
async function testCleanup() {
  console.log('\n📝 Test 6: Cleanup');
  console.log('='.repeat(50));

  let cleaned = true;

  // Delete vendor
  if (testVendorId) {
    const vendorResult = await apiCall('DELETE', `/admin/vendors/${testVendorId}`, null, {
      Authorization: `Bearer ${adminToken}`
    });
    if (vendorResult.success) {
      console.log('✅ Test vendor deleted');
    } else {
      console.log('⚠️  Failed to delete test vendor');
      cleaned = false;
    }
  }

  // Delete category
  if (testCategoryId) {
    const categoryResult = await apiCall('DELETE', `/admin/vendor-categories/${testCategoryId}`, null, {
      Authorization: `Bearer ${adminToken}`
    });
    if (categoryResult.success) {
      console.log('✅ Test category deleted');
    } else {
      console.log('⚠️  Failed to delete test category');
      cleaned = false;
    }
  }

  return cleaned;
}

// Main test runner
async function runTests() {
  console.log('\n🚀 Starting Venue Form Configuration Tests');
  console.log('='.repeat(50));
  console.log(`API Base URL: ${API_BASE_URL}`);

  const results = {
    login: false,
    createCategory: false,
    createVendor: false,
    getProfile: false,
    formFields: false,
    cleanup: false
  };

  try {
    // Test 1: Login
    results.login = await testAdminLogin();
    if (!results.login) {
      console.log('\n❌ Cannot proceed without admin login');
      return;
    }

    // Test 2: Create Category with FormConfig
    results.createCategory = await testCreateCategoryWithConfig();
    if (!results.createCategory) {
      console.log('\n❌ Cannot proceed without category');
      return;
    }

    // Test 3: Create Vendor
    results.createVendor = await testCreateVendor();
    if (!results.createVendor) {
      console.log('\n❌ Cannot proceed without vendor');
      return;
    }

    // Test 4: Get Profile and Verify
    results.getProfile = await testGetVendorProfile();

    // Test 5: Form Fields Guide
    results.formFields = await testVenueFormFields();

    // Test 6: Cleanup
    results.cleanup = await testCleanup();

  } catch (error) {
    console.log('\n❌ Test execution error:', error.message);
    console.error(error);
  }

  // Summary
  console.log('\n📊 Test Summary');
  console.log('='.repeat(50));
  console.log(`Admin Login:        ${results.login ? '✅' : '❌'}`);
  console.log(`Create Category:    ${results.createCategory ? '✅' : '❌'}`);
  console.log(`Create Vendor:      ${results.createVendor ? '✅' : '❌'}`);
  console.log(`Get Profile:       ${results.getProfile ? '✅' : '❌'}`);
  console.log(`Form Fields Guide: ${results.formFields ? '✅' : '❌'}`);
  console.log(`Cleanup:           ${results.cleanup ? '✅' : '❌'}`);

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  console.log(`\n${passed}/${total} tests passed`);

  if (results.getProfile) {
    console.log('\n🎉 API tests passed!');
    console.log('📝 Next: Manually verify venue form field visibility in the UI');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
}

// Run tests
runTests().catch(console.error);


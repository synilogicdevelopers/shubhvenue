import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:8030/api';
let adminToken = '';
let createdCategoryId = '';
let createdBannerId = '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logTest(name) {
  log(`\n🧪 Testing: ${name}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'reset');
}

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, token = null) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(url, config);
    const responseData = await response.json().catch(() => ({}));
    
    return {
      success: response.ok,
      data: responseData,
      status: response.status,
    };
  } catch (error) {
    // Handle connection errors
    if (error.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
      return {
        success: false,
        error: {
          message: 'Connection refused - Backend server is not running',
          hint: 'Please start the backend server: npm start or node server.js',
        },
        status: 503,
      };
    }
    return {
      success: false,
      error: error.message,
      status: 500,
    };
  }
}

// Test login to get admin token
async function loginAsAdmin() {
  logSection('Admin Login');
  logTest('Logging in as admin...');
  
  const result = await apiCall('POST', '/admin/login', {
    email: 'admin@admin.com',
    password: 'admin123',
  });

  if (result.success && result.data.token) {
    adminToken = result.data.token;
    logSuccess('Admin login successful');
    logInfo(`Token: ${adminToken.substring(0, 20)}...`);
    return true;
  } else {
    logError('Admin login failed');
    if (result.status === 503) {
      logError(`Error: ${result.error?.message || 'Connection failed'}`);
      logWarning(`💡 ${result.error?.hint || 'Please start the backend server'}`);
      logWarning('   Start server: npm start or node server.js');
    } else {
      logError(`Error: ${JSON.stringify(result.error, null, 2)}`);
      logWarning('💡 Please create admin user or check credentials');
      logWarning('   Create admin: npm run create-admin');
    }
    return false;
  }
}

// ==================== BANNER CATEGORY TESTS ====================

async function testCreateBannerCategory() {
  logSection('Banner Category - Create');
  logTest('Creating banner category...');
  
  const categoryData = {
    name: 'Home Page Banners',
    description: 'Banners for home page',
    isActive: true,
    sortOrder: 1,
  };

  logInfo(`Request: POST ${BASE_URL}/admin/banner-categories`);
  logInfo(`Body: ${JSON.stringify(categoryData, null, 2)}`);

  const result = await apiCall('POST', '/admin/banner-categories', categoryData, adminToken);

  if (result.success) {
    logSuccess('Banner category created successfully');
    logInfo(`Response: ${JSON.stringify(result.data, null, 2)}`);
    if (result.data.category?._id) {
      createdCategoryId = result.data.category._id;
      logInfo(`Created Category ID: ${createdCategoryId}`);
    }
    return result.data.category;
  } else {
    logError('Failed to create banner category');
    logError(`Status: ${result.status}`);
    logError(`Error: ${JSON.stringify(result.error, null, 2)}`);
    return null;
  }
}

async function testGetAllBannerCategories() {
  logSection('Banner Category - Get All');
  logTest('Getting all banner categories...');
  
  const result = await apiCall('GET', '/admin/banner-categories', null, adminToken);

  if (result.success) {
    logSuccess(`Found ${result.data.count || 0} banner categories`);
    logInfo(`Response: ${JSON.stringify(result.data, null, 2)}`);
    return result.data.categories || [];
  } else {
    logError('Failed to get banner categories');
    logError(`Status: ${result.status}`);
    logError(`Error: ${JSON.stringify(result.error, null, 2)}`);
    return [];
  }
}

async function testGetBannerCategoryById() {
  if (!createdCategoryId) {
    logWarning('Skipping - No category ID available');
    return null;
  }

  logSection('Banner Category - Get By ID');
  logTest(`Getting banner category by ID: ${createdCategoryId}`);
  
  const result = await apiCall('GET', `/admin/banner-categories/${createdCategoryId}`, null, adminToken);

  if (result.success) {
    logSuccess('Banner category retrieved successfully');
    logInfo(`Response: ${JSON.stringify(result.data, null, 2)}`);
    return result.data.category;
  } else {
    logError('Failed to get banner category');
    logError(`Status: ${result.status}`);
    logError(`Error: ${JSON.stringify(result.error, null, 2)}`);
    return null;
  }
}

async function testUpdateBannerCategory() {
  if (!createdCategoryId) {
    logWarning('Skipping - No category ID available');
    return null;
  }

  logSection('Banner Category - Update');
  logTest(`Updating banner category: ${createdCategoryId}`);
  
  const updateData = {
    name: 'Home Page Banners Updated',
    description: 'Updated description for home page banners',
    sortOrder: 2,
  };

  logInfo(`Request: PUT ${BASE_URL}/admin/banner-categories/${createdCategoryId}`);
  logInfo(`Body: ${JSON.stringify(updateData, null, 2)}`);

  const result = await apiCall('PUT', `/admin/banner-categories/${createdCategoryId}`, updateData, adminToken);

  if (result.success) {
    logSuccess('Banner category updated successfully');
    logInfo(`Response: ${JSON.stringify(result.data, null, 2)}`);
    return result.data.category;
  } else {
    logError('Failed to update banner category');
    logError(`Status: ${result.status}`);
    logError(`Error: ${JSON.stringify(result.error, null, 2)}`);
    return null;
  }
}

async function testToggleBannerCategoryActive() {
  if (!createdCategoryId) {
    logWarning('Skipping - No category ID available');
    return null;
  }

  logSection('Banner Category - Toggle Active');
  logTest(`Toggling banner category active status: ${createdCategoryId}`);
  
  const result = await apiCall('PUT', `/admin/banner-categories/${createdCategoryId}/toggle-active`, null, adminToken);

  if (result.success) {
    logSuccess('Banner category active status toggled successfully');
    logInfo(`Response: ${JSON.stringify(result.data, null, 2)}`);
    return result.data.category;
  } else {
    logError('Failed to toggle banner category active status');
    logError(`Status: ${result.status}`);
    logError(`Error: ${JSON.stringify(result.error, null, 2)}`);
    return null;
  }
}

// ==================== BANNER TESTS ====================

async function testCreateBanner() {
  logSection('Banner - Create');
  logTest('Creating banner with category...');
  
  // Create banner with categoryId
  const bannerData = {
    title: 'Test Banner 1',
    description: 'This is a test banner',
    image: 'https://via.placeholder.com/800x400.jpg',
    link: 'https://example.com',
    categoryId: createdCategoryId || null,
    isActive: true,
    sortOrder: 1,
  };

  logInfo(`Request: POST ${BASE_URL}/admin/banners`);
  logInfo(`Body: ${JSON.stringify(bannerData, null, 2)}`);

  const result = await apiCall('POST', '/admin/banners', bannerData, adminToken);

  if (result.success) {
    logSuccess('Banner created successfully');
    logInfo(`Response: ${JSON.stringify(result.data, null, 2)}`);
    if (result.data.banner?._id) {
      createdBannerId = result.data.banner._id;
      logInfo(`Created Banner ID: ${createdBannerId}`);
    }
    return result.data.banner;
  } else {
    logError('Failed to create banner');
    logError(`Status: ${result.status}`);
    logError(`Error: ${JSON.stringify(result.error, null, 2)}`);
    return null;
  }
}

async function testGetAllBanners() {
  logSection('Banner - Get All');
  logTest('Getting all banners...');
  
  const result = await apiCall('GET', '/admin/banners', null, adminToken);

  if (result.success) {
    logSuccess(`Found ${result.data.count || 0} banners`);
    logInfo(`Response: ${JSON.stringify(result.data, null, 2)}`);
    return result.data.banners || [];
  } else {
    logError('Failed to get banners');
    logError(`Status: ${result.status}`);
    logError(`Error: ${JSON.stringify(result.error, null, 2)}`);
    return [];
  }
}

async function testGetBannersByCategory() {
  if (!createdCategoryId) {
    logWarning('Skipping - No category ID available');
    return [];
  }

  logSection('Banner - Get By Category');
  logTest(`Getting banners by category: ${createdCategoryId}`);
  
  const result = await apiCall('GET', `/admin/banners?categoryId=${createdCategoryId}`, null, adminToken);

  if (result.success) {
    logSuccess(`Found ${result.data.count || 0} banners in this category`);
    logInfo(`Response: ${JSON.stringify(result.data, null, 2)}`);
    return result.data.banners || [];
  } else {
    logError('Failed to get banners by category');
    logError(`Status: ${result.status}`);
    logError(`Error: ${JSON.stringify(result.error, null, 2)}`);
    return [];
  }
}

async function testGetBannersWithoutCategory() {
  logSection('Banner - Get Without Category');
  logTest('Getting banners without category...');
  
  const result = await apiCall('GET', '/admin/banners?categoryId=null', null, adminToken);

  if (result.success) {
    logSuccess(`Found ${result.data.count || 0} banners without category`);
    logInfo(`Response: ${JSON.stringify(result.data, null, 2)}`);
    return result.data.banners || [];
  } else {
    logError('Failed to get banners without category');
    logError(`Status: ${result.status}`);
    logError(`Error: ${JSON.stringify(result.error, null, 2)}`);
    return [];
  }
}

async function testGetBannerById() {
  if (!createdBannerId) {
    logWarning('Skipping - No banner ID available');
    return null;
  }

  logSection('Banner - Get By ID');
  logTest(`Getting banner by ID: ${createdBannerId}`);
  
  const result = await apiCall('GET', `/admin/banners/${createdBannerId}`, null, adminToken);

  if (result.success) {
    logSuccess('Banner retrieved successfully');
    logInfo(`Response: ${JSON.stringify(result.data, null, 2)}`);
    return result.data.banner;
  } else {
    logError('Failed to get banner');
    logError(`Status: ${result.status}`);
    logError(`Error: ${JSON.stringify(result.error, null, 2)}`);
    return null;
  }
}

async function testUpdateBanner() {
  if (!createdBannerId) {
    logWarning('Skipping - No banner ID available');
    return null;
  }

  logSection('Banner - Update');
  logTest(`Updating banner: ${createdBannerId}`);
  
  const updateData = {
    title: 'Test Banner 1 Updated',
    description: 'Updated description for test banner',
    categoryId: createdCategoryId || null,
  };

  logInfo(`Request: PUT ${BASE_URL}/admin/banners/${createdBannerId}`);
  logInfo(`Body: ${JSON.stringify(updateData, null, 2)}`);

  const result = await apiCall('PUT', `/admin/banners/${createdBannerId}`, updateData, adminToken);

  if (result.success) {
    logSuccess('Banner updated successfully');
    logInfo(`Response: ${JSON.stringify(result.data, null, 2)}`);
    return result.data.banner;
  } else {
    logError('Failed to update banner');
    logError(`Status: ${result.status}`);
    logError(`Error: ${JSON.stringify(result.error, null, 2)}`);
    return null;
  }
}

async function testToggleBannerActive() {
  if (!createdBannerId) {
    logWarning('Skipping - No banner ID available');
    return null;
  }

  logSection('Banner - Toggle Active');
  logTest(`Toggling banner active status: ${createdBannerId}`);
  
  const result = await apiCall('PUT', `/admin/banners/${createdBannerId}/toggle-active`, null, adminToken);

  if (result.success) {
    logSuccess('Banner active status toggled successfully');
    logInfo(`Response: ${JSON.stringify(result.data, null, 2)}`);
    return result.data.banner;
  } else {
    logError('Failed to toggle banner active status');
    logError(`Status: ${result.status}`);
    logError(`Error: ${JSON.stringify(result.error, null, 2)}`);
    return null;
  }
}

// ==================== PUBLIC BANNER TESTS ====================

async function testGetPublicBanners() {
  logSection('Public Banner - Get All');
  logTest('Getting all public banners (no auth required)...');
  
  const result = await apiCall('GET', '/banners', null, null);

  if (result.success) {
    logSuccess(`Found ${result.data.count || 0} active public banners`);
    logInfo(`Response: ${JSON.stringify(result.data, null, 2)}`);
    return result.data.banners || [];
  } else {
    logError('Failed to get public banners');
    logError(`Status: ${result.status}`);
    logError(`Error: ${JSON.stringify(result.error, null, 2)}`);
    return [];
  }
}

async function testGetPublicBannersByCategory() {
  if (!createdCategoryId) {
    logWarning('Skipping - No category ID available');
    return [];
  }

  logSection('Public Banner - Get By Category');
  logTest(`Getting public banners by category: ${createdCategoryId}`);
  
  const result = await apiCall('GET', `/banners?categoryId=${createdCategoryId}`, null, null);

  if (result.success) {
    logSuccess(`Found ${result.data.count || 0} active public banners in this category`);
    logInfo(`Response: ${JSON.stringify(result.data, null, 2)}`);
    return result.data.banners || [];
  } else {
    logError('Failed to get public banners by category');
    logError(`Status: ${result.status}`);
    logError(`Error: ${JSON.stringify(result.error, null, 2)}`);
    return [];
  }
}

// ==================== CLEANUP TESTS ====================

async function testDeleteBanner() {
  if (!createdBannerId) {
    logWarning('Skipping - No banner ID available');
    return false;
  }

  logSection('Banner - Delete');
  logTest(`Deleting banner: ${createdBannerId}`);
  
  const result = await apiCall('DELETE', `/admin/banners/${createdBannerId}`, null, adminToken);

  if (result.success) {
    logSuccess('Banner deleted successfully');
    logInfo(`Response: ${JSON.stringify(result.data, null, 2)}`);
    createdBannerId = '';
    return true;
  } else {
    logError('Failed to delete banner');
    logError(`Status: ${result.status}`);
    logError(`Error: ${JSON.stringify(result.error, null, 2)}`);
    return false;
  }
}

async function testDeleteBannerCategory() {
  if (!createdCategoryId) {
    logWarning('Skipping - No category ID available');
    return false;
  }

  logSection('Banner Category - Delete');
  logTest(`Deleting banner category: ${createdCategoryId}`);
  
  const result = await apiCall('DELETE', `/admin/banner-categories/${createdCategoryId}`, null, adminToken);

  if (result.success) {
    logSuccess('Banner category deleted successfully');
    logInfo(`Response: ${JSON.stringify(result.data, null, 2)}`);
    createdCategoryId = '';
    return true;
  } else {
    logError('Failed to delete banner category');
    logError(`Status: ${result.status}`);
    logError(`Error: ${JSON.stringify(result.error, null, 2)}`);
    return false;
  }
}

// ==================== MAIN TEST RUNNER ====================

async function runTests() {
  logSection('🚀 Banner & Banner Category API Tests');
  logInfo(`Base URL: ${BASE_URL}`);
  logInfo(`Timestamp: ${new Date().toISOString()}\n`);

  // Step 1: Login
  const loginSuccess = await loginAsAdmin();
  if (!loginSuccess) {
    logError('\n❌ Cannot proceed without admin authentication');
    logWarning('Please ensure admin user exists and credentials are correct');
    return;
  }

  // Step 2: Banner Category Tests
  await testCreateBannerCategory();
  await testGetAllBannerCategories();
  await testGetBannerCategoryById();
  await testUpdateBannerCategory();
  await testToggleBannerCategoryActive();

  // Step 3: Banner Tests
  await testCreateBanner();
  await testGetAllBanners();
  await testGetBannersByCategory();
  await testGetBannersWithoutCategory();
  await testGetBannerById();
  await testUpdateBanner();
  await testToggleBannerActive();

  // Step 4: Public Banner Tests
  await testGetPublicBanners();
  await testGetPublicBannersByCategory();

  // Step 5: Cleanup (optional - comment out if you want to keep test data)
  logSection('Cleanup');
  logWarning('Cleaning up test data...');
  await testDeleteBanner();
  await testDeleteBannerCategory();

  logSection('✅ All Tests Completed');
  logSuccess('Test run finished!');
}

// Run tests
runTests().catch((error) => {
  logError(`\n❌ Test execution failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});


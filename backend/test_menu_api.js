import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:8030/api';
let adminToken = '';

// Test data
const testMenus = [
  {
    name: 'Event Services',
    description: 'All event-related services',
    icon: 'event-icon',
    parentMenuId: null
  },
  {
    name: 'Venue & Hall Bookings',
    description: 'Venue and hall booking services',
    icon: 'venue-icon',
    parentMenuId: null
  },
  {
    name: 'Stay & Hospitality Bookings',
    description: 'Stay and hospitality services',
    icon: 'stay-icon',
    parentMenuId: null
  }
];

const testSubmenus = [
  {
    name: 'Tent Booking',
    description: 'Tent booking services',
    parentMenuId: null // Will be set after main menu is created
  },
  {
    name: 'DJ Booking',
    description: 'DJ booking services',
    parentMenuId: null
  },
  {
    name: 'Party Hall Booking',
    description: 'Party hall booking services',
    parentMenuId: null
  }
];

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
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

// Test login to get admin token
async function loginAsAdmin() {
  console.log('\n🔐 Testing Admin Login...');
  const result = await apiCall('POST', '/auth/login', {
    email: 'admin@admin.com',
    password: 'admin123'
  });

  if (result.success && result.data.token) {
    adminToken = result.data.token;
    console.log('✅ Admin login successful');
    return true;
  } else {
    console.log('❌ Admin login failed:', result.error);
    console.log('💡 Please create admin user: npm run create-admin');
    return false;
  }
}

// Test 1: Get all menus (public)
async function testGetAllMenus() {
  console.log('\n📋 Test 1: Get All Menus (Public)');
  const result = await apiCall('GET', '/menus');
  
  if (result.success) {
    console.log('✅ Success:', result.data.count, 'menus found');
    if (result.data.menus && result.data.menus.length > 0) {
      console.log('   Sample menu:', result.data.menus[0].name);
    }
    return result.data.menus || [];
  } else {
    console.log('❌ Failed:', result.error);
    return [];
  }
}

// Test 2: Create main menu
async function testCreateMainMenu(menuData) {
  console.log(`\n➕ Test 2: Create Main Menu - "${menuData.name}"`);
  const result = await apiCall('POST', '/menus', menuData, adminToken);
  
  if (result.success) {
    console.log('✅ Menu created successfully');
    console.log('   ID:', result.data.menu._id);
    console.log('   Name:', result.data.menu.name);
    return result.data.menu;
  } else {
    console.log('❌ Failed:', result.error);
    return null;
  }
}

// Test 3: Create submenu
async function testCreateSubmenu(submenuData, parentMenuId) {
  console.log(`\n➕ Test 3: Create Submenu - "${submenuData.name}"`);
  const data = { ...submenuData, parentMenuId };
  const result = await apiCall('POST', '/menus', data, adminToken);
  
  if (result.success) {
    console.log('✅ Submenu created successfully');
    console.log('   ID:', result.data.menu._id);
    console.log('   Parent:', parentMenuId);
    return result.data.menu;
  } else {
    console.log('❌ Failed:', result.error);
    return null;
  }
}

// Test 4: Get menu by ID
async function testGetMenuById(menuId) {
  console.log(`\n🔍 Test 4: Get Menu By ID - ${menuId}`);
  const result = await apiCall('GET', `/menus/${menuId}`);
  
  if (result.success) {
    console.log('✅ Menu found');
    console.log('   Name:', result.data.menu.name);
    console.log('   Venue Count:', result.data.menu.venueCount);
    console.log('   Submenus:', result.data.menu.submenus?.length || 0);
    return result.data.menu;
  } else {
    console.log('❌ Failed:', result.error);
    return null;
  }
}

// Test 5: Update menu
async function testUpdateMenu(menuId) {
  console.log(`\n✏️ Test 5: Update Menu - ${menuId}`);
  const result = await apiCall('PUT', `/menus/${menuId}`, {
    description: 'Updated description for testing'
  }, adminToken);
  
  if (result.success) {
    console.log('✅ Menu updated successfully');
    return result.data.menu;
  } else {
    console.log('❌ Failed:', result.error);
    return null;
  }
}

// Test 6: Get submenus of a menu
async function testGetSubmenus(parentMenuId) {
  console.log(`\n📂 Test 6: Get Submenus of Menu - ${parentMenuId}`);
  const result = await apiCall('GET', `/menus?parentMenuId=${parentMenuId}`);
  
  if (result.success) {
    console.log('✅ Submenus found:', result.data.count);
    result.data.menus.forEach((submenu, index) => {
      console.log(`   ${index + 1}. ${submenu.name} (${submenu.venueCount} venues)`);
    });
    return result.data.menus;
  } else {
    console.log('❌ Failed:', result.error);
    return [];
  }
}

// Test 7: Delete menu (only if no venues/submenus)
async function testDeleteMenu(menuId) {
  console.log(`\n🗑️ Test 7: Delete Menu - ${menuId}`);
  const result = await apiCall('DELETE', `/menus/${menuId}`, null, adminToken);
  
  if (result.success) {
    console.log('✅ Menu deleted successfully');
    return true;
  } else {
    console.log('❌ Failed:', result.error);
    console.log('   (This is expected if menu has submenus or venues)');
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Menu API Tests...');
  console.log('=' .repeat(50));
  
  // Login as admin
  const loggedIn = await loginAsAdmin();
  if (!loggedIn) {
    console.log('\n⚠️ Cannot proceed without admin token');
    return;
  }
  
  // Test 1: Get all menus (should be empty initially)
  await testGetAllMenus();
  
  // Test 2: Create main menus
  const createdMenus = [];
  for (const menuData of testMenus) {
    const menu = await testCreateMainMenu(menuData);
    if (menu) {
      createdMenus.push(menu);
    }
  }
  
  if (createdMenus.length === 0) {
    console.log('\n⚠️ No menus created, cannot continue with submenu tests');
    return;
  }
  
  // Test 3: Create submenus
  const eventServicesMenu = createdMenus.find(m => m.name === 'Event Services');
  if (eventServicesMenu) {
    const submenu1 = await testCreateSubmenu(testSubmenus[0], eventServicesMenu._id);
    const submenu2 = await testCreateSubmenu(testSubmenus[1], eventServicesMenu._id);
  }
  
  const venueMenu = createdMenus.find(m => m.name === 'Venue & Hall Bookings');
  if (venueMenu) {
    const submenu3 = await testCreateSubmenu(testSubmenus[2], venueMenu._id);
  }
  
  // Test 4: Get menu by ID
  if (createdMenus[0]) {
    await testGetMenuById(createdMenus[0]._id);
  }
  
  // Test 5: Update menu
  if (createdMenus[0]) {
    await testUpdateMenu(createdMenus[0]._id);
  }
  
  // Test 6: Get submenus
  if (eventServicesMenu) {
    await testGetSubmenus(eventServicesMenu._id);
  }
  
  // Test 7: Get all menus again (should show created menus)
  console.log('\n📋 Final: Get All Menus (with submenus)');
  const finalMenus = await testGetAllMenus();
  
  if (finalMenus.length > 0) {
    console.log('\n📊 Summary:');
    finalMenus.forEach(menu => {
      console.log(`   - ${menu.name}: ${menu.venueCount} venues, ${menu.submenus?.length || 0} submenus`);
    });
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ All tests completed!');
  console.log('\n💡 Note: Created menus will remain in database.');
  console.log('   You can delete them manually via API or admin panel.');
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test execution error:', error.message);
  process.exit(1);
});


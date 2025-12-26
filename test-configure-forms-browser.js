/**
 * Browser Console Test Script for Configure Forms
 * 
 * Copy and paste this into the browser console while on the admin vendor categories page
 * Make sure you're logged in as admin
 */

(async function testConfigureForms() {
  console.log('🚀 Starting Configure Forms Browser Test');
  console.log('='.repeat(50));

  const API_BASE_URL = 'http://localhost:8030/api';
  const adminToken = localStorage.getItem('admin_token');

  if (!adminToken) {
    console.error('❌ Admin token not found. Please login as admin first.');
    return;
  }

  // Test FormConfig
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

  try {
    // Test 1: Get all categories
    console.log('\n📝 Test 1: Get All Categories');
    const getAllResponse = await fetch(`${API_BASE_URL}/admin/vendor-categories`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!getAllResponse.ok) {
      throw new Error(`Failed to get categories: ${getAllResponse.status}`);
    }

    const getAllData = await getAllResponse.json();
    console.log('✅ Categories retrieved:', getAllData.categories?.length || 0);

    if (!getAllData.categories || getAllData.categories.length === 0) {
      console.log('⚠️  No categories found. Please create a category first.');
      return;
    }

    // Use first category for testing
    const testCategory = getAllData.categories[0];
    console.log(`   Using category: ${testCategory.name} (ID: ${testCategory._id})`);

    // Test 2: Update category with formConfig
    console.log('\n📝 Test 2: Update Category with FormConfig');
    const formData = new FormData();
    formData.append('formConfig', JSON.stringify(testFormConfig));

    const updateResponse = await fetch(`${API_BASE_URL}/admin/vendor-categories/${testCategory._id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: formData
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(`Failed to update: ${JSON.stringify(errorData)}`);
    }

    const updateData = await updateResponse.json();
    console.log('✅ Category updated successfully');

    // Test 3: Verify formConfig was saved
    console.log('\n📝 Test 3: Verify FormConfig');
    if (updateData.category?.formConfig) {
      console.log('✅ FormConfig is present in response');
      console.log('   Venue config keys:', Object.keys(updateData.category.formConfig.venue || {}));
      console.log('   Booking config keys:', Object.keys(updateData.category.formConfig.booking || {}));
      
      // Verify specific values
      if (updateData.category.formConfig.venue?.name === true) {
        console.log('✅ venue.name is enabled');
      }
      if (updateData.category.formConfig.venue?.location?.enabled === true) {
        console.log('✅ venue.location is enabled');
      }
      if (updateData.category.formConfig.booking?.date === true) {
        console.log('✅ booking.date is enabled');
      }
    } else {
      console.log('❌ FormConfig not found in response');
      console.log('   Response:', updateData);
    }

    // Test 4: Get category again to verify persistence
    console.log('\n📝 Test 4: Get Category Again (Verify Persistence)');
    const getResponse = await fetch(`${API_BASE_URL}/admin/vendor-categories/${testCategory._id}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!getResponse.ok) {
      throw new Error(`Failed to get category: ${getResponse.status}`);
    }

    const getData = await getResponse.json();
    if (getData.category?.formConfig) {
      console.log('✅ FormConfig persisted correctly');
      console.log('   FormConfig matches:', 
        JSON.stringify(getData.category.formConfig) === JSON.stringify(testFormConfig) ? 'Yes' : 'No');
    } else {
      console.log('❌ FormConfig not found after retrieval');
    }

    // Test 5: Test partial update
    console.log('\n📝 Test 5: Test Partial FormConfig Update');
    const partialConfig = {
      venue: {
        name: false, // Disable name
        location: {
          enabled: true,
          city: false // Disable city
        }
      }
    };

    const partialFormData = new FormData();
    partialFormData.append('formConfig', JSON.stringify(partialConfig));

    const partialResponse = await fetch(`${API_BASE_URL}/admin/vendor-categories/${testCategory._id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: partialFormData
    });

    if (!partialResponse.ok) {
      throw new Error(`Failed to update partially: ${partialResponse.status}`);
    }

    const partialData = await partialResponse.json();
    console.log('✅ Partial update successful');
    
    if (partialData.category?.formConfig) {
      if (partialData.category.formConfig.venue?.name === false) {
        console.log('✅ venue.name is correctly disabled');
      }
      if (partialData.category.formConfig.venue?.location?.city === false) {
        console.log('✅ venue.location.city is correctly disabled');
      }
    }

    console.log('\n📊 Test Summary');
    console.log('='.repeat(50));
    console.log('✅ All tests completed!');
    console.log('\n💡 Tips:');
    console.log('   - Check the browser Network tab to see API requests');
    console.log('   - Verify formConfig in the database if needed');
    console.log('   - Test the form editor UI to see if it loads correctly');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('   Stack:', error.stack);
  }
})();


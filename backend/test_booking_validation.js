// Code validation test - checks if endpoints are properly configured
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Validating Booking Endpoints Configuration\n');
console.log('='.repeat(60));

let errors = [];
let warnings = [];
let success = [];

// Test 1: Check if routes file exists and has correct endpoints
try {
  const routesPath = join(__dirname, 'src', 'routes', 'v1', 'vendor.routes.js');
  const routesContent = readFileSync(routesPath, 'utf-8');
  
  if (routesContent.includes('getVendorBookings')) {
    success.push('✅ GET /vendor/bookings route found');
  } else {
    errors.push('❌ GET /vendor/bookings route not found');
  }
  
  if (routesContent.includes('createVendorBooking')) {
    success.push('✅ POST /vendor/bookings route found');
  } else {
    errors.push('❌ POST /vendor/bookings route not found');
  }
  
  if (routesContent.includes('requirePermission')) {
    success.push('✅ Permission middleware configured');
  } else {
    warnings.push('⚠️  Permission middleware might be missing');
  }
} catch (error) {
  errors.push(`❌ Cannot read routes file: ${error.message}`);
}

// Test 2: Check if controller has required functions
try {
  const controllerPath = join(__dirname, 'src', 'controllers', 'vendor.controller.js');
  const controllerContent = readFileSync(controllerPath, 'utf-8');
  
  if (controllerContent.includes('export const getVendorBookings')) {
    success.push('✅ getVendorBookings function found');
  } else {
    errors.push('❌ getVendorBookings function not found');
  }
  
  if (controllerContent.includes('export const createVendorBooking')) {
    success.push('✅ createVendorBooking function found');
  } else {
    errors.push('❌ createVendorBooking function not found');
  }
  
  // Check for manual venue name handling
  if (controllerContent.includes('trimmedVenueName')) {
    success.push('✅ Manual venue name handling implemented');
  } else {
    warnings.push('⚠️  Manual venue name handling might be missing');
  }
  
  // Check for error handling
  if (controllerContent.includes('catch (error)')) {
    success.push('✅ Error handling implemented');
  } else {
    warnings.push('⚠️  Error handling might be incomplete');
  }
  
  // Check for validation
  if (controllerContent.includes('!venueId && !trimmedVenueName')) {
    success.push('✅ Venue validation implemented');
  } else {
    warnings.push('⚠️  Venue validation might be missing');
  }
  
} catch (error) {
  errors.push(`❌ Cannot read controller file: ${error.message}`);
}

// Test 3: Check if Booking model exists
try {
  const modelPath = join(__dirname, 'src', 'models', 'Booking.js');
  const modelContent = readFileSync(modelPath, 'utf-8');
  
  if (modelContent.includes('venueName')) {
    success.push('✅ Booking model supports venueName field');
  } else {
    warnings.push('⚠️  Booking model might not support venueName');
  }
  
  if (modelContent.includes('venueId')) {
    success.push('✅ Booking model supports venueId field');
  } else {
    errors.push('❌ Booking model missing venueId field');
  }
} catch (error) {
  warnings.push(`⚠️  Cannot read Booking model: ${error.message}`);
}

// Print results
console.log('\n📊 Validation Results:\n');

if (success.length > 0) {
  console.log('✅ Success:');
  success.forEach(msg => console.log(`   ${msg}`));
}

if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  warnings.forEach(msg => console.log(`   ${msg}`));
}

if (errors.length > 0) {
  console.log('\n❌ Errors:');
  errors.forEach(msg => console.log(`   ${msg}`));
}

console.log('\n' + '='.repeat(60));

if (errors.length === 0) {
  console.log('\n✅ Code structure validation passed!');
  console.log('\n📝 Next Steps:');
  console.log('   1. Start the backend server');
  console.log('   2. Login as vendor in frontend');
  console.log('   3. Get token from browser: localStorage.getItem("vendor_token")');
  console.log('   4. Run: node test_booking_simple.js <token>');
  console.log('   OR test manually in the browser UI');
} else {
  console.log('\n❌ Code structure validation failed!');
  console.log('   Please fix the errors above before testing.');
}


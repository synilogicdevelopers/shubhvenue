/**
 * Test Razorpay Keys Script
 * This script tests if Razorpay keys are valid by creating a test order
 * 
 * Usage:
 *   node test-razorpay-keys.js
 */

import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import PaymentConfig from './src/models/PaymentConfig.js';

dotenv.config();

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

async function testRazorpayKeys() {
  try {
    log('\n🔍 Testing Razorpay Keys Configuration...\n', 'cyan');

    // Connect to database
    log('📡 Connecting to database...', 'blue');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shubhvenue';
    await mongoose.connect(mongoUri);
    log('✅ Database connected\n', 'green');

    // Get payment config
    log('📋 Fetching payment configuration...', 'blue');
    const config = await PaymentConfig.getConfig();
    
    if (!config) {
      log('❌ Payment configuration not found', 'red');
      log('   Please configure payment settings in admin panel\n', 'yellow');
      process.exit(1);
    }

    log('✅ Payment config found\n', 'green');
    log('📊 Configuration Details:', 'cyan');
    log(`   Payment Method: ${config.paymentMethod || 'microservice'}`, 'cyan');
    log(`   Key ID: ${config.razorpayKeyId ? config.razorpayKeyId.substring(0, 12) + '...' : 'Not set'}`, 'cyan');
    log(`   Key Secret: ${config.razorpayKeySecret ? 'Set (' + config.razorpayKeySecret.length + ' chars)' : 'Not set'}`, 'cyan');
    log('');

    // Check if using Razorpay method
    if (config.paymentMethod !== 'razorpay') {
      log('⚠️  Payment method is not "razorpay"', 'yellow');
      log(`   Current method: ${config.paymentMethod || 'microservice'}`, 'yellow');
      log('   To test Razorpay, set payment method to "razorpay" in admin panel\n', 'yellow');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Validate keys
    if (!config.razorpayKeyId || !config.razorpayKeySecret) {
      log('❌ Razorpay keys not configured', 'red');
      log('   Please set Razorpay Key ID and Secret in admin panel\n', 'yellow');
      await mongoose.disconnect();
      process.exit(1);
    }

    // Validate key format
    if (!config.razorpayKeyId.startsWith('rzp_')) {
      log('❌ Invalid Razorpay Key ID format', 'red');
      log(`   Key ID should start with "rzp_", got: ${config.razorpayKeyId.substring(0, 10)}...`, 'red');
      log('   Please check your Razorpay Key ID in admin panel\n', 'yellow');
      await mongoose.disconnect();
      process.exit(1);
    }

    log('✅ Key format valid\n', 'green');

    // Test Razorpay connection
    log('🔐 Testing Razorpay authentication...', 'blue');
    try {
      const razorpay = new Razorpay({
        key_id: config.razorpayKeyId,
        key_secret: config.razorpayKeySecret,
      });

      // Try to create a test order (minimum ₹1 = 100 paise)
      log('   Creating test order (₹1)...', 'cyan');
      const testOrder = await razorpay.orders.create({
        amount: 100, // ₹1 in paise
        currency: 'INR',
        receipt: `test_${Date.now()}`,
        notes: {
          test: 'true',
          source: 'Shubhvenue Test Script'
        }
      });

      log('✅ Razorpay authentication successful!', 'green');
      log('✅ Test order created successfully!', 'green');
      log('\n📊 Test Order Details:', 'cyan');
      log(`   Order ID: ${testOrder.id}`, 'cyan');
      log(`   Amount: ₹${testOrder.amount / 100}`, 'cyan');
      log(`   Currency: ${testOrder.currency}`, 'cyan');
      log(`   Status: ${testOrder.status}`, 'cyan');
      log('\n✅ Your Razorpay keys are valid and working!\n', 'green');

      // Clean up - cancel the test order (if possible)
      try {
        // Note: Razorpay doesn't have a cancel order API, but test orders expire automatically
        log('ℹ️  Test order will expire automatically (no action needed)\n', 'yellow');
      } catch (cleanupError) {
        // Ignore cleanup errors
      }

    } catch (razorpayError) {
      log('❌ Razorpay authentication failed!', 'red');
      log('\n📋 Error Details:', 'yellow');
      
      if (razorpayError.statusCode === 401) {
        log('   Status Code: 401 (Unauthorized)', 'red');
        log('   Issue: Invalid Razorpay Key ID or Secret', 'red');
        log('\n💡 Solution:', 'yellow');
        log('   1. Go to Razorpay Dashboard: https://dashboard.razorpay.com/', 'yellow');
        log('   2. Settings → API Keys', 'yellow');
        log('   3. Copy your Key ID (starts with rzp_test_ or rzp_live_)', 'yellow');
        log('   4. Copy your Key Secret (click "Reveal" to see it)', 'yellow');
        log('   5. Go to Admin Panel → Settings → Payment Configuration', 'yellow');
        log('   6. Paste the keys and save', 'yellow');
      } else if (razorpayError.statusCode === 400) {
        log('   Status Code: 400 (Bad Request)', 'red');
        log(`   Error: ${razorpayError.error?.description || razorpayError.message}`, 'red');
      } else {
        log(`   Status Code: ${razorpayError.statusCode || 'Unknown'}`, 'red');
        log(`   Error: ${razorpayError.error?.description || razorpayError.message || 'Unknown error'}`, 'red');
      }

      if (razorpayError.error) {
        log('\n   Full Error:', 'yellow');
        log(`   ${JSON.stringify(razorpayError.error, null, 2)}`, 'yellow');
      }

      log('\n');
      await mongoose.disconnect();
      process.exit(1);
    }

    await mongoose.disconnect();
    log('✅ Test completed successfully!\n', 'green');

  } catch (error) {
    log('\n❌ Test failed!', 'red');
    log(`   Error: ${error.message}`, 'red');
    if (error.stack) {
      log(`   Stack: ${error.stack}`, 'yellow');
    }
    log('\n');
    
    try {
      await mongoose.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    
    process.exit(1);
  }
}

// Run the test
testRazorpayKeys();


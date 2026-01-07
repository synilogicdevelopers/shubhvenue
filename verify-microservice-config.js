/**
 * Verify Microservice Configuration
 * This script checks if microservice credentials are correctly configured
 */

import mongoose from 'mongoose';
import PaymentConfig from './backend/src/models/PaymentConfig.js';
import dotenv from 'dotenv';

dotenv.config();

async function verifyConfig() {
  try {
    console.log('\n🔍 Verifying Microservice Configuration...\n');
    
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shubhvenue';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database\n');
    
    // Get config
    const config = await PaymentConfig.findOne();
    
    if (!config) {
      console.log('❌ No payment configuration found in database');
      console.log('   Please configure payment settings in admin panel\n');
      return;
    }
    
    console.log('📋 Payment Configuration:');
    console.log(`   Enable Razorpay Direct: ${config.enableRazorpayDirect}`);
    console.log(`   Enable Microservice: ${config.enableMicroservice}`);
    console.log(`   Project Code (Key ID): ${config.razorpayKeyId ? (config.razorpayKeyId.substring(0, 15) + '...') : 'NOT SET'}`);
    console.log(`   Project Secret: ${config.razorpayKeySecret ? ('***' + config.razorpayKeySecret.substring(config.razorpayKeySecret.length - 5)) : 'NOT SET'}`);
    console.log(`   Secret Length: ${config.razorpayKeySecret ? config.razorpayKeySecret.length : 0} characters\n`);
    
    // Check environment
    const apiUrl = process.env.MICROSERVICE_API_URL;
    console.log('🌐 Environment Configuration:');
    console.log(`   MICROSERVICE_API_URL: ${apiUrl || 'NOT SET'}\n`);
    
    // Validation
    if (config.enableMicroservice) {
      console.log('✅ Microservice Payment is ENABLED\n');
      
      if (!apiUrl) {
        console.log('❌ ERROR: MICROSERVICE_API_URL is not set in .env file');
        console.log('   Add this to backend .env:');
        console.log('   MICROSERVICE_API_URL=https://payments.synilogic.in\n');
      } else {
        console.log('✅ MICROSERVICE_API_URL is configured\n');
      }
      
      if (!config.razorpayKeyId || !config.razorpayKeySecret) {
        console.log('❌ ERROR: Project Code or Secret is missing');
        console.log('   Please configure in admin panel → Settings → Payment Configuration\n');
      } else {
        console.log('✅ Project Code and Secret are configured\n');
        
        // Check format
        if (config.razorpayKeyId.length < 5) {
          console.log('⚠️  WARNING: Project Code seems too short');
        }
        
        if (config.razorpayKeySecret.length < 10) {
          console.log('⚠️  WARNING: Project Secret seems too short');
        }
        
        console.log('💡 Tips:');
        console.log('   1. Verify Project Code and Secret in microservice admin panel');
        console.log('   2. Make sure there are no extra spaces');
        console.log('   3. Copy-paste directly from microservice admin panel');
        console.log('   4. Callback URL should be: https://shubhvenue.com/api/microservice/payment-callback\n');
      }
    } else if (config.enableRazorpayDirect) {
      console.log('✅ Razorpay Direct is ENABLED\n');
      
      if (!config.razorpayKeyId || !config.razorpayKeySecret) {
        console.log('❌ ERROR: Razorpay Key ID or Secret is missing\n');
      } else {
        console.log('✅ Razorpay keys are configured\n');
      }
    } else {
      console.log('⚠️  WARNING: No payment method is enabled\n');
    }
    
    await mongoose.disconnect();
    console.log('✅ Verification complete\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('connect')) {
      console.error('   Make sure MongoDB is running and MONGODB_URI is correct\n');
    }
    process.exit(1);
  }
}

verifyConfig();


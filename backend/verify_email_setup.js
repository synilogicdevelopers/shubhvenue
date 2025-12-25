import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectToDatabase } from './src/config/db.js';
import EmailConfig from './src/models/EmailConfig.js';

// Sender email - configure this in admin settings or ZeptoMail dashboard
const SENDER_EMAIL = ''; // Set your verified sender email here

async function checkEmailSetup() {
  try {
    console.log('🔌 Connecting to database...');
    await connectToDatabase();
    console.log('✅ Database connected\n');

    console.log('📋 Checking Email Configuration...\n');
    
    const config = await EmailConfig.getConfig();
    
    console.log('Current Email Configuration:');
    console.log('─────────────────────────────────────────');
    console.log('SMTP Host:', config.smtpHost);
    console.log('SMTP Port:', config.smtpPort);
    console.log('SMTP Security:', config.smtpSecurity);
    console.log('SMTP Username:', config.smtpUsername);
    console.log('From Email:', config.emailFromAddress);
    console.log('From Name:', config.emailFromName);
    console.log('─────────────────────────────────────────\n');

    console.log('⚠️  IMPORTANT: ZeptoMail Verification Required\n');
    console.log('To send emails, you need to verify the sender email in ZeptoMail dashboard:\n');
    console.log('📝 Steps to Verify:');
    console.log('   1. Go to: https://www.zeptomail.com/');
    console.log('   2. Login to your ZeptoMail account');
    console.log('   3. Navigate to "Senders" or "Verified Senders" section');
    console.log('   4. Click "Add Sender" or "Verify Sender"');
    console.log('   5. Enter your sender email address');
    console.log('   6. ZeptoMail will send a verification email to that address');
    console.log('   7. Check your Gmail inbox for verification email');
    console.log('   8. Click the verification link in that email');
    console.log('   9. Once verified, the email will show as "Verified" in dashboard\n');
    
    console.log('📧 After Verification:');
    console.log('   - Run: node test_email.js');
    console.log('   - Or use API: POST /api/admin/email-config/test');
    console.log('   - Body: { "email": "synilogicflutterdevelopers@gmail.com" }\n');
    
    console.log('💡 Note:');
    console.log('   - Verification email is sent by ZeptoMail, not by our system');
    console.log('   - You must verify the email in ZeptoMail dashboard first');
    console.log('   - Only verified emails can be used as "from" address\n');

    // Check if email is configured
    if (config.emailFromAddress) {
      console.log('✅ Email address is configured:', config.emailFromAddress);
      console.log('   Make sure this email is verified in ZeptoMail dashboard');
    } else {
      console.log('⚠️  Email address not configured!');
      console.log('   Please set emailFromAddress in admin settings');
      console.log('   Go to: Admin Settings → Email Configuration');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkEmailSetup();


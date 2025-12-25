import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectToDatabase } from './src/config/db.js';
import { sendTestEmail } from './src/utils/emailService.js';

// Test email - change this to your test email
const TEST_EMAIL = 'synilogicflutterdevelopers@gmail.com';

async function testEmail() {
  try {
    console.log('🔌 Connecting to database...');
    await connectToDatabase();
    console.log('✅ Database connected\n');

    console.log('📧 Sending test email to:', TEST_EMAIL);
    console.log('─────────────────────────────────────────\n');

    const result = await sendTestEmail(TEST_EMAIL);

    if (result.success) {
      console.log('✅ SUCCESS! Test email sent successfully!');
      console.log('   Message ID:', result.messageId);
      console.log('\n📬 Please check the inbox of:', TEST_EMAIL);
      console.log('   (Also check spam/junk folder if not found)');
    } else {
      console.log('❌ FAILED to send test email');
      console.log('   Error:', result.error);
      
      if (result.error.includes('553') || result.error.includes('relay')) {
        console.log('\n⚠️  IMPORTANT: Sender email needs to be verified in ZeptoMail!');
        console.log('   1. Go to ZeptoMail dashboard: https://www.zeptomail.com/');
        console.log('   2. Add and verify: synilogicflutterdevelopers@gmail.com');
        console.log('   3. Check your email for verification link');
        console.log('   4. Run this test again after verification');
        console.log('\n   See EMAIL_SETUP_INSTRUCTIONS.md for detailed steps');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testEmail();


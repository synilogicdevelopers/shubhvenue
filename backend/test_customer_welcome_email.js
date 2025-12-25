import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectToDatabase } from './src/config/db.js';
import { sendCustomerWelcomeEmail } from './src/utils/emailService.js';

// Test customer email - change this to your test email
const TEST_CUSTOMER_EMAIL = process.argv[2] || 'test@example.com';
const TEST_CUSTOMER_NAME = process.argv[3] || 'Test Customer';

async function testCustomerWelcomeEmail() {
  try {
    console.log('🔌 Connecting to database...');
    await connectToDatabase();
    console.log('✅ Database connected\n');

    // Create a test user object
    const testUser = {
      name: TEST_CUSTOMER_NAME,
      email: TEST_CUSTOMER_EMAIL,
      role: 'customer'
    };

    console.log('📧 Testing Customer Welcome Email');
    console.log('─────────────────────────────────────────');
    console.log('   Customer Name:', testUser.name);
    console.log('   Customer Email:', testUser.email);
    console.log('   Role:', testUser.role);
    console.log('─────────────────────────────────────────\n');

    console.log('📧 Sending customer welcome email...\n');

    const result = await sendCustomerWelcomeEmail(testUser);

    console.log('\n─────────────────────────────────────────');
    if (result.success) {
      console.log('✅✅✅ SUCCESS! Customer welcome email sent successfully!');
      console.log('   Message ID:', result.messageId);
      console.log('\n📬 Please check the inbox of:', TEST_CUSTOMER_EMAIL);
      console.log('   (Also check spam/junk folder if not found)');
    } else {
      console.log('❌❌❌ FAILED to send customer welcome email');
      console.log('   Error:', result.error);
      
      if (result.error && (result.error.includes('553') || result.error.includes('relay'))) {
        console.log('\n⚠️  IMPORTANT: Sender email needs to be verified in ZeptoMail!');
        console.log('   1. Go to ZeptoMail dashboard: https://www.zeptomail.com/');
        console.log('   2. Verify the sender email: no-reply@synilogicitsolution.com');
        console.log('   3. Check your email for verification link');
        console.log('   4. Run this test again after verification');
        console.log('\n   See EMAIL_SETUP_INSTRUCTIONS.md for detailed steps');
      }
    }
    console.log('─────────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌❌❌ Error:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

console.log('🚀 Starting Customer Welcome Email Test...\n');
console.log('Usage: node test_customer_welcome_email.js <email> <name>');
console.log('Example: node test_customer_welcome_email.js customer@example.com "John Doe"\n');

testCustomerWelcomeEmail();


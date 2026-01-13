import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectToDatabase } from './src/config/db.js';
import { sendMonthlyRevenueEmails } from './src/utils/monthlyRevenueEmail.js';

async function testMonthlyRevenueEmail() {
  try {
    console.log('🧪 Starting monthly revenue email test...');
    
    // Connect to database
    console.log('📦 Connecting to database...');
    await connectToDatabase();
    console.log('✅ Database connected');
    
    // Test monthly revenue email
    console.log('\n📧 Sending monthly revenue emails...');
    const result = await sendMonthlyRevenueEmails();
    
    if (result.success) {
      console.log('\n✅ Test completed successfully!');
      console.log(`   Vendor emails sent: ${result.vendorEmailsSent || 0}`);
      console.log('   Admin email sent: Yes');
    } else {
      console.log('\n❌ Test failed:', result.error);
    }
    
    // Close database connection
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test error:', error);
    process.exit(1);
  }
}

testMonthlyRevenueEmail();


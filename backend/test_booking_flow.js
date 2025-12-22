/**
 * Test Script: Booking Flow Verification
 * 
 * This script tests the booking flow to ensure:
 * 1. New bookings are created with status: 'pending'
 * 2. adminApproved: false by default
 * 3. Flow works correctly: Customer → Admin → Vendor
 */

import mongoose from 'mongoose';
import Booking from './src/models/Booking.js';
import { connectToDatabase } from './src/config/db.js';

async function testBookingFlow() {
  try {
    console.log('🔌 Connecting to database...');
    await connectToDatabase();
    console.log('✅ Database connected\n');

    // Test 1: Check recent bookings status
    console.log('📊 Test 1: Checking recent bookings status...');
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('status adminApproved paymentStatus createdAt')
      .lean();

    console.log(`Found ${recentBookings.length} recent bookings:\n`);
    
    let confirmedCount = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    let unapprovedCount = 0;

    recentBookings.forEach((booking, index) => {
      const status = booking.status || 'unknown';
      const adminApproved = booking.adminApproved || false;
      const paymentStatus = booking.paymentStatus || 'unknown';
      
      if (status === 'confirmed') confirmedCount++;
      if (status === 'pending') pendingCount++;
      if (adminApproved) approvedCount++;
      if (!adminApproved) unapprovedCount++;

      console.log(`${index + 1}. Status: ${status}, AdminApproved: ${adminApproved}, Payment: ${paymentStatus}`);
    });

    console.log(`\n📈 Summary:`);
    console.log(`   - Confirmed: ${confirmedCount}`);
    console.log(`   - Pending: ${pendingCount}`);
    console.log(`   - Admin Approved: ${approvedCount}`);
    console.log(`   - Admin Unapproved: ${unapprovedCount}\n`);

    // Test 2: Check if any bookings are incorrectly confirmed
    console.log('🔍 Test 2: Checking for incorrectly confirmed bookings...');
    const incorrectlyConfirmed = await Booking.find({
      status: 'confirmed',
      adminApproved: false,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }).countDocuments();

    if (incorrectlyConfirmed > 0) {
      console.log(`⚠️  WARNING: Found ${incorrectlyConfirmed} bookings created in last 24 hours with status 'confirmed' but adminApproved: false`);
      console.log('   These should be fixed to status: "pending"\n');
    } else {
      console.log('✅ No incorrectly confirmed bookings found\n');
    }

    // Test 3: Check booking creation flow
    console.log('✅ Test 3: Booking creation flow check...');
    console.log('   Expected flow:');
    console.log('   1. Customer creates booking → status: "pending", adminApproved: false');
    console.log('   2. Admin approves → adminApproved: true (status remains "pending")');
    console.log('   3. Admin can change status → status: "confirmed" (optional)');
    console.log('   4. Vendor sees only adminApproved: true bookings\n');

    // Test 4: Check microservice callback bookings
    console.log('🔍 Test 4: Checking microservice callback bookings...');
    const callbackBookings = await Booking.find({
      paymentId: { $exists: true, $ne: null },
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })
      .select('status adminApproved paymentId createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    console.log(`Found ${callbackBookings.length} bookings with payment in last 24 hours:\n`);
    callbackBookings.forEach((booking, index) => {
      const isCorrect = booking.status === 'pending' && booking.adminApproved === false;
      const icon = isCorrect ? '✅' : '❌';
      console.log(`${icon} ${index + 1}. Status: ${booking.status}, AdminApproved: ${booking.adminApproved}`);
    });

    console.log('\n✅ Test completed!\n');

    // Recommendations
    console.log('💡 Recommendations:');
    if (confirmedCount > pendingCount) {
      console.log('   - Many bookings are confirmed. Check if admin is manually confirming them.');
    }
    if (unapprovedCount > approvedCount) {
      console.log('   - Many bookings are unapproved. Admin should review and approve them.');
    }
    console.log('   - Ensure backend server is restarted after code changes');
    console.log('   - New bookings should have status: "pending" and adminApproved: false\n');

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run test
testBookingFlow();


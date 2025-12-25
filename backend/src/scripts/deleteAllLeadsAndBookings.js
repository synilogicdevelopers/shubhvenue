import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectToDatabase } from '../config/db.js';
import Booking from '../models/Booking.js';
import Lead from '../models/Lead.js';

// Load environment variables
dotenv.config();

async function deleteAllLeadsAndBookings() {
  try {
    // Connect to database
    await connectToDatabase();
    console.log('✅ Connected to MongoDB\n');

    // Count data before deletion
    const bookings = await Booking.countDocuments({});
    const leads = await Lead.countDocuments({});

    console.log('📊 Current Data Summary:');
    console.log(`   Bookings: ${bookings}`);
    console.log(`   Leads: ${leads}\n`);

    if (bookings === 0 && leads === 0) {
      console.log('ℹ️  No bookings or leads to delete. Database is already empty.');
      process.exit(0);
    }

    console.log('🗑️  Starting deletion process...\n');

    // Delete all bookings
    let bookingResult = { deletedCount: 0 };
    if (bookings > 0) {
      bookingResult = await Booking.deleteMany({});
      console.log(`✅ Deleted ${bookingResult.deletedCount} booking(s)`);
    } else {
      console.log('ℹ️  No bookings to delete');
    }

    // Delete all leads
    let leadResult = { deletedCount: 0 };
    if (leads > 0) {
      leadResult = await Lead.deleteMany({});
      console.log(`✅ Deleted ${leadResult.deletedCount} lead(s)`);
    } else {
      console.log('ℹ️  No leads to delete');
    }

    // Final summary
    const remainingBookings = await Booking.countDocuments({});
    const remainingLeads = await Lead.countDocuments({});

    console.log('\n🎉 Deletion completed!');
    console.log(`\n📊 Remaining Data:`);
    console.log(`   Bookings: ${remainingBookings}`);
    console.log(`   Leads: ${remainingLeads}`);

    if (remainingBookings === 0 && remainingLeads === 0) {
      console.log('\n✅ All bookings and leads have been successfully removed!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting leads and bookings:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
deleteAllLeadsAndBookings();


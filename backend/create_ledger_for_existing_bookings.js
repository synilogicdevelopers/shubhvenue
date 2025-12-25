/**
 * Script to create ledger entries for existing approved bookings
 * This script will create ledger entries for all bookings that:
 * - Are admin approved (adminApproved: true)
 * - Have payment done (paymentStatus: 'paid')
 * - Don't already have a ledger entry
 */

import mongoose from 'mongoose';
import Booking from './src/models/Booking.js';
import Ledger from './src/models/Ledger.js';
import Venue from './src/models/Venue.js';
import { connectToDatabase } from './src/config/db.js';

async function createLedgerForExistingBookings() {
  try {
    console.log('🔌 Connecting to database...');
    await connectToDatabase();
    console.log('✅ Database connected\n');

    // Find all approved bookings with payment done
    const approvedBookings = await Booking.find({
      adminApproved: true,
      paymentStatus: 'paid',
      totalAmount: { $gt: 0 }
    })
      .populate('customerId', 'name email phone')
      .populate('venueId', 'name location')
      .lean();

    console.log(`📊 Found ${approvedBookings.length} approved bookings with payment\n`);

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const booking of approvedBookings) {
      try {
        const venueId = booking.venueId?._id || booking.venueId;
        
        if (!venueId) {
          console.log(`⚠️  Skipping booking ${booking._id} - No venue found`);
          skippedCount++;
          continue;
        }

        // Get venue details to get vendorId
        const venue = await Venue.findById(venueId).populate('vendorId').lean();
        
        if (!venue || !venue.vendorId) {
          console.log(`⚠️  Skipping booking ${booking._id} - No vendor found for venue`);
          skippedCount++;
          continue;
        }

        const vendorId = venue.vendorId._id || venue.vendorId;

        // Check if ledger entry already exists
        const bookingRef = `Booking #${booking._id.toString().slice(-6)}`;
        const existingLedgerEntry = await Ledger.findOne({
          reference: bookingRef,
          vendorId: vendorId,
          venueId: venueId
        });

        if (existingLedgerEntry) {
          console.log(`ℹ️  Ledger entry already exists for booking ${booking._id}`);
          skippedCount++;
          continue;
        }

        // Create ledger entry
        const customerName = booking.name || (booking.customerId?.name) || 'Customer';
        const venueName = venue.name || 'Venue';
        
        const ledgerEntry = new Ledger({
          vendorId: vendorId,
          type: 'income',
          category: 'Booking Payment',
          description: `Booking for ${venueName}`,
          amount: booking.totalAmount || 0,
          date: booking.date || booking.createdAt || new Date(),
          status: booking.paymentStatus === 'paid' ? 'paid' : 'pending',
          reference: bookingRef,
          venueId: venueId,
          notes: `Booking approved for ${customerName} - ${booking.guests || 0} guests`
        });

        await ledgerEntry.save();
        console.log(`✅ Created ledger entry for booking ${booking._id} - Amount: ₹${booking.totalAmount || 0}`);
        createdCount++;

      } catch (error) {
        console.error(`❌ Error processing booking ${booking._id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📈 Summary:');
    console.log(`   ✅ Created: ${createdCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📊 Total: ${approvedBookings.length}\n`);

  } catch (error) {
    console.error('❌ Script error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run script
createLedgerForExistingBookings();









import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectToDatabase } from '../config/db.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Lead from '../models/Lead.js';
import Ledger from '../models/Ledger.js';
import VendorStaff from '../models/VendorStaff.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Helper function to delete image file
const deleteImageFile = (imagePath) => {
  if (!imagePath) return;
  
  try {
    // Handle different upload paths
    let filePath;
    if (imagePath.includes('/uploads/vendor-staff/')) {
      const filename = imagePath.replace('/uploads/vendor-staff/', '');
      if (filename && !filename.includes('http')) {
        filePath = path.join(__dirname, '../../uploads/vendor-staff', filename);
      }
    } else if (imagePath.includes('/uploads/staff/')) {
      const filename = imagePath.replace('/uploads/staff/', '');
      if (filename && !filename.includes('http')) {
        filePath = path.join(__dirname, '../../uploads/staff', filename);
      }
    }
    
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`  ✓ Deleted image: ${path.basename(filePath)}`);
      return true;
    }
  } catch (error) {
    console.error(`  ✗ Error deleting image ${imagePath}:`, error.message);
  }
  return false;
};

async function deleteAllUsersAndVendors(deleteAdmin = false) {
  try {
    // Connect to database
    await connectToDatabase();
    console.log('✅ Connected to MongoDB\n');

    // Count data before deletion
    const totalUsers = await User.countDocuments({});
    const customers = await User.countDocuments({ role: 'customer' });
    const vendors = await User.countDocuments({ role: 'vendor' });
    const affiliates = await User.countDocuments({ role: 'affiliate' });
    const admins = await User.countDocuments({ role: 'admin' });
    const bookings = await Booking.countDocuments({});
    const leads = await Lead.countDocuments({});
    const ledgers = await Ledger.countDocuments({});
    const vendorStaff = await VendorStaff.countDocuments({});

    console.log('📊 Current Data Summary:');
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   - Customers: ${customers}`);
    console.log(`   - Vendors: ${vendors}`);
    console.log(`   - Affiliates: ${affiliates}`);
    console.log(`   - Admins: ${admins}`);
    console.log(`   Bookings: ${bookings}`);
    console.log(`   Leads: ${leads}`);
    console.log(`   Ledgers: ${ledgers}`);
    console.log(`   Vendor Staff: ${vendorStaff}\n`);

    if (totalUsers === 0 && bookings === 0 && leads === 0 && ledgers === 0 && vendorStaff === 0) {
      console.log('ℹ️  No users or related data to delete. Database is already empty.');
      process.exit(0);
    }

    console.log('🗑️  Starting deletion process...\n');

    // Step 1: Delete all bookings
    if (bookings > 0) {
      const bookingResult = await Booking.deleteMany({});
      console.log(`✅ Deleted ${bookingResult.deletedCount} booking(s)`);
    }

    // Step 2: Delete all leads
    if (leads > 0) {
      const leadResult = await Lead.deleteMany({});
      console.log(`✅ Deleted ${leadResult.deletedCount} lead(s)`);
    }

    // Step 3: Delete all ledgers
    if (ledgers > 0) {
      const ledgerResult = await Ledger.deleteMany({});
      console.log(`✅ Deleted ${ledgerResult.deletedCount} ledger entry/entries`);
    }

    // Step 4: Get vendor staff and delete their images, then delete vendor staff
    if (vendorStaff > 0) {
      const allVendorStaff = await VendorStaff.find({});
      let deletedStaffImages = 0;
      
      for (const staff of allVendorStaff) {
        if (staff.img) {
          if (deleteImageFile(staff.img)) {
            deletedStaffImages++;
          }
        }
      }
      
      const vendorStaffResult = await VendorStaff.deleteMany({});
      console.log(`✅ Deleted ${vendorStaffResult.deletedCount} vendor staff member(s)`);
      if (deletedStaffImages > 0) {
        console.log(`   (Deleted ${deletedStaffImages} associated image file(s))`);
      }
    }

    // Step 5: Delete users (customers, vendors, affiliates, and optionally admins)
    let userQuery = {};
    if (!deleteAdmin) {
      userQuery = { role: { $ne: 'admin' } };
      console.log('ℹ️  Keeping admin users (use --delete-admin flag to delete all users including admins)');
    }

    const usersToDelete = await User.find(userQuery);
    const userCount = usersToDelete.length;

    if (userCount > 0) {
      // Count by role
      const customersToDelete = usersToDelete.filter(u => u.role === 'customer').length;
      const vendorsToDelete = usersToDelete.filter(u => u.role === 'vendor').length;
      const affiliatesToDelete = usersToDelete.filter(u => u.role === 'affiliate').length;
      const adminsToDelete = usersToDelete.filter(u => u.role === 'admin').length;

      console.log(`\n📋 Users to be deleted:`);
      if (customersToDelete > 0) console.log(`   - Customers: ${customersToDelete}`);
      if (vendorsToDelete > 0) console.log(`   - Vendors: ${vendorsToDelete}`);
      if (affiliatesToDelete > 0) console.log(`   - Affiliates: ${affiliatesToDelete}`);
      if (adminsToDelete > 0) console.log(`   - Admins: ${adminsToDelete}`);

      const userResult = await User.deleteMany(userQuery);
      console.log(`\n✅ Successfully deleted ${userResult.deletedCount} user(s) from database`);
    } else {
      console.log('ℹ️  No users to delete (all are admins or database is empty)');
    }

    // Final summary
    const remainingUsers = await User.countDocuments({});
    const remainingAdmins = await User.countDocuments({ role: 'admin' });

    console.log('\n🎉 Deletion completed!');
    console.log(`\n📊 Remaining Data:`);
    console.log(`   Total Users: ${remainingUsers}`);
    if (remainingAdmins > 0) {
      console.log(`   - Admins: ${remainingAdmins} (kept)`);
    }
    console.log(`   Bookings: 0`);
    console.log(`   Leads: 0`);
    console.log(`   Ledgers: 0`);
    console.log(`   Vendor Staff: 0`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting users and vendors:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Check command line arguments
const deleteAdmin = process.argv.includes('--delete-admin') || process.argv.includes('-a');

if (deleteAdmin) {
  console.log('⚠️  WARNING: This will delete ALL users including admins!\n');
}

// Run the script
deleteAllUsersAndVendors(deleteAdmin);


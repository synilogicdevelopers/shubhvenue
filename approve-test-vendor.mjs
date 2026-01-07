import axios from 'axios';
import mongoose from 'mongoose';

// Configuration
const BASE_URL = 'http://localhost:8030/api';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wedding-venue';
const VENDOR_EMAIL = 'testvendor@example.com';

async function approveVendorDirectly() {
  try {
    console.log('🔧 Approving test vendor directly via database...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Import User model
    const { default: User } = await import('./backend/src/models/User.js');
    
    // Find and update vendor
    const vendor = await User.findOne({ email: VENDOR_EMAIL, role: 'vendor' });
    
    if (!vendor) {
      console.error('❌ Vendor not found:', VENDOR_EMAIL);
      process.exit(1);
    }
    
    vendor.vendorStatus = 'approved';
    vendor.verified = true;
    await vendor.save();
    
    console.log('✅ Vendor approved successfully!');
    console.log('📥 Vendor details:', {
      id: vendor._id,
      name: vendor.name,
      email: vendor.email,
      vendorStatus: vendor.vendorStatus,
      verified: vendor.verified
    });
    
    await mongoose.disconnect();
    return vendor;
  } catch (error) {
    console.error('❌ Failed to approve vendor:', error.message);
    if (error.message.includes('Cannot find module')) {
      console.error('💡 Tip: Run this script from the project root directory');
    }
    process.exit(1);
  }
}

// Alternative: Use admin API if available
async function approveVendorViaAPI() {
  try {
    console.log('🔧 Attempting to approve vendor via admin API...');
    console.log('⚠️  This requires admin credentials');
    // This would need admin login first
    console.log('💡 Use admin panel or database directly instead');
  } catch (error) {
    console.error('❌ API approval failed:', error.message);
  }
}

// Run
console.log('🚀 Approving test vendor...\n');
approveVendorDirectly();



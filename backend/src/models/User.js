import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String },
    password: { type: String }, // Optional for Google OAuth users
    googleId: { type: String, unique: true, sparse: true }, // Sparse index allows multiple nulls
    fcmToken: { type: String }, // Firebase Cloud Messaging token for push notifications
    role: { type: String, enum: ['customer', 'vendor', 'affiliate', 'admin'], default: 'customer' },
    verified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }, // Soft delete flag
    vendorStatus: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending' 
    }, // Status for vendor approval (only relevant when role is 'vendor')
    vendorCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VendorCategory',
      default: null
    } // Vendor category (only relevant when role is 'vendor')
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);






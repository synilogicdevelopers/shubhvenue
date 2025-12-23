import mongoose from 'mongoose';

const vendorStaffSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true,
      trim: true 
    },
    phone: { 
      type: String, 
      required: true,
      trim: true 
    },
    email: { 
      type: String, 
      required: true, 
      lowercase: true,
      trim: true 
    },
    password: { 
      type: String, 
      required: true 
    },
    location: { 
      type: String,
      trim: true 
    },
    gender: { 
      type: String, 
      enum: ['male', 'female', 'other'],
      trim: true 
    },
    img: { 
      type: String // Image path/URL
    },
    role: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'VendorRole', 
      required: true 
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }, // Which vendor owns this staff member
    isActive: { 
      type: Boolean, 
      default: true 
    },
    isDeleted: { 
      type: Boolean, 
      default: false 
    }
  },
  { timestamps: true }
);

// Index for vendor-specific staff lookup
vendorStaffSchema.index({ vendorId: 1, email: 1 }, { unique: true });

export default mongoose.model('VendorStaff', vendorStaffSchema);


import mongoose from 'mongoose';

const vendorRoleSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    permissions: [{ 
      type: String, 
      required: true 
    }], // Array of permission strings like ["vendor_view_venues", "vendor_create_bookings"]
    description: { 
      type: String,
      trim: true 
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }, // Which vendor owns this role
    isActive: { 
      type: Boolean, 
      default: true 
    }
  },
  { timestamps: true }
);

// Index for vendor-specific role lookup
vendorRoleSchema.index({ vendorId: 1, name: 1 }, { unique: true });

export default mongoose.model('VendorRole', vendorRoleSchema);


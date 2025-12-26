import mongoose from 'mongoose';

const vendorCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    description: {
      type: String,
      trim: true
    },
    image: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    // Form configuration for venue and booking forms
    // Using Mixed type to allow flexible JSON structure
    formConfig: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  { timestamps: true }
);

// Index for active categories
vendorCategorySchema.index({ isActive: 1 });
vendorCategorySchema.index({ name: 1 });

export default mongoose.model('VendorCategory', vendorCategorySchema);


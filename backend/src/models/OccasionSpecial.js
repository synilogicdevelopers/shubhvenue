import mongoose from 'mongoose';

const occasionSpecialSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    description: { 
      type: String,
      trim: true
    },
    image: { 
      type: String,
      required: true
    }, // Menu image URL (required)
    isActive: { 
      type: Boolean, 
      default: true 
    },
    sortOrder: { 
      type: Number, 
      default: 0 
    } // For ordering menus
  },
  { timestamps: true }
);

// Index for efficient queries
occasionSpecialSchema.index({ isActive: 1 });
occasionSpecialSchema.index({ sortOrder: 1 });

export default mongoose.model('OccasionSpecial', occasionSpecialSchema);


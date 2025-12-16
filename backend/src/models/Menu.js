import mongoose from 'mongoose';

const menuSchema = new mongoose.Schema(
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
    icon: { 
      type: String 
    }, // Icon URL or name
    image: { 
      type: String 
    }, // Menu image URL
    parentMenuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Menu',
      default: null // null means it's a main menu, otherwise it's a submenu
    },
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
menuSchema.index({ parentMenuId: 1, isActive: 1 });
menuSchema.index({ sortOrder: 1 });

export default mongoose.model('Menu', menuSchema);





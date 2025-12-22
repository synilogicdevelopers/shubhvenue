import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true 
    },
    permissions: [{ 
      type: String, 
      required: true 
    }], // Array of permission strings like ["view_users", "create_booking", "approve_booking"]
    description: { 
      type: String,
      trim: true 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    }
  },
  { timestamps: true }
);

export default mongoose.model('Role', roleSchema);


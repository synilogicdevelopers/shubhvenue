import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema(
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
      unique: true, 
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
      ref: 'Role', 
      required: true 
    },
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

export default mongoose.model('Staff', staffSchema);


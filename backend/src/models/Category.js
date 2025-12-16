import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    icon: { type: String }, // Icon URL or name
    image: { type: String }, // Category image URL
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 } // For ordering categories
  },
  { timestamps: true }
);

export default mongoose.model('Category', categorySchema);




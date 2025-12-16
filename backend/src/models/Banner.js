import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    image: { type: String, required: true }, // Banner image URL
    link: { type: String }, // Optional link/URL for banner
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }, // For ordering banners
    startDate: { type: Date }, // Optional: when banner should start showing
    endDate: { type: Date }, // Optional: when banner should stop showing
  },
  { timestamps: true }
);

export default mongoose.model('Banner', bannerSchema);








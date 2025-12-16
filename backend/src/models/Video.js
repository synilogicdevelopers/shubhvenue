import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    video: { type: String, required: true }, // Video file path or URL
    thumbnail: { type: String }, // Thumbnail image URL
    link: { type: String }, // Optional external link
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('Video', videoSchema);


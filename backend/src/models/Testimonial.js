import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
    event: { type: String, trim: true }, // e.g., "Booked a Wedding Venue"
    rating: { type: Number, min: 1, max: 5, default: 5 }, // Optional rating
    image: { type: String }, // Optional user image
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }, // For ordering testimonials
  },
  { timestamps: true }
);

export default mongoose.model('Testimonial', testimonialSchema);


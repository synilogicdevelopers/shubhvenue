import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    category: { type: String, trim: true }, // Optional category (e.g., "Booking", "Payment", "Cancellation")
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }, // For ordering FAQs
  },
  { timestamps: true }
);

export default mongoose.model('FAQ', faqSchema);


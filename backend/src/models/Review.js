import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    venueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },
    reply: {
      message: { type: String },
      repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      repliedAt: { type: Date }
    }
  },
  { timestamps: true }
);

export default mongoose.model('Review', reviewSchema);









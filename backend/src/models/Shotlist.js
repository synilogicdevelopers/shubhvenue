import mongoose from 'mongoose';

const shotlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // Can be null for non-logged in users
    },
    deviceId: {
      type: String,
      default: null // For non-logged in users
    },
    venueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure one entry per user/device + venue combination
shotlistSchema.index({ userId: 1, venueId: 1 }, { 
  unique: true, 
  sparse: true, // Sparse allows multiple null values
  partialFilterExpression: { userId: { $ne: null } }
});

shotlistSchema.index({ deviceId: 1, venueId: 1 }, { 
  unique: true, 
  sparse: true, // Sparse allows multiple null values
  partialFilterExpression: { deviceId: { $ne: null } }
});

// Index for faster queries
shotlistSchema.index({ userId: 1 });
shotlistSchema.index({ deviceId: 1 });
shotlistSchema.index({ venueId: 1 });

export default mongoose.model('Shotlist', shotlistSchema);




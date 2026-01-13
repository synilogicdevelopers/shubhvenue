import mongoose from 'mongoose';

const planSchema = new mongoose.Schema(
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
    price: {
      type: Number,
      required: true,
      min: 0
    },
    duration: {
      type: Number,
      required: true,
      min: 1
    },
    durationUnit: {
      type: String,
      enum: ['days', 'weeks', 'months', 'years'],
      default: 'months'
    },
    features: [{
      type: String,
      trim: true
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    maxVenues: {
      type: Number,
      default: 1, // How many venues can be verified with this plan
      min: 1
    },
    priority: {
      type: Number,
      default: 0, // Higher priority = appears higher in listings
      min: 0
    }
  },
  { timestamps: true }
);

// Indexes
planSchema.index({ isActive: 1 });
planSchema.index({ priority: -1 });

export default mongoose.model('Plan', planSchema);





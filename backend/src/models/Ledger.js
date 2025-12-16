import mongoose from 'mongoose';

const ledgerSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['paid', 'pending', 'unpaid', 'cancelled'],
      default: 'paid'
    },
    reference: {
      type: String,
      trim: true
    },
    venueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue'
    },
    notes: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// Index for faster queries
ledgerSchema.index({ vendorId: 1, date: -1 });
ledgerSchema.index({ vendorId: 1, type: 1 });

export default mongoose.model('Ledger', ledgerSchema);


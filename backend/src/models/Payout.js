import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    commission: { type: Number, required: true },
    payment_status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' }
  },
  { timestamps: true }
);

export default mongoose.model('Payout', payoutSchema);









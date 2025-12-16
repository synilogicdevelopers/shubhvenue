import mongoose from 'mongoose';

const paymentConfigSchema = new mongoose.Schema({
  razorpayKeyId: {
    type: String,
    required: true,
    trim: true,
  },
  razorpayKeySecret: {
    type: String,
    required: true,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Ensure only one payment config document exists
paymentConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    // Create default config if none exists
    config = await this.create({
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
      razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
      isActive: true,
    });
  }
  return config;
};

const PaymentConfig = mongoose.model('PaymentConfig', paymentConfigSchema);

export default PaymentConfig;


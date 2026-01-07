import mongoose from 'mongoose';

const paymentConfigSchema = new mongoose.Schema({
  razorpayKeyId: {
    type: String,
    required: false,
    trim: true,
    default: '',
  },
  razorpayKeySecret: {
    type: String,
    required: false,
    trim: true,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Payment method selection
  enableRazorpayDirect: {
    type: Boolean,
    default: false,
  },
  enableMicroservice: {
    type: Boolean,
    default: true, // Default to microservice (current setup)
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


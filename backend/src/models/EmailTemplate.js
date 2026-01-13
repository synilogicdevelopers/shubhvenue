import mongoose from 'mongoose';

const emailTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'customer_welcome',
        'vendor_welcome',
        'vendor_approval',
        'vendor_rejection',
        'vendor_registration_admin',
        'booking_confirmation',
        'booking_cancellation',
        'booking_notification_admin',
        'booking_approval_vendor',
        'vendor_booking_confirmation',
        'lead_notification_admin',
        'review_notification_vendor',
        'review_reply_customer',
        'verification_request_vendor',
        'verification_request_admin',
        'verification_approval_vendor',
        'monthly_revenue_vendor',
        'monthly_revenue_admin',
        'password_reset',
        'test_email',
        'custom'
      ],
    },
    subject: {
      type: String,
      default: '',
      trim: true,
    },
    html: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      default: '',
    },
    variables: [{
      name: { type: String, required: true },
      description: { type: String },
      example: { type: String },
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      default: '',
    },
    logoUrl: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

// Index for faster queries
emailTemplateSchema.index({ type: 1, isActive: 1 });
emailTemplateSchema.index({ name: 1 });

// Get template by type
emailTemplateSchema.statics.getByType = async function(type) {
  return await this.findOne({ type, isActive: true });
};

// Get all active templates
emailTemplateSchema.statics.getActiveTemplates = async function() {
  return await this.find({ isActive: true }).sort({ type: 1, name: 1 });
};

export default mongoose.model('EmailTemplate', emailTemplateSchema);


import mongoose from 'mongoose';

const vendorPlanSubscriptionSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: true
    },
    venueIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue'
    }], // Venues that are verified with this subscription
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['pending_verification', 'active', 'expired', 'cancelled'],
      default: 'pending_verification'
    },
    paymentId: {
      type: String, // Razorpay payment ID or transaction ID
      trim: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    amountPaid: {
      type: Number,
      required: true,
      min: 0
    },
    verificationRequestDetails: {
      businessName: { type: String, trim: true },
      businessAddress: { type: String, trim: true },
      businessPhone: { type: String, trim: true },
      businessEmail: { type: String, trim: true },
      businessRegistrationNumber: { type: String, trim: true },
      gstNumber: { type: String, trim: true },
      panNumber: { type: String, trim: true },
      additionalDetails: { type: String, trim: true },
      submittedAt: { type: Date, default: Date.now }
    },
    adminVerified: {
      type: Boolean,
      default: false
    },
    adminVerifiedAt: {
      type: Date,
      default: null
    },
    adminVerifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    adminRejectionReason: {
      type: String,
      trim: true,
      default: null
    }
  },
  { timestamps: true }
);

// Indexes
vendorPlanSubscriptionSchema.index({ vendorId: 1, status: 1 });
vendorPlanSubscriptionSchema.index({ endDate: 1 });
vendorPlanSubscriptionSchema.index({ status: 1 });
vendorPlanSubscriptionSchema.index({ adminVerified: 1, status: 1 });

// Method to check if subscription is active
vendorPlanSubscriptionSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'active' && 
         this.paymentStatus === 'completed' &&
         this.adminVerified === true &&
         this.startDate <= now && 
         this.endDate >= now;
};

export default mongoose.model('VendorPlanSubscription', vendorPlanSubscriptionSchema);



import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    subject: { type: String, trim: true },
    message: { type: String, required: true, trim: true },
    status: { 
      type: String, 
      enum: ['new', 'read', 'replied', 'resolved'], 
      default: 'new' 
    },
    repliedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    replyMessage: { type: String, trim: true },
    repliedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('Contact', contactSchema);


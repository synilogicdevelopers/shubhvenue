import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    venueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: false }, // Link to booking if converted
    date: { type: Date, required: true },
    dateFrom: { type: Date }, // Marriage start date
    dateTo: { type: Date }, // Marriage end date
    name: { type: String, trim: true, required: true }, // Customer name
    phone: { type: String, trim: true, required: true }, // Customer phone number
    email: { type: String, trim: true }, // Customer email (optional)
    marriageFor: { type: String, enum: ['boy', 'girl'], trim: true, required: true }, // Marriage for boy or girl (required)
    personName: { type: String, trim: true }, // Name of the person (boy or girl) (optional)
    eventType: { type: String, enum: ['wedding', 'party', 'birthday party', 'anniversary', 'engagement', 'reception', 'other'], default: 'wedding', trim: true }, // Event type
    guests: { type: Number, required: true },
    rooms: { type: Number, default: 0 }, // Number of rooms
    foodPreference: { type: String, enum: ['veg', 'non-veg', 'both'], default: 'both' }, // Veg or Non-veg
    totalAmount: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ['new', 'contacted', 'qualified', 'converted', 'lost'], 
      default: 'new' 
    }, // Lead status
    notes: { type: String, trim: true }, // Admin notes
    deviceId: { type: String, trim: true }, // Device ID for tracking
    source: { type: String, default: 'booking' } // Source of lead (booking, inquiry, etc.)
  },
  { timestamps: true }
);

// Index for faster queries
leadSchema.index({ venueId: 1, status: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ status: 1 });

export default mongoose.model('Lead', leadSchema);


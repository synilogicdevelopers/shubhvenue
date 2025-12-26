import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    venueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: false }, // Optional if venueName is provided
    venueName: { type: String, trim: true }, // Manual venue name (used when venueId is not provided)
    date: { type: Date, required: true },
    dateFrom: { type: Date }, // Marriage start date
    dateTo: { type: Date }, // Marriage end date
    name: { type: String, trim: true }, // Customer name
    phone: { type: String, trim: true }, // Customer phone number
    marriageFor: { type: String, enum: ['boy', 'girl'], trim: true }, // Marriage for boy or girl
    personName: { type: String, trim: true }, // Name of the person (boy or girl)
    eventType: { type: String, default: 'wedding', trim: true }, // Event type (can be comma-separated for multiple types or custom values)
    guests: { type: Number, required: true },
    rooms: { type: Number, default: 0 }, // Number of rooms
    foodPreference: { type: String, enum: ['veg', 'non-veg', 'both'], default: 'both' }, // Veg or Non-veg
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'failed'], default: 'pending' },
    paymentId: { type: String, trim: true }, // Payment ID from Razorpay
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    adminApproved: { type: Boolean, default: false }, // Admin approval required before vendor can see
    deviceId: { type: String, trim: true } // Device ID for tracking bookings
  },
  { timestamps: true }
);

export default mongoose.model('Booking', bookingSchema);






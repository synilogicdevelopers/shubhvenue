import mongoose from 'mongoose';

const calendarEventSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    venueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      required: false // Optional - allows events without venues
    },
    date: {
      type: Date,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['task', 'book'],
      default: 'task'
    }
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance
calendarEventSchema.index({ vendorId: 1, venueId: 1, date: 1 });
calendarEventSchema.index({ venueId: 1, date: 1 });

export default mongoose.model('CalendarEvent', calendarEventSchema);


import Venue from '../models/Venue.js';

/**
 * Generate custom booking ID with vendor name (first 3 words) + unique identifier
 * @param {String} venueId - MongoDB ObjectId of the venue
 * @param {String} bookingId - Optional MongoDB ObjectId of the booking (for unique suffix)
 * @returns {Promise<String>} Custom booking ID
 */
export async function generateCustomBookingId(venueId, bookingId = null) {
  try {
    const venue = await Venue.findById(venueId).populate('vendorId', 'name');
    
    if (venue?.vendorId?.name) {
      const vendorName = venue.vendorId.name.trim();
      const words = vendorName.split(/\s+/).slice(0, 3);
      const vendorPrefix = words.join('').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 15);
      const uniqueSuffix = bookingId ? bookingId.toString().slice(-8) : Date.now().toString().slice(-8);
      return `${vendorPrefix}${uniqueSuffix}`;
    } else {
      // Fallback if vendor name not available
      const uniqueSuffix = bookingId ? bookingId.toString().slice(-8) : Date.now().toString().slice(-8);
      return `BOOK${uniqueSuffix}`;
    }
  } catch (error) {
    console.error('Error generating custom booking ID:', error);
    // Fallback
    const uniqueSuffix = bookingId ? bookingId.toString().slice(-8) : Date.now().toString().slice(-8);
    return `BOOK${uniqueSuffix}`;
  }
}


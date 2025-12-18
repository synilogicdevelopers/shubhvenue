import crypto from 'crypto';
import mongoose from 'mongoose';
import PaymentConfig from '../models/PaymentConfig.js';
import Booking from '../models/Booking.js';
import Lead from '../models/Lead.js';

/**
 * Verify HMAC SHA256 signature from microservice.
 */
function verifySignature(rawBody, signature, secret) {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return expected === signature;
}

/**
 * Handle payment callback from Razorpay Central Payments Microservice.
 *
 * The microservice sends:
 * {
 *   transaction_id,
 *   order_id,
 *   payment_id,
 *   status,        // 'paid' | 'failed' | 'refunded' | 'initiated'...
 *   amount,        // in paise
 *   currency,
 *   customer: { name, email, contact },
 *   notes: { ... } // we send booking_data, venue_id, etc.
 * }
 */
export const handleMicroserviceCallback = async (req, res) => {
  try {
    const signature = req.headers['x-microservice-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body || {});

    if (!signature) {
      return res.status(401).json({ error: 'Missing signature header' });
    }

    const config = await PaymentConfig.getConfig();
    const projectSecret = config?.razorpayKeySecret || '';

    if (!projectSecret) {
      return res.status(500).json({ error: 'Microservice secret not configured' });
    }

    if (!verifySignature(rawBody, signature, projectSecret)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const payload = req.body || {};
    const { status, notes = {}, payment_id, order_id } = payload;

    console.log('✅ Valid callback from microservice:', {
      status,
      payment_id,
      order_id,
      notesKeys: Object.keys(notes),
    });

    const bookingData = notes.booking_data || null;

    if (!bookingData) {
      // Nothing to create; just acknowledge
      return res.json({ success: true, message: 'Callback received (no booking data)' });
    }

    // Ensure DB connection
    if (mongoose.connection.readyState !== 1) {
      const { connectToDatabase } = await import('../config/db.js');
      await connectToDatabase();
    }

    // Only create booking on successful payment
    if (status === 'paid') {
      const {
        venueId,
        date,
        dateFrom,
        dateTo,
        name,
        phone,
        marriageFor,
        personName,
        eventType,
        guests,
        rooms,
        foodPreference,
        totalAmount,
        deviceId,
      } = bookingData;

      if (!venueId || !date || !guests || !totalAmount) {
        console.warn('⚠️ Incomplete booking data in callback, skipping booking creation');
        return res.json({
          success: true,
          message: 'Callback received but booking data incomplete',
        });
      }

      const booking = new Booking({
        venueId,
        date: new Date(date),
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
        name,
        phone,
        marriageFor: marriageFor || undefined,
        personName: personName || undefined,
        eventType: eventType || 'wedding',
        guests,
        rooms: rooms || 0,
        foodPreference: foodPreference || 'both',
        totalAmount,
        paymentId: payment_id || null,
        paymentStatus: 'paid',
        status: 'confirmed',
        deviceId: deviceId || undefined,
      });

      await booking.save();

      console.log('🎉 Booking created from callback:', booking._id);

      return res.json({
        success: true,
        message: 'Booking created from callback',
        bookingId: booking._id,
      });
    }

    // For failed / other statuses, just acknowledge
    console.log('ℹ️ Non-paid status from microservice, no booking created:', status);
    return res.json({
      success: true,
      message: `Callback processed with status ${status}`,
    });
  } catch (error) {
    console.error('❌ Error handling microservice callback:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process microservice callback',
      message: error.message || 'Unknown error',
    });
  }
};


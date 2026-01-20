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
    const payload = req.body || {};

    // Check if this is a PayU callback (form data with txnid, status, etc.)
    const isPayUCallback = payload.txnid || payload.status || payload.productinfo;
    
    console.log('📥 Callback Received:', {
      hasSignature: !!signature,
      isPayUCallback,
      payloadKeys: Object.keys(payload),
      contentType: req.headers['content-type'],
    });

    // For PayU callbacks, signature might not be present (form POST)
    // For microservice callbacks, signature is required
    if (!isPayUCallback) {
      if (!signature) {
        console.warn('⚠️ Missing signature header for microservice callback');
        return res.status(401).json({ error: 'Missing signature header' });
      }

      const config = await PaymentConfig.getConfig();
      const projectSecret = config?.razorpayKeySecret || '';

      if (!projectSecret) {
        return res.status(500).json({ error: 'Microservice secret not configured' });
      }

      if (!verifySignature(rawBody, signature, projectSecret)) {
        console.warn('⚠️ Invalid signature for microservice callback');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    } else {
      // PayU callback - verify hash if available
      console.log('📦 PayU Callback Detected:', {
        txnid: payload.txnid,
        status: payload.status,
        amount: payload.amount,
        hasHash: !!payload.hash,
      });
      
      // PayU hash verification can be done here if needed
      // For now, we'll trust the callback if it has required PayU fields
    }

    // Extract status and payment info - handle both microservice and PayU formats
    let status = payload.status;
    let notes = payload.notes || {};
    let payment_id = payload.payment_id || payload.pgTxnId || payload.payuid;
    let order_id = payload.order_id || payload.txnid;
    let transaction_id = payload.transaction_id || payload.txnid;
    let txnid = payload.txnid;

    // For PayU callbacks, extract booking data from udf fields
    if (isPayUCallback) {
      // PayU sends booking data in udf1-udf5 fields
      // Try to extract from udf fields (JSON string)
      const udfData = payload.udf1 || payload.udf2 || payload.udf3 || payload.udf4 || payload.udf5;
      if (udfData) {
        try {
          const parsedUdf = JSON.parse(udfData);
          if (parsedUdf.venueId || parsedUdf.venue_id) {
            notes.booking_data = parsedUdf;
            console.log('📦 Extracted booking data from PayU UDF fields');
          }
        } catch (e) {
          console.log('⚠️ Could not parse UDF data as JSON:', e.message);
        }
      }
      
      // PayU status mapping
      if (payload.status === 'success' || payload.status === 'SUCCESS') {
        status = 'paid';
      } else if (payload.status === 'failure' || payload.status === 'FAILURE') {
        status = 'failed';
      }
    }

    console.log('✅ Valid callback from microservice:', {
      status,
      payment_id,
      order_id,
      transaction_id,
      txnid,
      notesKeys: Object.keys(notes),
      fullPayload: JSON.stringify(payload).substring(0, 1000), // Log full payload for debugging
    });

    // Try multiple possible locations for booking data
    let bookingData = null;
    if (notes && typeof notes === 'object') {
      // Standard format: notes.booking_data
      bookingData = notes.booking_data || notes.bookingData || null;
      
      // Also check if booking data is directly in notes (for PayU)
      if (!bookingData && (notes.venueId || notes.venue_id || notes.name || notes.phone)) {
        // Booking data might be directly in notes object
        bookingData = notes;
        console.log('📦 Using notes directly as booking data (PayU format)');
      }
    }

    // Also check payload level for booking data (some gateways send it here)
    if (!bookingData && (payload.venueId || payload.venue_id)) {
      bookingData = payload;
      console.log('📦 Using payload directly as booking data');
    }

    // If booking data still not found, try to retrieve from cache using order_id or transaction_id
    if (!bookingData && (order_id || txnid || transaction_id)) {
      const { orderBookingDataCache } = await import('../controllers/payment.controller.js');
      
      // Try multiple keys - order_id, txnid, transaction_id
      let cachedData = null;
      let cacheKey = null;
      
      if (order_id) {
        cachedData = orderBookingDataCache?.get(order_id);
        if (cachedData) cacheKey = order_id;
      }
      
      if (!cachedData && txnid) {
        cachedData = orderBookingDataCache?.get(txnid);
        if (cachedData) cacheKey = txnid;
      }
      
      if (!cachedData && transaction_id) {
        cachedData = orderBookingDataCache?.get(String(transaction_id));
        if (cachedData) cacheKey = String(transaction_id);
      }
      
      if (cachedData && cachedData.bookingData) {
        bookingData = cachedData.bookingData;
        console.log('📦 Retrieved booking data from cache using key:', {
          cacheKey: cacheKey?.substring(0, 10) + '...',
          hasVenueId: !!bookingData.venueId,
          hasDate: !!bookingData.date,
        });
        // Clean up cache after retrieval
        if (cacheKey) {
          orderBookingDataCache?.delete(cacheKey);
        }
      } else {
        console.log('⚠️ Booking data not found in cache for:', {
          order_id,
          txnid,
          transaction_id,
          cacheSize: orderBookingDataCache?.size || 0,
          cacheKeys: Array.from(orderBookingDataCache?.keys() || []).slice(0, 5),
        });
      }
    }

    console.log('📦 Booking Data Extracted:', {
      hasBookingData: !!bookingData,
      bookingDataKeys: bookingData ? Object.keys(bookingData) : [],
      venueId: bookingData?.venueId || bookingData?.venue_id,
      hasDate: !!bookingData?.date || !!bookingData?.dateFrom,
    });

    if (!bookingData) {
      // Log detailed info for debugging
      console.warn('⚠️ No booking data found in callback:', {
        payloadKeys: Object.keys(payload),
        notesType: typeof notes,
        notesKeys: notes ? Object.keys(notes) : [],
      });
      // Nothing to create; just acknowledge
      return res.json({ success: true, message: 'Callback received (no booking data)' });
    }

    // Ensure DB connection
    if (mongoose.connection.readyState !== 1) {
      const { connectToDatabase } = await import('../config/db.js');
      await connectToDatabase();
    }

    // Only create booking on successful payment
    if (status === 'paid' || status === 'success') {
      // Handle different field name formats (venueId vs venue_id, etc.)
      const venueId = bookingData.venueId || bookingData.venue_id;
      const date = bookingData.date || bookingData.dateFrom;
      const dateFrom = bookingData.dateFrom || bookingData.date_from;
      const dateTo = bookingData.dateTo || bookingData.date_to;
      const name = bookingData.name || bookingData.fullName || bookingData.firstname;
      const phone = bookingData.phone || bookingData.contact;
      const marriageFor = bookingData.marriageFor || bookingData.marriage_for;
      const personName = bookingData.personName || bookingData.person_name;
      const eventType = bookingData.eventType || bookingData.event_type || 'wedding';
      const guests = bookingData.guests || bookingData.numberOfGuests;
      const rooms = bookingData.rooms || 0;
      const foodPreference = bookingData.foodPreference || bookingData.food_preference || 'both';
      const totalAmount = bookingData.totalAmount || bookingData.total_amount || bookingData.amount;
      const deviceId = bookingData.deviceId || bookingData.device_id;
      const email = bookingData.email || notes?.customer?.email || null;

      console.log('📋 Extracted Booking Fields:', {
        venueId,
        date,
        dateFrom,
        name,
        phone,
        email,
        guests,
        totalAmount,
        hasAllRequired: !!(venueId && date && guests && totalAmount),
      });

      if (!venueId || !date || !guests || !totalAmount) {
        console.warn('⚠️ Incomplete booking data in callback, skipping booking creation:', {
          missing: {
            venueId: !venueId,
            date: !date,
            guests: !guests,
            totalAmount: !totalAmount,
          },
          bookingDataKeys: Object.keys(bookingData),
        });
        return res.json({
          success: true,
          message: 'Callback received but booking data incomplete',
          details: {
            missing: {
              venueId: !venueId,
              date: !date,
              guests: !guests,
              totalAmount: !totalAmount,
            }
          }
        });
      }

      const booking = new Booking({
        venueId,
        date: new Date(date),
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
        name: name || 'Guest',
        phone: phone || '',
        email: email || undefined, // Add email if available
        marriageFor: marriageFor || undefined,
        personName: personName || undefined,
        eventType: eventType || 'wedding',
        guests: Number(guests),
        rooms: rooms ? Number(rooms) : 0,
        foodPreference: foodPreference || 'both',
        totalAmount: Number(totalAmount),
        paymentId: payment_id || transaction_id || txnid || null,
        paymentStatus: 'paid',
        status: 'pending', // Booking starts as pending, admin needs to approve
        adminApproved: false, // Admin needs to approve before vendor can see
        deviceId: deviceId || undefined,
      });

      await booking.save();

      // Generate custom booking ID
      try {
        const { generateCustomBookingId } = await import('../utils/bookingIdGenerator.js');
        booking.customBookingId = await generateCustomBookingId(venueId, booking._id);
        await booking.save();
      } catch (idError) {
        console.error('Error generating custom booking ID:', idError);
        // Continue without custom ID
      }

      console.log('🎉 Booking created from callback:', {
        bookingId: booking._id,
        customBookingId: booking.customBookingId,
        venueId,
        date,
        name,
        totalAmount,
      });

      // Send email notifications (non-blocking)
      try {
        const { sendBookingConfirmationEmail, sendBookingNotificationToAdmin } = await import('../utils/emailService.js');
        
        // Populate booking for email
        await booking.populate('customerId', 'name email phone');
        await booking.populate('venueId', 'name location price capacity images coverImage image');
        
        // Get customer email from notes or booking
        const customerEmail = notes.customer?.email || booking.customerId?.email || booking.email || null;
        if (customerEmail) {
          sendBookingConfirmationEmail(booking, customerEmail).catch(err => 
            console.error('Error sending booking confirmation email to customer:', err)
          );
        }
        
        // Send notification to admin
        sendBookingNotificationToAdmin(booking).catch(err => 
          console.error('Error sending booking notification to admin:', err)
        );
      } catch (emailError) {
        console.error('Error setting up email notifications:', emailError);
        // Don't fail the callback if email fails
      }

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


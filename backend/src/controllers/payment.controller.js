import crypto from 'crypto';
import mongoose from 'mongoose';
import PaymentConfig from '../models/PaymentConfig.js';
import Booking from '../models/Booking.js';
import Venue from '../models/Venue.js';
import Lead from '../models/Lead.js';
import { callMicroservice } from '../utils/microserviceClient.js';
import { generateCustomBookingId } from '../utils/bookingIdGenerator.js';

// Create Payment Order
export const createPaymentOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', bookingId, bookingData } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount is required and must be greater than 0' });
    }

    // Check date availability BEFORE creating payment order if bookingData is provided
    if (bookingData && bookingData.venueId) {
      const Booking = (await import('../models/Booking.js')).default;
      const Venue = (await import('../models/Venue.js')).default;
      const venueId = bookingData.venueId;

      // If venueId is not a valid ObjectId (e.g. local demo uses numeric IDs like 1),
      // skip the DB-based venue/availability checks to avoid CastError.
      if (!mongoose.Types.ObjectId.isValid(String(venueId))) {
        console.warn('⚠️ Skipping venue availability check due to non-ObjectId venueId:', venueId);
      } else {
        // Check if venue exists
        const venue = await Venue.findById(venueId);
        if (!venue) {
          return res.status(404).json({ error: 'Venue not found' });
        }

        // Parse dates
        const bookingDate = bookingData.date ? new Date(bookingData.date) : new Date(bookingData.dateFrom || bookingData.date);
        const parsedDateFrom = bookingData.dateFrom ? new Date(bookingData.dateFrom) : null;
        const parsedDateTo = bookingData.dateTo ? new Date(bookingData.dateTo) : null;

        // Normalize dates
        const startOfDay = new Date(bookingDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(bookingDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Use dateFrom and dateTo if provided, otherwise use bookingDate
        const checkStart = parsedDateFrom ? new Date(parsedDateFrom) : startOfDay;
        checkStart.setHours(0, 0, 0, 0);
        const checkEnd = parsedDateTo ? new Date(parsedDateTo) : endOfDay;
        checkEnd.setHours(23, 59, 59, 999);

        // Check for existing bookings - check ALL pending/confirmed bookings
        const existingBooking = await Booking.findOne({
          venueId: venueId,
          $or: [
            // Single date booking - check if booking date falls within requested range
            {
              date: {
                $gte: checkStart,
                $lte: checkEnd
              }
            },
            // Date range booking - check if booking range overlaps with requested range
            {
              dateFrom: { $lte: checkEnd },
              dateTo: { $gte: checkStart }
            }
          ],
          status: { $in: ['pending', 'confirmed'] } // Check all pending and confirmed bookings
        });

        if (existingBooking) {
          return res.status(409).json({ 
            error: 'Venue is already booked for the selected dates. Please choose different dates.',
            conflictingBooking: existingBooking._id
          });
        }

        // Check blocked dates
        const bookingDateStr = bookingDate.toISOString().split('T')[0];
        const blockedDates = (venue.blockedDates || []).map(d => 
          new Date(d).toISOString().split('T')[0]
        );
        
        if (blockedDates.includes(bookingDateStr)) {
          return res.status(409).json({ 
            error: 'This date is blocked and not available for booking',
            blockedDate: bookingDateStr
          });
        }

        // Check if date range overlaps with blocked dates
        if (parsedDateFrom && parsedDateTo) {
          const dateFromStr = parsedDateFrom.toISOString().split('T')[0];
          const dateToStr = parsedDateTo.toISOString().split('T')[0];
          
          const hasBlockedDate = blockedDates.some(blockedDate => {
            return blockedDate >= dateFromStr && blockedDate <= dateToStr;
          });
          
          if (hasBlockedDate) {
            return res.status(409).json({ 
              error: 'Some dates in the selected range are blocked and not available for booking',
              dateFrom: dateFromStr,
              dateTo: dateToStr
            });
          }
        }
      }
    }

    // Minimum amount (in paise)
    const MIN_AMOUNT_PAISE = 100; // ₹1 (minimum 1 rupee)

    if (amount < MIN_AMOUNT_PAISE) {
      return res.status(400).json({ 
        error: 'Amount too low',
        message: `Minimum amount is ₹${MIN_AMOUNT_PAISE / 100}. You entered ₹${amount / 100}`
      });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await connectToDatabase();
      } catch (dbError) {
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    // At this point, dates are valid and available.
    // Check which payment method is enabled
    const config = await PaymentConfig.getConfig();
    
    // Debug: Log current configuration
    console.log('📋 Payment Config:', {
      enableRazorpayDirect: config.enableRazorpayDirect,
      enableMicroservice: config.enableMicroservice,
      hasKeyId: !!config.razorpayKeyId,
      hasSecret: !!config.razorpayKeySecret,
    });
    
    // Determine which payment method to use
    const useMicroservice = config.enableMicroservice === true || 
                           (config.enableMicroservice !== false && config.enableRazorpayDirect !== true);
    const useRazorpayDirect = config.enableRazorpayDirect === true && config.enableMicroservice === false;
    
    console.log('🎯 Selected Payment Method:', useRazorpayDirect ? 'Razorpay Direct' : 'Microservice');

    if (useRazorpayDirect) {
      // Direct Razorpay Integration
      console.log('📦 Creating Razorpay direct payment order...');
      console.log('   Amount (paise):', amount);
      console.log('   Currency:', currency);

      if (!config.razorpayKeyId || !config.razorpayKeySecret) {
        return res.status(400).json({
          error: 'Razorpay configuration error',
          message: 'Razorpay Key ID and Secret are required for direct Razorpay integration. Please configure in admin settings.',
        });
      }

      // Create Razorpay order using Razorpay API
      const axios = (await import('axios')).default;
      const razorpayAuth = Buffer.from(`${config.razorpayKeyId}:${config.razorpayKeySecret}`).toString('base64');

      const razorpayOrderData = {
        amount: Math.round(Number(amount)), // amount in paise
        currency: currency,
        receipt: `receipt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        notes: {
          source: 'Shubhvenue',
          venue_id: bookingData?.venueId || null,
          booking_id: bookingId || null,
        }
      };

      try {
        const razorpayResponse = await axios.post(
          'https://api.razorpay.com/v1/orders',
          razorpayOrderData,
          {
            headers: {
              'Authorization': `Basic ${razorpayAuth}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const razorpayOrder = razorpayResponse.data;

        return res.json({
          success: true,
          paymentMethod: 'razorpay_direct',
          order: {
            id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
          },
          razorpayKeyId: config.razorpayKeyId, // Frontend needs this for Razorpay checkout
        });
      } catch (razorpayError) {
        console.error('Razorpay order creation error:', razorpayError.response?.data || razorpayError.message);
        return res.status(500).json({
          error: 'Failed to create Razorpay order',
          message: razorpayError.response?.data?.error?.description || razorpayError.message || 'Failed to create payment order',
        });
      }
    } else {
      // Microservice Integration (default)
      console.log('📦 Creating microservice payment order...');
      console.log('   Amount (paise):', amount);
      console.log('   Currency:', currency);
      console.log('   Booking ID:', bookingId);
      
      // Build customer + notes payload for microservice
      const customer = {
        name: bookingData?.name || bookingData?.fullName || 'Guest User',
        email: bookingData?.email || 'no-email@example.com',
        contact: bookingData?.phone || '',
      };

      const notes = {
        source: 'Shubhvenue',
        venue_id: bookingData?.venueId || null,
        booking_id: bookingId || null,
        booking_data: bookingData || null,
      };

      const payload = {
        amount: Math.round(Number(amount)), // already in paise
        currency,
        customer,
        notes,
      };

      let orderData;
      try {
        const microserviceResponse = await callMicroservice('/api/payment/order', 'POST', payload);
        orderData = microserviceResponse?.data || {};

        if (!orderData.order_id || !orderData.key_id) {
          return res.status(500).json({
            error: 'Payment configuration error',
            message: 'Microservice did not return a valid order. Please contact support.',
          });
        }
      } catch (microserviceError) {
        console.error('❌ Microservice call error:', {
          message: microserviceError.message,
          stack: microserviceError.stack,
        });
        
        // Check for specific error messages
        if (microserviceError.message && (
          microserviceError.message.includes('Invalid Project') ||
          microserviceError.message.includes('Invalid project') ||
          microserviceError.message.includes('invalid project')
        )) {
          return res.status(400).json({
            error: 'Invalid Project Configuration',
            message: microserviceError.message || 'Microservice project code or secret is incorrect. Please verify in admin settings → Payment Configuration.',
          });
        }
        
        if (microserviceError.message && microserviceError.message.includes('Missing Authentication')) {
          return res.status(400).json({
            error: 'Missing Authentication',
            message: microserviceError.message || 'Microservice requires Project Code and Secret. Please configure them in admin settings → Payment Configuration.',
          });
        }
        
        if (microserviceError.message && microserviceError.message.includes('requires authentication')) {
          return res.status(400).json({
            error: 'Authentication Required',
            message: microserviceError.message,
          });
        }
        
        if (microserviceError.message && microserviceError.message.includes('not configured')) {
          return res.status(400).json({
            error: 'Microservice Not Configured',
            message: 'Please set MICROSERVICE_API_URL in backend .env file. Example: MICROSERVICE_API_URL=https://payments.synilogic.in',
          });
        }
        
        // Return detailed error for debugging
        return res.status(500).json({
          error: 'Microservice Error',
          message: microserviceError.message || 'Failed to create payment order via microservice',
          hint: 'Please check: 1) MICROSERVICE_API_URL is set in backend .env file, 2) Microservice server is running and accessible, 3) Backend server is restarted after .env changes',
        });
      }
      
      // Return order in the same shape the frontend expects
      return res.json({
        success: true,
        paymentMethod: 'microservice',
        order: {
          id: orderData.order_id,
          amount: orderData.amount,
          currency: orderData.currency,
        },
      });
    }
  } catch (error) {
    console.error('Create payment order error (microservice):', error);
    const message = error.message || 'Failed to create payment order via microservice';
    return res.status(500).json({
      error: 'Failed to create payment order',
      message,
    });
  }
};

// Verify Payment and Create Booking
export const verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      bookingData // Booking details from frontend
    } = req.body;

    // Validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        error: 'Payment verification data is required' 
      });
    }

    if (!bookingData) {
      return res.status(400).json({ 
        error: 'Booking data is required' 
      });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await connectToDatabase();
      } catch (dbError) {
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    // Get Razorpay config for signature verification
    const config = await PaymentConfig.getConfig();
    
    if (!config.razorpayKeyId || !config.razorpayKeySecret) {
      return res.status(400).json({ 
        error: 'Payment gateway not configured',
        message: 'Please configure Razorpay keys in admin panel'
      });
    }

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', config.razorpayKeySecret)
      .update(text)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ 
        error: 'Payment verification failed',
        message: 'Invalid payment signature'
      });
    }

    // Payment verified successfully - Create booking
    const userId = req.user?.userId;
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
      deviceId 
    } = bookingData;

    // Validation
    if (!venueId || !date || !guests || !totalAmount) {
      return res.status(400).json({ error: 'Venue ID, date, guests, and total amount are required' });
    }

    if (!userId && (!name || !phone)) {
      return res.status(400).json({ error: 'Name and phone are required when not logged in' });
    }

    if (guests <= 0) {
      return res.status(400).json({ error: 'Number of guests must be greater than 0' });
    }

    if (totalAmount <= 0) {
      return res.status(400).json({ error: 'Total amount must be greater than 0' });
    }

    // Validate food preference
    const validFoodPreferences = ['veg', 'non-veg', 'both'];
    const foodPref = foodPreference || 'both';
    if (!validFoodPreferences.includes(foodPref)) {
      return res.status(400).json({ error: 'Food preference must be one of: veg, non-veg, both' });
    }

    // Validate marriageFor
    if (marriageFor && !['boy', 'girl'].includes(marriageFor)) {
      return res.status(400).json({ error: 'marriageFor must be either "boy" or "girl"' });
    }

    // Validate venueId format - must be a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(String(venueId))) {
      return res.status(400).json({ 
        error: 'Invalid venue ID format',
        message: 'Venue ID must be a valid MongoDB ObjectId. Please refresh the page and try again.'
      });
    }

    // Parse date
    let bookingDate;
    if (typeof date === 'string') {
      const dateParts = date.split('-');
      if (dateParts.length === 3) {
        bookingDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      } else {
        bookingDate = new Date(date);
      }
    } else {
      bookingDate = new Date(date);
    }
    
    if (isNaN(bookingDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    bookingDate.setHours(0, 0, 0, 0);
    
    // Parse dateFrom and dateTo if provided
    let parsedDateFrom = null;
    let parsedDateTo = null;
    
    if (dateFrom) {
      if (typeof dateFrom === 'string') {
        const dateParts = dateFrom.split('-');
        if (dateParts.length === 3) {
          parsedDateFrom = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        } else {
          parsedDateFrom = new Date(dateFrom);
        }
      } else {
        parsedDateFrom = new Date(dateFrom);
      }
      if (isNaN(parsedDateFrom.getTime())) {
        return res.status(400).json({ error: 'Invalid dateFrom format' });
      }
      parsedDateFrom.setHours(0, 0, 0, 0);
    }
    
    if (dateTo) {
      if (typeof dateTo === 'string') {
        const dateParts = dateTo.split('-');
        if (dateParts.length === 3) {
          parsedDateTo = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        } else {
          parsedDateTo = new Date(dateTo);
        }
      } else {
        parsedDateTo = new Date(dateTo);
      }
      if (isNaN(parsedDateTo.getTime())) {
        return res.status(400).json({ error: 'Invalid dateTo format' });
      }
      parsedDateTo.setHours(23, 59, 59, 999);
    }
    
    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookingDate < today) {
      return res.status(400).json({ error: 'Booking date cannot be in the past' });
    }

    // Check if venue exists and is approved
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    if (venue.status !== 'approved') {
      return res.status(400).json({ error: 'Venue is not available for booking' });
    }

    // Capacity checks removed - allow booking even if guests/rooms exceed venue capacity
    // let maxCapacity = 0;
    // let minCapacity = 1;
    
    // if (typeof venue.capacity === 'number') {
    //   maxCapacity = venue.capacity;
    // } else if (venue.capacity && typeof venue.capacity === 'object') {
    //   maxCapacity = venue.capacity.maxGuests || venue.capacity;
    //   minCapacity = venue.capacity.minGuests || 1;
    // } else {
    //   maxCapacity = venue.capacity || 0;
    // }
    
    // if (guests < minCapacity) {
    //   return res.status(400).json({ 
    //     error: `Minimum ${minCapacity} guests required. You selected ${guests} guests.` 
    //   });
    // }
    
    // if (guests > maxCapacity) {
    //   return res.status(400).json({ 
    //     error: `Number of guests (${guests}) exceeds venue capacity (max: ${maxCapacity})` 
    //   });
    // }

    // Check if date is blocked by vendor
    const bookingDateStr = bookingDate.toISOString().split('T')[0];
    const blockedDates = (venue.blockedDates || []).map(d => 
      new Date(d).toISOString().split('T')[0]
    );
    
    // Check if booking date is in blocked dates
    if (blockedDates.includes(bookingDateStr)) {
      return res.status(409).json({ 
        error: 'This date is blocked and not available for booking',
        blockedDate: bookingDateStr
      });
    }

    // Check if date range overlaps with blocked dates
    if (parsedDateFrom && parsedDateTo) {
      const dateFromStr = parsedDateFrom.toISOString().split('T')[0];
      const dateToStr = parsedDateTo.toISOString().split('T')[0];
      
      const hasBlockedDate = blockedDates.some(blockedDate => {
        return blockedDate >= dateFromStr && blockedDate <= dateToStr;
      });
      
      if (hasBlockedDate) {
        return res.status(409).json({ 
          error: 'Some dates in the selected range are blocked and not available for booking',
          dateFrom: dateFromStr,
          dateTo: dateToStr
        });
      }
    }

    // Check availability - check for date range overlap
    const startOfDay = new Date(bookingDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Use dateFrom and dateTo if provided, otherwise use bookingDate
    const checkStart = parsedDateFrom ? new Date(parsedDateFrom) : startOfDay;
    checkStart.setHours(0, 0, 0, 0);
    const checkEnd = parsedDateTo ? new Date(parsedDateTo) : endOfDay;
    checkEnd.setHours(23, 59, 59, 999);

    // Check for date range overlap - check ALL pending/confirmed bookings (not just adminApproved)
    const existingBooking = await Booking.findOne({
      venueId,
      $or: [
        // Single date booking - check if booking date falls within requested range
        {
          date: {
            $gte: checkStart,
            $lte: checkEnd
          }
        },
        // Date range booking - check if booking range overlaps with requested range
        {
          dateFrom: { $lte: checkEnd },
          dateTo: { $gte: checkStart }
        }
      ],
      status: { $in: ['pending', 'confirmed'] }
      // Don't check adminApproved - check ALL pending/confirmed bookings to prevent double booking
    });

    if (existingBooking) {
      return res.status(409).json({ 
        error: 'Venue is already booked for this date',
        conflictingBooking: existingBooking._id
      });
    }

    // Create Booking with payment
    const booking = new Booking({
      customerId: userId || null,
      venueId,
      date: bookingDate,
      dateFrom: parsedDateFrom || null,
      dateTo: parsedDateTo || null,
      name: name || null,
      phone: phone || null,
      marriageFor: marriageFor || null,
      personName: personName || null,
      eventType: eventType || 'wedding',
      guests: Number(guests),
      rooms: rooms ? Number(rooms) : 0,
      foodPreference: foodPref,
      totalAmount: Number(totalAmount),
      status: 'pending',
      paymentId: razorpay_payment_id,
      paymentStatus: 'paid',
      adminApproved: false,
      deviceId: deviceId || null
    });

    await booking.save();
    
    // Generate and set custom booking ID with vendor name
    try {
      booking.customBookingId = await generateCustomBookingId(venueId, booking._id);
      await booking.save();
    } catch (idError) {
      console.error('Error setting custom booking ID:', idError);
      // If uniqueness constraint fails, try with timestamp
      try {
        booking.customBookingId = await generateCustomBookingId(venueId, null);
        await booking.save();
      } catch (retryError) {
        console.error('Error retrying custom booking ID:', retryError);
        // Continue without custom ID if it fails
      }
    }
    
    // Also create Lead for admin tracking
    const lead = new Lead({
      customerId: userId || null,
      venueId,
      bookingId: booking._id,
      date: bookingDate,
      dateFrom: parsedDateFrom || null,
      dateTo: parsedDateTo || null,
      name: name || null,
      phone: phone || null,
      email: bookingData.email || null,
      marriageFor: marriageFor || null,
      personName: personName || null,
      eventType: eventType || 'wedding',
      guests: Number(guests),
      rooms: rooms ? Number(rooms) : 0,
      foodPreference: foodPref,
      totalAmount: Number(totalAmount),
      status: 'qualified',
      deviceId: deviceId || null,
      source: 'booking'
    });
    
    await lead.save();
    
    await booking.populate('customerId', 'name email phone');
    await booking.populate('venueId', 'name location price capacity');

    res.json({
      success: true,
      message: 'Payment verified and booking created successfully. Waiting for admin approval.',
      payment: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        verified: true,
      },
      booking: booking.toObject()
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid venue ID' });
    }
    res.status(500).json({ 
      error: 'Payment verification failed',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify Payment for Lead and Convert to Booking (Public - for app)
export const verifyPaymentForLead = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      leadId
    } = req.body;

    // Validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        error: 'Payment verification data is required' 
      });
    }

    if (!leadId) {
      return res.status(400).json({ 
        error: 'Lead ID is required' 
      });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await connectToDatabase();
      } catch (dbError) {
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    // Get Razorpay config for signature verification
    const config = await PaymentConfig.getConfig();
    
    if (!config.razorpayKeyId || !config.razorpayKeySecret) {
      return res.status(400).json({ 
        error: 'Payment gateway not configured',
        message: 'Please configure Razorpay keys in admin panel'
      });
    }

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', config.razorpayKeySecret)
      .update(text)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ 
        error: 'Payment verification failed',
        message: 'Invalid payment signature'
      });
    }

    // Payment verified successfully - Find lead and convert to booking
    const lead = await Lead.findById(leadId)
      .populate('venueId', 'name location price capacity status');
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    // Check if lead already has a booking
    if (lead.bookingId) {
      return res.status(400).json({ 
        error: 'This lead already has a booking associated with it' 
      });
    }
    
    // Check if venue exists and is approved
    const venue = lead.venueId;
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }
    
    if (venue.status !== 'approved') {
      return res.status(400).json({ error: 'Venue is not available for booking' });
    }
    
    // Check availability
    const startOfDay = new Date(lead.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(lead.date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const existingBooking = await Booking.findOne({
      venueId: lead.venueId._id,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $in: ['pending', 'confirmed'] },
      adminApproved: true
    });
    
    if (existingBooking) {
      return res.status(409).json({ 
        error: 'Venue is already booked for this date',
        conflictingBooking: existingBooking._id
      });
    }
    
    // Create Booking from Lead with payment
    const booking = new Booking({
      customerId: lead.customerId || null,
      venueId: lead.venueId._id,
      date: lead.date,
      dateFrom: lead.dateFrom || null,
      dateTo: lead.dateTo || null,
      name: lead.name || null,
      phone: lead.phone || null,
      marriageFor: lead.marriageFor || null,
      personName: lead.personName || null,
      eventType: lead.eventType || 'wedding',
      guests: lead.guests,
      rooms: lead.rooms || 0,
      foodPreference: lead.foodPreference || 'both',
      totalAmount: lead.totalAmount,
      status: 'pending',
      paymentId: razorpay_payment_id,
      paymentStatus: 'paid',
      adminApproved: false,
      deviceId: lead.deviceId || null
    });
    
    await booking.save();
    
    // Generate and set custom booking ID with vendor name
    try {
      booking.customBookingId = await generateCustomBookingId(lead.venueId._id, booking._id);
      await booking.save();
    } catch (idError) {
      console.error('Error setting custom booking ID:', idError);
      try {
        booking.customBookingId = await generateCustomBookingId(lead.venueId._id, null);
        await booking.save();
      } catch (retryError) {
        console.error('Error retrying custom booking ID:', retryError);
      }
    }
    
    // Update lead to link it with the booking
    lead.bookingId = booking._id;
    lead.status = 'qualified';
    lead.source = 'booking';
    await lead.save();
    
    // Populate booking for response
    await booking.populate('customerId', 'name email phone');
    await booking.populate('venueId', 'name location price capacity');
    
    res.json({
      success: true,
      message: 'Payment verified and lead converted to booking successfully. Waiting for admin approval.',
      payment: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        verified: true,
      },
      booking: booking.toObject()
    });
  } catch (error) {
    console.error('Verify payment for lead error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid lead ID' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ 
      error: 'Payment verification failed',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get Payment Configuration (Public - for app to get Razorpay key)
export const getPaymentConfig = async (req, res) => {
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await connectToDatabase();
      } catch (dbError) {
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    const config = await PaymentConfig.getConfig();
    
    // Only return key ID (not secret) for frontend
    res.json({
      success: true,
      razorpayKeyId: config.razorpayKeyId || '',
      isActive: config.isActive,
    });
  } catch (error) {
    console.error('Get payment config error:', error);
    res.status(500).json({ error: 'Failed to get payment configuration' });
  }
};


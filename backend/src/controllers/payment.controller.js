import Razorpay from 'razorpay';
import crypto from 'crypto';
import mongoose from 'mongoose';
import PaymentConfig from '../models/PaymentConfig.js';
import Booking from '../models/Booking.js';
import Venue from '../models/Venue.js';
import Lead from '../models/Lead.js';

// Get Razorpay instance with config from database
const getRazorpayInstance = async () => {
  try {
    const config = await PaymentConfig.getConfig();
    
    console.log('🔑 Getting Razorpay instance...');
    console.log('   Config exists:', !!config);
    console.log('   Key ID present:', !!config?.razorpayKeyId);
    console.log('   Key Secret present:', !!config?.razorpayKeySecret);
    console.log('   Key ID length:', config?.razorpayKeyId?.length || 0);
    console.log('   Key Secret length:', config?.razorpayKeySecret?.length || 0);
    console.log('   Key ID starts with rzp_:', config?.razorpayKeyId?.startsWith('rzp_'));
    
    // Check if keys are configured and not empty
    if (!config.razorpayKeyId || !config.razorpayKeySecret || 
        config.razorpayKeyId.trim() === '' || config.razorpayKeySecret.trim() === '' ||
        config.razorpayKeyId === 'YOUR_RAZORPAY_KEY_ID' || config.razorpayKeySecret === 'YOUR_RAZORPAY_KEY_SECRET') {
      console.error('❌ Razorpay keys not configured properly');
      throw new Error('Razorpay keys not configured. Please configure in admin panel.');
    }

    // Validate key format (Razorpay key IDs start with 'rzp_' for live and 'rzp_test_' for test)
    if (!config.razorpayKeyId.startsWith('rzp_')) {
      console.error('❌ Invalid Razorpay Key ID format');
      throw new Error('Invalid Razorpay Key ID format. Key ID should start with "rzp_"');
    }

    const razorpayInstance = new Razorpay({
      key_id: config.razorpayKeyId.trim(),
      key_secret: config.razorpayKeySecret.trim(),
    });
    
    console.log('✅ Razorpay instance created successfully');
    return razorpayInstance;
  } catch (error) {
    console.error('❌ Error getting Razorpay instance:', error);
    console.error('Config check:', {
      hasKeyId: !!config?.razorpayKeyId,
      hasKeySecret: !!config?.razorpayKeySecret,
      keyIdLength: config?.razorpayKeyId?.length || 0,
      keySecretLength: config?.razorpayKeySecret?.length || 0,
      keyIdPrefix: config?.razorpayKeyId?.substring(0, 10) || 'N/A'
    });
    throw error;
  }
};

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
      
      // Check if venue exists
      const venue = await Venue.findById(bookingData.venueId);
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
        venueId: bookingData.venueId,
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

    // Razorpay amount limits (in paise)
    // Test mode: Max ₹1,00,000 (10,000,000 paise)
    // Live mode: Max ₹10,00,000 (100,000,000 paise) - can be higher based on account
    const MAX_AMOUNT_PAISE = 100000000; // ₹10,00,000 (100 million paise)
    const MIN_AMOUNT_PAISE = 100; // ₹1 (minimum 1 rupee)

    if (amount < MIN_AMOUNT_PAISE) {
      return res.status(400).json({ 
        error: 'Amount too low',
        message: `Minimum amount is ₹${MIN_AMOUNT_PAISE / 100}. You entered ₹${amount / 100}`
      });
    }

    if (amount > MAX_AMOUNT_PAISE) {
      return res.status(400).json({ 
        error: 'Amount exceeds maximum limit',
        message: `Maximum amount allowed is ₹${MAX_AMOUNT_PAISE / 100}. Your amount is ₹${amount / 100}. Please contact support for larger payments.`
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

    // Get Razorpay instance
    console.log('📦 Creating payment order...');
    console.log('   Amount:', amount, 'paise');
    console.log('   Currency:', currency);
    console.log('   Booking ID:', bookingId);
    
    const razorpay = await getRazorpayInstance();

    // Create order
    const options = {
      amount: amount, // Amount in paise
      currency: currency,
      receipt: `booking_${bookingId || Date.now()}`,
      notes: {
        bookingId: bookingId || 'pending',
      },
    };

    console.log('📤 Calling Razorpay API to create order...');
    console.log('   Order options:', {
      amount: options.amount,
      currency: options.currency,
      receipt: options.receipt
    });
    
    try {
      const order = await razorpay.orders.create(options);
      console.log('✅ Razorpay order created successfully:', order.id);

      res.json({
        success: true,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
          status: order.status,
        },
      });
    } catch (razorpayError) {
      console.error('❌ Razorpay API call failed:', razorpayError);
      throw razorpayError; // Re-throw to be caught by outer catch block
    }
  } catch (error) {
    console.error('Create payment order error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      response: error.response?.data || error.response,
      error: error.error,
      statusCode: error.statusCode,
      code: error.code,
      description: error.description,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
    });
    
    // Check for Razorpay keys not configured error
    if (error.message && error.message.includes('Razorpay keys not configured')) {
      return res.status(400).json({ 
        error: 'Payment gateway not configured',
        message: 'Please configure Razorpay keys in admin panel'
      });
    }
    
    // Check for invalid key format error
    if (error.message && error.message.includes('Invalid Razorpay Key ID format')) {
      return res.status(400).json({ 
        error: 'Invalid Razorpay Key ID format',
        message: error.message
      });
    }
    
    // Check if it's a Razorpay API error (Razorpay SDK format)
    if (error.error) {
      const razorpayError = error.error;
      const errorCode = razorpayError.code;
      const errorDescription = razorpayError.description || razorpayError.message || razorpayError.reason || 'Failed to create payment order';
      
      // Handle authentication errors specifically
      if (errorCode === 'BAD_REQUEST_ERROR' && errorDescription.includes('Authentication failed')) {
        return res.status(401).json({ 
          error: 'Razorpay Authentication Failed',
          message: 'Invalid Razorpay keys. Please verify your Key ID and Key Secret in admin panel.',
          code: errorCode,
          hint: 'Make sure you are using the correct Key ID and Key Secret from your Razorpay dashboard. Test keys and Live keys cannot be mixed.'
        });
      }
      
      return res.status(400).json({ 
        error: 'Razorpay API error',
        message: errorDescription,
        code: errorCode,
        details: process.env.NODE_ENV === 'development' ? razorpayError : undefined
      });
    }
    
    // Check if it's an HTTP error response
    if (error.response && error.response.data) {
      const responseData = error.response.data;
      return res.status(error.response.status || 400).json({ 
        error: 'Razorpay API error',
        message: responseData.error?.description || responseData.error?.message || responseData.message || 'Failed to create payment order',
        details: process.env.NODE_ENV === 'development' ? responseData : undefined
      });
    }
    
    // Generic error handling
    const errorMessage = error.message || error.description || error.reason || 'Unknown error occurred';
    res.status(500).json({ 
      error: 'Failed to create payment order',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        name: error.name,
        code: error.code,
        statusCode: error.statusCode,
        stack: error.stack
      } : undefined
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


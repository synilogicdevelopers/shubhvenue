import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Venue from '../models/Venue.js';
import Lead from '../models/Lead.js';
import Ledger from '../models/Ledger.js';

// Get bookings - role-aware
// Customers: see their own bookings
// Vendors: see bookings for their venues
// Admins: see all bookings
export const getBookings = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

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

    let filter = {};

    // Optional query parameters
    const { status, venueId, dateFrom, dateTo, deviceId } = req.query;

    // Role-based filtering
    if (userRole === 'customer') {
      // Customers see only their own bookings (regardless of adminApproved status)
      // Customers should see their bookings whether approved or not
      // Check both customerId (if logged in when booking created) and deviceId (if not logged in)
      const deviceIdFromQuery = deviceId || (req.headers['x-device-id']); // Also check header
      if (deviceIdFromQuery) {
        // Use $or to match either customerId OR deviceId
        filter.$or = [
          { customerId: userId },
          { deviceId: deviceIdFromQuery }
        ];
      } else {
        // If no deviceId provided, just filter by customerId
        filter.customerId = userId;
      }
      // Don't filter by adminApproved for customers - they see all their bookings
    } else if (userRole === 'vendor') {
      // Vendors see ONLY admin-approved bookings for their venues
      // Vendors cannot see pending/unapproved bookings - those are visible only to admin
      filter.adminApproved = true; // Only show admin-approved bookings to vendors
      const vendorVenues = await Venue.find({ vendorId: userId }).select('_id');
      const venueIds = vendorVenues.map(v => v._id);
      filter.venueId = { $in: venueIds };
      // Note: vendors only see bookings that admin has approved
    } else if (userRole === 'admin') {
      // Admins see all bookings (no filter)
    } else if (!userId && deviceId) {
      // If no user logged in but deviceId provided, show bookings for that device
      // Customers using deviceId should see all their bookings (approved or not)
      filter.deviceId = deviceId;
      // Don't filter by adminApproved for deviceId - customers see all their bookings
    } else if (!userId) {
      // If no user and no deviceId, return empty array for security
      return res.json({
        success: true,
        count: 0,
        bookings: [],
        message: 'Please login or provide deviceId to view bookings'
      });
    } else {
      // Other roles (affiliate, etc.) see only their own bookings
      filter.customerId = userId;
      // Don't filter by adminApproved for other customer roles
    }

    // Apply status filter (vendors see all approved bookings regardless of status)
    if (status && userRole !== 'vendor') {
      filter.status = status;
    }

    if (venueId) {
      filter.venueId = venueId;
    }

    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    const bookings = await Booking.find(filter)
      .populate('customerId', 'name email phone')
      .populate('venueId', 'name location price capacity rooms images coverImage image')
      .sort({ createdAt: -1 });

    // Convert Mongoose documents to plain objects
    const bookingsData = bookings.map(booking => booking.toObject ? booking.toObject() : booking);

    // Also fetch leads for customers (their own leads)
    // But exclude leads that have a bookingId (those are already represented by bookings)
    let leadsData = [];
    if (userRole === 'customer' || (!userId && deviceId)) {
      // Customers can see their own leads
      const leadFilter = {};
      if (userRole === 'customer' && userId) {
        // Check both customerId and deviceId for logged-in customers
        const deviceIdFromQuery = deviceId || (req.headers['x-device-id']);
        if (deviceIdFromQuery) {
          leadFilter.$or = [
            { customerId: userId },
            { deviceId: deviceIdFromQuery }
          ];
        } else {
          leadFilter.customerId = userId;
        }
      } else if (deviceId) {
        leadFilter.deviceId = deviceId;
      }
      
      // Exclude leads that have a bookingId (to avoid duplicates)
      leadFilter.bookingId = null;
      
      // Apply same filters as bookings
      if (venueId) {
        leadFilter.venueId = venueId;
      }
      if (dateFrom || dateTo) {
        leadFilter.date = {};
        if (dateFrom) leadFilter.date.$gte = new Date(dateFrom);
        if (dateTo) leadFilter.date.$lte = new Date(dateTo);
      }
      
      const leads = await Lead.find(leadFilter)
        .populate('customerId', 'name email phone')
        .populate('venueId', 'name location price capacity rooms images coverImage image')
        .sort({ createdAt: -1 });
      
      leadsData = leads.map(lead => {
        const leadObj = lead.toObject ? lead.toObject() : lead;
        // Format lead as booking-like object for frontend compatibility
        return {
          ...leadObj,
          _id: leadObj._id,
          type: 'lead', // Mark as lead
          bookingId: leadObj.bookingId,
          status: leadObj.status,
          paymentStatus: 'pending', // Leads don't have payment
          adminApproved: false, // Leads are not approved
        };
      });
    }

    // Get booking IDs to filter out any leads that might have bookingId
    const bookingIds = new Set(bookingsData.map(b => b._id.toString()));
    
    // Filter out leads that have a corresponding booking
    const filteredLeadsData = leadsData.filter(lead => {
      // If lead has bookingId and that booking exists in our bookings list, exclude it
      if (lead.bookingId) {
        const bookingIdStr = lead.bookingId.toString ? lead.bookingId.toString() : lead.bookingId;
        return !bookingIds.has(bookingIdStr);
      }
      return true; // Keep leads without bookingId
    });

    // Combine bookings and leads, sort by createdAt
    const allItems = [...bookingsData, ...filteredLeadsData].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt);
      const dateB = new Date(b.createdAt || b.updatedAt);
      return dateB - dateA; // Newest first
    });
    
    // Final deduplication by _id to ensure no duplicates
    const seenIds = new Set();
    const uniqueItems = allItems.filter(item => {
      const id = item._id.toString();
      if (seenIds.has(id)) {
        return false;
      }
      seenIds.add(id);
      return true;
    });

    res.json({
      success: true,
      count: uniqueItems.length,
      bookings: uniqueItems,
      bookingsCount: bookingsData.length,
      leadsCount: filteredLeadsData.length
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    
    // Handle MongoDB errors
    if (error.name === 'MongoServerError' || error.name === 'MongoTimeoutError') {
      return res.status(503).json({ 
        error: 'Database error',
        hint: 'Unable to connect to database. Please try again later.'
      });
    }
    
    // Handle timeout errors
    if (error.message && error.message.includes('timed out')) {
      return res.status(504).json({ 
        error: 'Request timeout',
        hint: 'The database query took too long. Please try again.'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single booking by ID (public - no auth required)
// Also checks Lead collection since frontend may pass lead IDs
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId; // Optional
    const userRole = req.user?.role; // Optional

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

    // First try to find in Booking collection
    let booking = await Booking.findById(id)
      .populate('customerId', 'name email phone')
      .populate('venueId', 'name location price capacity amenities images coverImage image');

    // If not found in Booking, check Lead collection
    if (!booking) {
      const lead = await Lead.findById(id)
        .populate('customerId', 'name email phone')
        .populate('venueId', 'name location price capacity amenities images coverImage image');
      
      if (lead) {
        // Convert lead to booking-like format for frontend compatibility
        const leadObj = lead.toObject ? lead.toObject() : lead;
        booking = {
          ...leadObj,
          type: 'lead', // Mark as lead
          paymentStatus: 'pending', // Leads don't have payment
          adminApproved: false, // Leads are not approved
        };
      }
    }

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Permission check (only if user is logged in)
    if (userId && userRole) {
      if (userRole === 'customer') {
        const customerId = booking.customerId?._id?.toString() || booking.customerId?.toString();
        if (customerId && customerId !== userId) {
          return res.status(403).json({ error: 'Access denied' });
        }
      } else if (userRole === 'vendor') {
        const venueId = booking.venueId?._id || booking.venueId;
        if (venueId) {
          const venue = await Venue.findById(venueId);
          if (!venue || venue.vendorId.toString() !== userId) {
            return res.status(403).json({ error: 'Access denied' });
          }
        }
      }
      // Admins can see all bookings
    }
    // If no user logged in, allow access (public booking)

    res.json({
      success: true,
      booking: booking.toObject ? booking.toObject() : booking
    });
  } catch (error) {
    console.error('Get booking by ID error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create booking (public - no login required)
// If paymentId is provided → creates Booking (goes to admin for approval)
// If no paymentId → creates Lead only (admin can see, vendor cannot)
export const createBooking = async (req, res) => {
  try {
    const userId = req.user?.userId; // Optional - can be null if no user logged in
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
      paymentId, // Payment ID - if provided, creates Booking; if not, creates Lead only
      deviceId 
    } = req.body;

    // Validation
    if (!venueId || !date || !guests || !totalAmount) {
      return res.status(400).json({ error: 'Venue ID, date, guests, and total amount are required' });
    }

    // Validate required fields: marriageFor
    if (!marriageFor) {
      return res.status(400).json({ error: 'Marriage For (boy/girl) is required' });
    }

    // Validate required customer info if no user logged in
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
    if (!['boy', 'girl'].includes(marriageFor)) {
      return res.status(400).json({ error: 'marriageFor must be either "boy" or "girl"' });
    }

    // Validate eventType
    const validEventTypes = ['wedding', 'party', 'birthday party', 'anniversary', 'engagement', 'reception', 'other'];
    const eventTypeValue = eventType || 'wedding';
    if (!validEventTypes.includes(eventTypeValue)) {
      return res.status(400).json({ error: `eventType must be one of: ${validEventTypes.join(', ')}` });
    }

    // Parse date string (YYYY-MM-DD format)
    let bookingDate;
    if (typeof date === 'string') {
      // Parse date string and set to start of day in local timezone
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

    // Set to start of day for comparison
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
    
    // Get today's date at start of day for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if date is in the past (compare only dates, not times)
    if (bookingDate < today) {
      return res.status(400).json({ error: 'Booking date cannot be in the past' });
    }
    
    // Validate date range if both provided
    if (parsedDateFrom && parsedDateTo && parsedDateFrom > parsedDateTo) {
      return res.status(400).json({ error: 'dateFrom cannot be after dateTo' });
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

    // Check if venue exists and is approved
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    if (venue.status !== 'approved') {
      return res.status(400).json({ error: 'Venue is not available for booking' });
    }

    // Check capacity - handle both number and object format
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

    // Check availability - see if there's already a confirmed or admin-approved booking for this date
    const startOfDay = new Date(bookingDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    // If paymentId is NOT provided → create Lead only (no Booking)
    if (!paymentId) {
      // Create Lead only - this goes to admin, vendor cannot see
      const lead = new Lead({
        customerId: userId || null,
        venueId,
        bookingId: null, // No booking yet
        date: bookingDate,
        dateFrom: parsedDateFrom || null,
        dateTo: parsedDateTo || null,
        name: name || null,
        phone: phone || null,
        email: req.body.email || null,
        marriageFor: marriageFor,
        personName: personName || null,
        eventType: eventTypeValue,
        guests: Number(guests),
        rooms: rooms ? Number(rooms) : 0,
        foodPreference: foodPref,
        totalAmount: Number(totalAmount),
        status: 'new', // New lead
        deviceId: deviceId || null,
        source: 'inquiry' // Source is inquiry when no payment
      });
      
      await lead.save();
      
      // Populate venue for response
      await lead.populate('venueId', 'name location price capacity images coverImage image');

      return res.status(201).json({
        success: true,
        message: 'Inquiry submitted successfully. Please complete payment to confirm booking.',
        type: 'lead', // Indicates this is a lead, not a booking
        lead: lead.toObject()
      });
    }

    // If paymentId is provided → create Booking (goes to admin for approval)
    // Check if there's already a booking for this date (check all bookings, not just approved ones)
    // This prevents double booking on the same date
    // Check for date range overlap as well (not just single date)
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
      status: { $in: ['pending', 'confirmed'] } // Check all pending and confirmed bookings (not just adminApproved)
    });

    if (existingBooking) {
      return res.status(409).json({ 
        error: 'Venue is already booked for this date. Please select a different date.',
        conflictingBooking: existingBooking._id
      });
    }

    // Create Booking with payment (admin approval required)
    const booking = new Booking({
      customerId: userId || null,
      venueId,
      date: bookingDate,
      dateFrom: parsedDateFrom || null,
      dateTo: parsedDateTo || null,
      name: name || null,
      phone: phone || null,
      marriageFor: marriageFor,
      personName: personName || null,
      eventType: eventTypeValue,
      guests: Number(guests),
      rooms: rooms ? Number(rooms) : 0,
      foodPreference: foodPref,
      totalAmount: Number(totalAmount),
      status: 'pending',
      paymentId: paymentId,
      paymentStatus: 'paid', // Payment is done
      adminApproved: false, // Admin needs to approve before vendor can see
      deviceId: deviceId || null
    });

    await booking.save();
    
    // Also create Lead for admin tracking
    const lead = new Lead({
      customerId: userId || null,
      venueId,
      bookingId: booking._id, // Link to booking
      date: bookingDate,
      dateFrom: parsedDateFrom || null,
      dateTo: parsedDateTo || null,
      name: name || null,
      phone: phone || null,
      email: req.body.email || null,
      marriageFor: marriageFor,
      personName: personName || null,
      eventType: eventTypeValue,
      guests: Number(guests),
      rooms: rooms ? Number(rooms) : 0,
      foodPreference: foodPref,
      totalAmount: Number(totalAmount),
      status: 'qualified', // Qualified lead (payment done)
      deviceId: deviceId || null,
      source: 'booking' // Source is booking when payment done
    });
    
    await lead.save();
    
    await booking.populate('customerId', 'name email phone');
    await booking.populate('venueId', 'name location price capacity images coverImage image');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully. Waiting for admin approval.',
      type: 'booking',
      booking: booking.toObject()
    });
  } catch (error) {
    console.error('Create booking error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid venue ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Convert Lead to Booking with Payment (Public - for app)
export const convertLeadToBookingWithPayment = async (req, res) => {
  try {
    const { leadId, paymentId } = req.body; // paymentId from Razorpay after payment
    
    if (!leadId) {
      return res.status(400).json({ error: 'Lead ID is required' });
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
    
    // Find the lead
    const lead = await Lead.findById(leadId)
      .populate('venueId', 'name location price capacity status images coverImage image');
    
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
    
    // Check availability - check all bookings for this date to prevent double booking
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
      status: { $in: ['pending', 'confirmed'] } // Check all pending and confirmed bookings
    });
    
    if (existingBooking) {
      return res.status(409).json({ 
        error: 'Venue is already booked for this date',
        conflictingBooking: existingBooking._id
      });
    }
    
    // Create Booking from Lead
    const booking = new Booking({
      customerId: lead.customerId || null,
      venueId: lead.venueId._id,
      date: lead.date,
      dateFrom: lead.dateFrom || null,
      dateTo: lead.dateTo || null,
      name: lead.name || null,
      phone: lead.phone || null,
      marriageFor: lead.marriageFor,
      personName: lead.personName || null,
      eventType: lead.eventType || 'wedding',
      guests: lead.guests,
      foodPreference: lead.foodPreference || 'both',
      totalAmount: lead.totalAmount,
      status: 'pending',
      paymentId: paymentId || null,
      paymentStatus: paymentId ? 'paid' : 'pending',
      adminApproved: false,
      deviceId: lead.deviceId || null
    });
    
    await booking.save();
    
    // Update lead to link it with the booking
    lead.bookingId = booking._id;
    lead.status = 'qualified';
    if (paymentId) {
      lead.source = 'booking';
    }
    await lead.save();
    
    // Populate booking for response
    await booking.populate('customerId', 'name email phone');
    await booking.populate('venueId', 'name location price capacity images coverImage image');
    
    res.json({
      success: true,
      message: paymentId 
        ? 'Lead converted to booking successfully with payment. Waiting for admin approval.'
        : 'Lead converted to booking successfully. Payment pending.',
      booking: booking.toObject()
    });
  } catch (error) {
    console.error('Convert lead to booking error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid lead ID' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get booking count by device_id (public - no auth required)
export const getBookingCountByDeviceId = async (req, res) => {
  try {
    const { deviceId } = req.params;

    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID is required' });
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

    // Count bookings by device_id
    const bookingCount = await Booking.countDocuments({ deviceId: deviceId });

    res.json({
      success: true,
      deviceId: deviceId,
      bookingCount: bookingCount
    });
  } catch (error) {
    console.error('Get booking count by device ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update booking status
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Validation
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'failed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Status must be one of: ${validStatuses.join(', ')}` 
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

    const booking = await Booking.findById(id)
      .populate('venueId', 'vendorId');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Permission check
    if (userRole === 'customer') {
      // Customers can only cancel their own bookings
      if (booking.customerId.toString() !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      if (status !== 'cancelled') {
        return res.status(403).json({ error: 'Customers can only cancel bookings' });
      }
    } else if (userRole === 'vendor') {
      // Vendors can confirm/cancel bookings for their venues
      const venue = await Venue.findById(booking.venueId._id);
      if (!venue || venue.vendorId.toString() !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      if (!['confirmed', 'cancelled'].includes(status)) {
        return res.status(403).json({ error: 'Vendors can only confirm or cancel bookings' });
      }
    }
    // Admins can update to any status

    // Update booking status
    booking.status = status;
    await booking.save();
    
    // Update corresponding Lead status when booking is confirmed
    if (status === 'confirmed') {
      await Lead.findOneAndUpdate(
        { bookingId: booking._id },
        { status: 'converted' }, // Mark lead as converted when booking is confirmed
        { new: true }
      );

      // Create ledger entry for confirmed booking
      try {
        // Get venue details to get vendorId
        const venueId = booking.venueId._id || booking.venueId;
        const venue = await Venue.findById(venueId).populate('vendorId');
        
        if (venue && venue.vendorId) {
          const vendorId = venue.vendorId._id || venue.vendorId;
          
          // Check if ledger entry already exists for this booking
          // Use booking ID in reference to avoid duplicates
          const bookingRef = `Booking #${booking._id.toString().slice(-6)}`;
          const existingLedgerEntry = await Ledger.findOne({
            reference: bookingRef,
            vendorId: vendorId,
            venueId: venueId
          });

          // Only create if it doesn't exist
          if (!existingLedgerEntry) {
            const customerName = booking.name || (booking.customerId?.name) || 'Customer';
            const venueName = venue.name || 'Venue';
            
            const ledgerEntry = new Ledger({
              vendorId: vendorId,
              type: 'income',
              category: 'Booking Payment',
              description: `Booking for ${venueName}`,
              amount: booking.totalAmount || 0,
              date: booking.date || new Date(),
              status: booking.paymentStatus === 'paid' ? 'paid' : 'pending',
              reference: bookingRef,
              venueId: venueId,
              notes: `Booking confirmed for ${customerName} - ${booking.guests || 0} guests`
            });

            await ledgerEntry.save();
            console.log(`Ledger entry created for booking ${booking._id} - Amount: ₹${booking.totalAmount || 0}`);
          } else {
            console.log(`Ledger entry already exists for booking ${booking._id}`);
          }
        }
      } catch (ledgerError) {
        // Log error but don't fail the booking status update
        console.error('Error creating ledger entry for booking:', ledgerError);
      }
    } else if (status === 'cancelled' || status === 'failed') {
      await Lead.findOneAndUpdate(
        { bookingId: booking._id },
        { status: 'lost' }, // Mark lead as lost when booking is cancelled/failed
        { new: true }
      );
    }

    await booking.populate('customerId', 'name email phone');
    await booking.populate('venueId', 'name location price capacity images coverImage image');

    res.json({
      success: true,
      message: `Booking ${status} successfully`,
      booking: booking.toObject()
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};


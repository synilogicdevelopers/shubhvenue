import mongoose from 'mongoose';
import Venue from '../models/Venue.js';
import Booking from '../models/Booking.js';
import Payout from '../models/Payout.js';
import Ledger from '../models/Ledger.js';

// Get vendor dashboard stats
export const getVendorDashboard = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (userRole !== 'vendor' || !userId) {
      return res.status(403).json({ error: 'Access denied. Vendor access required.' });
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

    // Get month and year from query params (default to current month)
    const { month, year } = req.query;
    const now = new Date();
    const selectedMonth = month ? parseInt(month) - 1 : now.getMonth(); // month is 0-indexed
    const selectedYear = year ? parseInt(year) : now.getFullYear();
    
    // Calculate date range for selected month
    const startOfMonth = new Date(selectedYear, selectedMonth, 1);
    const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);

    // Get vendor venues
    const vendorVenues = await Venue.find({ vendorId: userId }).select('_id');
    const venueIds = vendorVenues.map(v => v._id.toString());

    // Get total venues count (not filtered by month)
    const totalVenues = vendorVenues.length;

    // Get all bookings for vendor venues (only admin-approved bookings)
    const allBookings = await Booking.find({
      venueId: { $in: venueIds },
      adminApproved: true
    });

    // Filter bookings for selected month
    const bookings = allBookings.filter(booking => {
      const bookingDate = new Date(booking.createdAt || booking.updatedAt);
      return bookingDate >= startOfMonth && bookingDate <= endOfMonth;
    });

    const totalBookings = allBookings.length; // Total across all time
    const monthlyBookingsCount = bookings.length; // For selected month

    // Calculate monthly revenue (selected month)
    const monthlyBookings = bookings.filter(booking => booking.status === 'confirmed');
    
    const monthlyRevenue = monthlyBookings.reduce((sum, booking) => {
      return sum + (booking.totalAmount || 0);
    }, 0);

    // Calculate total commission paid (from payouts)
    const payouts = await Payout.find({ 
      vendorId: userId,
      payment_status: 'paid'
    });
    
    const commissionPaid = payouts.reduce((sum, payout) => {
      return sum + (payout.commission || 0);
    }, 0);

    // Calculate total booked dates (unique dates) - for selected month
    const bookedDatesSet = new Set();
    bookings.forEach(booking => {
      if (booking.date) {
        const dateStr = new Date(booking.date).toISOString().split('T')[0];
        bookedDatesSet.add(dateStr);
      }
      if (booking.dateFrom && booking.dateTo) {
        const startDate = new Date(booking.dateFrom);
        const endDate = new Date(booking.dateTo);
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dateStr = currentDate.toISOString().split('T')[0];
          bookedDatesSet.add(dateStr);
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    });
    const totalBookedDates = bookedDatesSet.size;

    // Payment statistics - Only include CONFIRMED bookings
    const confirmedBookingsForPayments = bookings.filter(b => b.status === 'confirmed');
    const paidBookings = confirmedBookingsForPayments.filter(b => b.paymentStatus === 'paid');
    const pendingBookings = confirmedBookingsForPayments.filter(b => b.paymentStatus === 'pending');
    const failedBookings = confirmedBookingsForPayments.filter(b => b.paymentStatus === 'failed');

    const totalIncomingPayments = confirmedBookingsForPayments.reduce((sum, booking) => {
      return sum + (booking.totalAmount || 0);
    }, 0);

    const paidPayments = paidBookings.reduce((sum, booking) => {
      return sum + (booking.totalAmount || 0);
    }, 0);

    const pendingPayments = pendingBookings.reduce((sum, booking) => {
      return sum + (booking.totalAmount || 0);
    }, 0);

    // Booking status breakdown
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
    const pendingStatusBookings = bookings.filter(b => b.status === 'pending').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

    // Recent bookings (last 7 days) - within selected month
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.createdAt || booking.updatedAt);
      return bookingDate >= sevenDaysAgo && bookingDate <= endOfMonth;
    }).length;

    res.json({
      success: true,
      totalVenues,
      totalBookings, // Total across all time
      monthlyBookings: monthlyBookingsCount, // For selected month
      monthlyRevenue,
      commissionPaid,
      totalBookedDates,
      selectedMonth: {
        month: selectedMonth + 1, // Return 1-indexed month
        year: selectedYear,
        monthName: new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long' })
      },
      paymentStats: {
        totalIncoming: totalIncomingPayments,
        paid: paidPayments,
        pending: pendingPayments,
        failed: failedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)
      },
      bookingStats: {
        confirmed: confirmedBookings,
        pending: pendingStatusBookings,
        cancelled: cancelledBookings,
        recent: recentBookings
      },
      paymentBreakdown: {
        paid: paidBookings.length,
        pending: pendingBookings.length,
        failed: failedBookings.length
      }
    });
  } catch (error) {
    console.error('Get vendor dashboard error:', error);
    
    if (error.name === 'MongoServerError' || error.name === 'MongoTimeoutError') {
      return res.status(503).json({ 
        error: 'Database error',
        hint: 'Unable to connect to database. Please try again later.'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get vendor bookings
export const getVendorBookings = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (userRole !== 'vendor' || !userId) {
      return res.status(403).json({ error: 'Access denied. Vendor access required.' });
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

    // Get vendor venues
    const vendorVenues = await Venue.find({ vendorId: userId }).select('_id');
    const venueIds = vendorVenues.map(v => v._id);

    // Get bookings for vendor venues (only admin-approved bookings)
    const bookings = await Booking.find({
      venueId: { $in: venueIds },
      adminApproved: true
    })
      .populate('customerId', 'name email phone')
      .populate('venueId', 'name location price capacity images')
      .sort({ createdAt: -1 });

    // Format bookings
    const bookingsData = bookings.map(booking => {
      const bookingObj = booking.toObject ? booking.toObject() : booking;
      return {
        ...bookingObj,
        id: bookingObj._id?.toString() || bookingObj.id,
        eventDate: bookingObj.date || bookingObj.eventDate || bookingObj.createdAt,
        guests: bookingObj.guests || bookingObj.capacity || 0,
        totalAmount: bookingObj.totalAmount || bookingObj.amount || 0,
        status: bookingObj.status || 'pending',
        venue: bookingObj.venueId,
        customer: bookingObj.customerId
      };
    });

    res.json({
      success: true,
      count: bookingsData.length,
      bookings: bookingsData
    });
  } catch (error) {
    console.error('Get vendor bookings error:', error);
    
    if (error.name === 'MongoServerError' || error.name === 'MongoTimeoutError') {
      return res.status(503).json({ 
        error: 'Database error',
        hint: 'Unable to connect to database. Please try again later.'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get blocked dates and booked dates for vendor venues
export const getBlockedDates = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const { venueId } = req.query;

    if (userRole !== 'vendor' || !userId) {
      return res.status(403).json({ error: 'Access denied. Vendor access required.' });
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

    // Get vendor venues
    let filter = { vendorId: userId };
    if (venueId) {
      filter._id = venueId;
    }

    const venues = await Venue.find(filter).select('_id name blockedDates');
    
    // Get all bookings for these venues to show booked dates
    const venueIds = venues.map(v => v._id.toString());
    const bookings = await Booking.find({
      venueId: { $in: venueIds },
      adminApproved: true,
      status: { $in: ['pending', 'confirmed'] }
    }).select('venueId date dateFrom dateTo');

    // Combine blocked dates and booked dates
    const datesData = venues.map(venue => {
      const venueBookings = bookings.filter(b => b.venueId.toString() === venue._id.toString());
      const bookedDates = new Set();
      
      venueBookings.forEach(booking => {
        if (booking.date) {
          const dateStr = new Date(booking.date).toISOString().split('T')[0];
          bookedDates.add(dateStr);
        }
        if (booking.dateFrom && booking.dateTo) {
          const startDate = new Date(booking.dateFrom);
          const endDate = new Date(booking.dateTo);
          let currentDate = new Date(startDate);
          while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            bookedDates.add(dateStr);
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      });

      const blockedDates = (venue.blockedDates || []).map(date => 
        new Date(date).toISOString().split('T')[0]
      );

      return {
        venueId: venue._id.toString(),
        venueName: venue.name,
        blockedDates: blockedDates,
        bookedDates: Array.from(bookedDates),
        allUnavailableDates: [...new Set([...blockedDates, ...bookedDates])]
      };
    });

    res.json({
      success: true,
      data: venueId ? datesData[0] : datesData
    });
  } catch (error) {
    console.error('Get blocked dates error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add blocked dates for a venue
export const addBlockedDates = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const { venueId, dates } = req.body;

    if (userRole !== 'vendor' || !userId) {
      return res.status(403).json({ error: 'Access denied. Vendor access required.' });
    }

    if (!venueId || !dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ error: 'Venue ID and dates array are required' });
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

    // Check if venue belongs to vendor
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    if (venue.vendorId.toString() !== userId) {
      return res.status(403).json({ error: 'You can only manage dates for your own venues' });
    }

    // Validate and parse dates
    const validDates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const dateStr of dates) {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ error: `Invalid date format: ${dateStr}` });
      }
      date.setHours(0, 0, 0, 0);
      
      // Don't allow blocking past dates
      if (date < today) {
        return res.status(400).json({ error: 'Cannot block dates in the past' });
      }

      validDates.push(date);
    }

    // Check if any dates are already booked
    const dateStrings = validDates.map(d => d.toISOString().split('T')[0]);
    const existingBookings = await Booking.find({
      venueId: venueId,
      adminApproved: true,
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        { date: { $in: validDates } },
        {
          dateFrom: { $lte: new Date(Math.max(...validDates.map(d => d.getTime()))) },
          dateTo: { $gte: new Date(Math.min(...validDates.map(d => d.getTime()))) }
        }
      ]
    });

    if (existingBookings.length > 0) {
      return res.status(409).json({ 
        error: 'Some dates are already booked',
        conflictingDates: existingBookings.map(b => ({
          date: b.date,
          dateFrom: b.dateFrom,
          dateTo: b.dateTo
        }))
      });
    }

    // Add dates to blockedDates (avoid duplicates)
    const existingBlockedDates = (venue.blockedDates || []).map(d => 
      new Date(d).toISOString().split('T')[0]
    );
    
    const newDates = validDates.filter(d => {
      const dateStr = d.toISOString().split('T')[0];
      return !existingBlockedDates.includes(dateStr);
    });

    if (newDates.length === 0) {
      return res.status(400).json({ error: 'All dates are already blocked' });
    }

    venue.blockedDates = [...(venue.blockedDates || []), ...newDates];
    await venue.save();

    res.json({
      success: true,
      message: `${newDates.length} date(s) blocked successfully`,
      blockedDates: venue.blockedDates.map(d => new Date(d).toISOString().split('T')[0])
    });
  } catch (error) {
    console.error('Add blocked dates error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Remove blocked dates for a venue
export const removeBlockedDates = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const { venueId, dates } = req.body;

    if (userRole !== 'vendor' || !userId) {
      return res.status(403).json({ error: 'Access denied. Vendor access required.' });
    }

    if (!venueId || !dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ error: 'Venue ID and dates array are required' });
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

    // Check if venue belongs to vendor
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    if (venue.vendorId.toString() !== userId) {
      return res.status(403).json({ error: 'You can only manage dates for your own venues' });
    }

    // Parse dates to compare
    const datesToRemove = dates.map(dateStr => {
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);
      return date.toISOString().split('T')[0];
    });

    // Remove dates from blockedDates
    const currentBlockedDates = (venue.blockedDates || []).map(d => 
      new Date(d).toISOString().split('T')[0]
    );

    venue.blockedDates = currentBlockedDates
      .filter(dateStr => !datesToRemove.includes(dateStr))
      .map(dateStr => new Date(dateStr));

    await venue.save();

    res.json({
      success: true,
      message: `${datesToRemove.length} date(s) unblocked successfully`,
      blockedDates: venue.blockedDates.map(d => new Date(d).toISOString().split('T')[0])
    });
  } catch (error) {
    console.error('Remove blocked dates error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create booking by vendor (no payment, no admin approval, directly confirmed)
export const createVendorBooking = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (userRole !== 'vendor' || !userId) {
      return res.status(403).json({ error: 'Access denied. Vendor access required.' });
    }

    const { 
      venueId, 
      date, 
      dateFrom, 
      dateTo,
      name,
      phone,
      email,
      marriageFor,
      personName,
      guests, 
      foodPreference,
      totalAmount
    } = req.body;

    // Validation
    if (!venueId || !date || !guests) {
      return res.status(400).json({ error: 'Venue ID, date, and guests are required' });
    }

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    if (guests <= 0) {
      return res.status(400).json({ error: 'Number of guests must be greater than 0' });
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

    // Check if venue belongs to vendor
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    if (venue.vendorId.toString() !== userId) {
      return res.status(403).json({ error: 'You can only create bookings for your own venues' });
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

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookingDate < today) {
      return res.status(400).json({ error: 'Booking date cannot be in the past' });
    }

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

    // Validate date range
    if (parsedDateFrom && parsedDateTo && parsedDateFrom > parsedDateTo) {
      return res.status(400).json({ error: 'dateFrom cannot be after dateTo' });
    }

    // Check if date is blocked
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

    // Check if date is already booked
    const startOfDay = new Date(bookingDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBooking = await Booking.findOne({
      venueId,
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

    // Create booking directly (no payment, no admin approval needed)
    const booking = new Booking({
      customerId: null, // No customer user account
      venueId,
      date: bookingDate,
      dateFrom: parsedDateFrom || null,
      dateTo: parsedDateTo || null,
      name: name.trim(),
      phone: phone.trim(),
      marriageFor: marriageFor || 'boy',
      personName: personName || null,
      guests: Number(guests),
      foodPreference: foodPreference || 'both',
      totalAmount: totalAmount ? Number(totalAmount) : 0,
      status: 'confirmed', // Directly confirmed
      paymentId: null, // No payment
      paymentStatus: 'paid', // Mark as paid since vendor is adding directly
      adminApproved: true, // Auto-approved for vendor bookings
      deviceId: null
    });

    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: booking
    });
  } catch (error) {
    console.error('Create vendor booking error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get vendor ledger (all financial transactions)
export const getVendorLedger = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (userRole !== 'vendor' || !userId) {
      return res.status(403).json({ error: 'Access denied. Vendor access required.' });
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

    // Get vendor venues
    const vendorVenues = await Venue.find({ vendorId: userId }).select('_id');
    const venueIds = vendorVenues.map(v => v._id.toString());

    // Get all payouts (expense transactions)
    const payouts = await Payout.find({ vendorId: userId })
      .sort({ createdAt: -1 });

    // Get all ledger entries (includes booking entries created when confirmed + manual entries)
    // This avoids duplicates - we only use entries from Ledger collection
    const allLedgerEntries = await Ledger.find({ vendorId: userId })
      .populate('venueId', 'name')
      .sort({ date: -1 });

    // Separate ledger entries by type
    const incomeTransactions = allLedgerEntries
      .filter(entry => entry.type === 'income')
      .map(entry => {
        const entryObj = entry.toObject ? entry.toObject() : entry;
        // Get booking details if this is a booking entry
        const bookingRef = entryObj.reference || '';
        const isBookingEntry = bookingRef.startsWith('Booking #');
        
        return {
          id: entryObj._id?.toString() || entryObj.id,
          type: 'income',
          category: entryObj.category || 'Booking Payment',
          description: entryObj.description || 'Income',
          amount: entryObj.amount || 0,
          date: entryObj.date || entryObj.createdAt,
          status: entryObj.status || 'paid',
          reference: entryObj.reference || '',
          venueName: entryObj.venueId?.name || null,
          notes: entryObj.notes || null,
          isManual: true, // All ledger entries can be edited/deleted since they're in Ledger collection
          customerName: isBookingEntry ? (entryObj.notes?.match(/for (.+?) -/) || [])[1] || 'Customer' : null
        };
      });

    // Create ledger entries from payouts (Expense)
    const expenseTransactions = payouts.map(payout => {
      const payoutObj = payout.toObject ? payout.toObject() : payout;
      return {
        id: payoutObj._id?.toString() || payoutObj.id,
        type: 'expense',
        category: 'Commission',
        description: 'Platform Commission',
        amount: payoutObj.commission || 0,
        date: payoutObj.createdAt || payoutObj.updatedAt,
        status: payoutObj.payment_status || 'pending',
        reference: `Payout #${(payoutObj._id || payoutObj.id).toString().slice(-6)}`,
        totalPayout: payoutObj.amount || 0
      };
    });

    // Get expense transactions from ledger entries
    const expenseTransactionsFromLedger = allLedgerEntries
      .filter(entry => entry.type === 'expense')
      .map(entry => {
        const entryObj = entry.toObject ? entry.toObject() : entry;
        return {
          id: entryObj._id?.toString() || entryObj.id,
          type: 'expense',
          category: entryObj.category || 'Expense',
          description: entryObj.description || 'Expense',
          amount: entryObj.amount || 0,
          date: entryObj.date || entryObj.createdAt,
          status: entryObj.status || 'paid',
          reference: entryObj.reference || '',
          venueName: entryObj.venueId?.name || null,
          notes: entryObj.notes || null,
          isManual: true
        };
      });

    // Combine and sort all transactions by date
    const allTransactions = [...incomeTransactions, ...expenseTransactions, ...expenseTransactionsFromLedger].sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });

    // Calculate totals
    const allIncomeTransactions = incomeTransactions;
    const allExpenseTransactions = [...expenseTransactions, ...expenseTransactionsFromLedger];

    const totalIncome = allIncomeTransactions
      .filter(t => t.status === 'paid')
      .reduce((sum, t) => sum + t.amount, 0);

    // Total Expenses includes paid, pending, and unpaid expenses (but not cancelled)
    const totalExpenses = allExpenseTransactions
      .filter(t => t.status !== 'cancelled')
      .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncome - totalExpenses;

    // Pending amounts (pending + unpaid)
    const pendingIncome = allIncomeTransactions
      .filter(t => t.status === 'pending' || t.status === 'unpaid')
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingExpenses = allExpenseTransactions
      .filter(t => t.status === 'pending' || t.status === 'unpaid')
      .reduce((sum, t) => sum + t.amount, 0);

    // Monthly summary
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyIncome = allIncomeTransactions
      .filter(t => new Date(t.date) >= currentMonthStart && t.status === 'paid')
      .reduce((sum, t) => sum + t.amount, 0);

    // Monthly expenses includes paid, pending, and unpaid (but not cancelled)
    const monthlyExpenses = allExpenseTransactions
      .filter(t => new Date(t.date) >= currentMonthStart && t.status !== 'cancelled')
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      success: true,
      transactions: allTransactions,
      summary: {
        totalIncome,
        totalExpenses,
        netBalance,
        pendingIncome,
        pendingExpenses,
        monthlyIncome,
        monthlyExpenses,
        monthlyNet: monthlyIncome - monthlyExpenses
      },
      counts: {
        totalTransactions: allTransactions.length,
        incomeCount: allIncomeTransactions.length,
        expenseCount: allExpenseTransactions.length
      }
    });
  } catch (error) {
    console.error('Get vendor ledger error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get vendor payouts
export const getVendorPayouts = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (userRole !== 'vendor' || !userId) {
      return res.status(403).json({ error: 'Access denied. Vendor access required.' });
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

    // Get payouts for vendor
    const payouts = await Payout.find({ vendorId: userId })
      .sort({ createdAt: -1 });

    // Format payouts
    const payoutsData = payouts.map(payout => {
      const payoutObj = payout.toObject ? payout.toObject() : payout;
      return {
        id: payoutObj._id?.toString() || payoutObj.id,
        amount: payoutObj.amount || 0,
        commission: payoutObj.commission || 0,
        payment_status: payoutObj.payment_status || 'pending',
        createdAt: payoutObj.createdAt || payoutObj.created_at,
        updatedAt: payoutObj.updatedAt || payoutObj.updated_at
      };
    });

    res.json({
      success: true,
      count: payoutsData.length,
      payouts: payoutsData
    });
  } catch (error) {
    console.error('Get vendor payouts error:', error);
    
    if (error.name === 'MongoServerError' || error.name === 'MongoTimeoutError') {
      return res.status(503).json({ 
        error: 'Database error',
        hint: 'Unable to connect to database. Please try again later.'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add manual ledger entry
export const addLedgerEntry = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (userRole !== 'vendor' || !userId) {
      return res.status(403).json({ error: 'Access denied. Vendor access required.' });
    }

    const { type, category, description, amount, date, status, reference, venueId, notes } = req.body;

    // Validation
    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Type must be income or expense' });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({ error: 'Category is required' });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Description is required' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
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

    // If venueId is provided, verify vendor owns it
    if (venueId) {
      const venue = await Venue.findById(venueId);
      if (!venue) {
        return res.status(404).json({ error: 'Venue not found' });
      }
      if (venue.vendorId.toString() !== userId) {
        return res.status(403).json({ error: 'You can only add entries for your own venues' });
      }
    }

    // Create ledger entry
    const ledgerEntry = new Ledger({
      vendorId: userId,
      type,
      category: category.trim(),
      description: description.trim(),
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      status: status || 'paid',
      reference: reference?.trim() || '',
      venueId: venueId || null,
      notes: notes?.trim() || ''
    });

    await ledgerEntry.save();

    // Populate venue if exists
    if (venueId) {
      await ledgerEntry.populate('venueId', 'name');
    }

    res.status(201).json({
      success: true,
      message: 'Ledger entry added successfully',
      entry: ledgerEntry
    });
  } catch (error) {
    console.error('Add ledger entry error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update manual ledger entry
export const updateLedgerEntry = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const { id } = req.params;

    if (userRole !== 'vendor' || !userId) {
      return res.status(403).json({ error: 'Access denied. Vendor access required.' });
    }

    const { type, category, description, amount, date, status, reference, venueId, notes } = req.body;

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

    // Find the ledger entry
    const entry = await Ledger.findById(id);

    if (!entry) {
      return res.status(404).json({ error: 'Ledger entry not found' });
    }

    // Verify vendor owns this entry
    if (entry.vendorId.toString() !== userId) {
      return res.status(403).json({ error: 'You can only update your own ledger entries' });
    }

    // Update fields
    if (type && ['income', 'expense'].includes(type)) entry.type = type;
    if (category) entry.category = category.trim();
    if (description) entry.description = description.trim();
    if (amount !== undefined) entry.amount = Number(amount);
    if (date) entry.date = new Date(date);
    if (status) entry.status = status;
    if (reference !== undefined) entry.reference = reference.trim();
    if (venueId !== undefined) {
      if (venueId) {
        const venue = await Venue.findById(venueId);
        if (!venue) {
          return res.status(404).json({ error: 'Venue not found' });
        }
        if (venue.vendorId.toString() !== userId) {
          return res.status(403).json({ error: 'You can only use your own venues' });
        }
        entry.venueId = venueId;
      } else {
        entry.venueId = null;
      }
    }
    if (notes !== undefined) entry.notes = notes.trim();

    await entry.save();

    // Populate venue if exists
    if (entry.venueId) {
      await entry.populate('venueId', 'name');
    }

    res.json({
      success: true,
      message: 'Ledger entry updated successfully',
      entry
    });
  } catch (error) {
    console.error('Update ledger entry error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete manual ledger entry
export const deleteLedgerEntry = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const { id } = req.params;

    if (userRole !== 'vendor' || !userId) {
      return res.status(403).json({ error: 'Access denied. Vendor access required.' });
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

    // Find the ledger entry
    const entry = await Ledger.findById(id);

    if (!entry) {
      return res.status(404).json({ error: 'Ledger entry not found' });
    }

    // Verify vendor owns this entry
    if (entry.vendorId.toString() !== userId) {
      return res.status(403).json({ error: 'You can only delete your own ledger entries' });
    }

    await Ledger.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Ledger entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete ledger entry error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



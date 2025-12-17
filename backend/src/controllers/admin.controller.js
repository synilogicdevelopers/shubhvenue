import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Venue from '../models/Venue.js';
import Booking from '../models/Booking.js';
import Payout from '../models/Payout.js';
import Lead from '../models/Lead.js';
import PaymentConfig from '../models/PaymentConfig.js';
import AppConfig from '../models/AppConfig.js';
import Banner from '../models/Banner.js';
import Video from '../models/Video.js';
import Testimonial from '../models/Testimonial.js';
import FAQ from '../models/FAQ.js';
import Company from '../models/Company.js';
import LegalPage from '../models/LegalPage.js';
import Contact from '../models/Contact.js';

// Admin Login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check MongoDB connection and try to reconnect if needed
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await connectToDatabase();
      } catch (dbError) {
        return res.status(503).json({ 
          message: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server',
          error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        });
      }
    }

    // Find admin user
    const admin = await User.findOne({ email: email.toLowerCase(), role: 'admin' });
    
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || 'change_me',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin Dashboard Stats
export const getDashboard = async (req, res) => {
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        message: 'Database connection not available' 
      });
    }

    const [users, vendors, venues, bookingsCount, leads, payouts, allBookings] = await Promise.all([
      User.countDocuments({ role: 'customer' }).catch(() => 0),
      User.countDocuments({ role: 'vendor' }).catch(() => 0),
      Venue.countDocuments().catch(() => 0),
      Booking.countDocuments().catch(() => 0),
      Lead.countDocuments().catch(() => 0),
      Payout.find().catch(() => []),
      Booking.find().select('totalAmount').catch(() => []),
    ]);

    const revenue = allBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const commission = payouts.reduce((sum, p) => sum + (p.commission || 0), 0);

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyBookings = await Booking.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const monthlyRevenue = monthlyBookings.map((item) => ({
      month: item._id,
      revenue: item.revenue || 0,
    }));

    // Booking status distribution
    const bookingStatus = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          value: { $sum: 1 },
        },
      },
    ]);

    const statusMap = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      cancelled: 'Cancelled',
      failed: 'Failed',
    };

    const bookingStatusData = bookingStatus.map((item) => ({
      name: statusMap[item._id] || item._id,
      value: item.value,
    }));

    // Lead status distribution
    const leadStatus = await Lead.aggregate([
      {
        $group: {
          _id: '$status',
          value: { $sum: 1 },
        },
      },
    ]);

    const leadStatusMap = {
      new: 'New',
      contacted: 'Contacted',
      qualified: 'Qualified',
      converted: 'Converted',
      lost: 'Lost',
    };

    const leadStatusData = leadStatus.map((item) => ({
      name: leadStatusMap[item._id] || item._id,
      value: item.value,
    }));

    // Recent leads count (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentLeads = await Lead.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    }).catch(() => 0);

    // New leads (status = 'new')
    const newLeadsCount = await Lead.countDocuments({ status: 'new' }).catch(() => 0);

    res.json({
      users,
      vendors,
      venues,
      bookings: bookingsCount,
      leads,
      newLeads: newLeadsCount,
      recentLeads,
      revenue,
      commission,
      monthlyRevenue,
      bookingStatus: bookingStatusData,
      leadStatus: leadStatusData,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get All Users
export const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role && role !== 'all' ? { role } : {};
    
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get User By ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user by ID error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete User
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { forceDelete } = req.query; // Optional query param to force delete with bookings
    
    // Prevent deleting admin users
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin user' });
    }
    
    // Check if user has bookings (using customerId, not userId)
    const bookingsCount = await Booking.countDocuments({ customerId: id });
    const leadsCount = await Lead.countDocuments({ customerId: id });
    
    // If forceDelete is not true and user has bookings/leads, return error
    if (forceDelete !== 'true' && (bookingsCount > 0 || leadsCount > 0)) {
      return res.status(400).json({ 
        message: `Cannot delete user. User has ${bookingsCount} booking(s) and ${leadsCount} lead(s). Add ?forceDelete=true to delete user and all associated data.`,
        bookingsCount,
        leadsCount,
        canForceDelete: true
      });
    }
    
    // Check if user is a vendor with venues
    if (user.role === 'vendor') {
      const venuesCount = await Venue.countDocuments({ vendorId: id });
      if (venuesCount > 0) {
        return res.status(400).json({ 
          message: `Cannot delete vendor. Vendor has ${venuesCount} venue(s). Please handle venues first.` 
        });
      }
    }
    
    // Cascade delete: Delete all bookings and leads associated with this user
    if (bookingsCount > 0) {
      await Booking.deleteMany({ customerId: id });
      console.log(`Deleted ${bookingsCount} booking(s) for user ${id}`);
    }
    
    if (leadsCount > 0) {
      await Lead.deleteMany({ customerId: id });
      console.log(`Deleted ${leadsCount} lead(s) for user ${id}`);
    }
    
    // Delete the user
    await User.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: `User deleted successfully${bookingsCount > 0 || leadsCount > 0 ? ` along with ${bookingsCount} booking(s) and ${leadsCount} lead(s)` : ''}`,
      deletedBookings: bookingsCount,
      deletedLeads: leadsCount
    });
  } catch (error) {
    console.error('Delete user error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Block/Unblock User
export const blockUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent blocking admin users
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot block admin user' });
    }
    
    // Toggle blocked status
    user.isBlocked = !user.isBlocked;
    await user.save();
    
    res.json({
      success: true,
      message: user.isBlocked ? 'User blocked successfully' : 'User unblocked successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    console.error('Block user error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get All Vendors
export const getVendors = async (req, res) => {
  try {
    // Get all vendors (exclude deleted ones - they are hard deleted now)
    const vendors = await User.find({ role: 'vendor', isDeleted: { $ne: true } })
      .select('-password')
      .sort({ createdAt: -1 });

    // Calculate revenue for each vendor
    const vendorsWithRevenue = await Promise.all(
      vendors.map(async (vendor) => {
        const venues = await Venue.find({ vendorId: vendor._id });
        const venueIds = venues.map(v => v._id);
        const bookings = await Booking.find({ venueId: { $in: venueIds } });
        const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        return {
          ...vendor.toObject(),
          totalRevenue,
          status: vendor.vendorStatus || 'pending', // Add status field for frontend compatibility
        };
      })
    );

    res.json(vendorsWithRevenue);
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get Vendor By ID
export const getVendorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vendor = await User.findById(id)
      .select('-password');
    
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    
    if (vendor.role !== 'vendor') {
      return res.status(400).json({ message: 'User is not a vendor' });
    }
    
    // Get all venues for this vendor
    const venues = await Venue.find({ vendorId: vendor._id });
    const venueIds = venues.map(v => v._id);
    
    // Get all bookings for these venues
    const bookings = await Booking.find({ venueId: { $in: venueIds } });
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    
    // Get venue status counts
    const venueStatusCounts = {
      pending: venues.filter(v => v.status === 'pending').length,
      approved: venues.filter(v => v.status === 'approved').length,
      rejected: venues.filter(v => v.status === 'rejected').length,
      active: venues.filter(v => v.status === 'active').length,
    };
    
    res.json({
      success: true,
      vendor: {
        ...vendor.toObject(),
        totalRevenue,
        venueCount: venues.length,
        venues: venues.map(v => ({
          _id: v._id,
          name: v.name,
          status: v.status,
          location: v.location,
          price: v.price,
          createdAt: v.createdAt
        })),
        venueStatusCounts,
        status: vendor.vendorStatus || 'pending',
      }
    });
  } catch (error) {
    console.error('Get vendor by ID error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid vendor ID' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Approve Vendor
export const approveVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await User.findById(id);
    
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    
    if (vendor.role !== 'vendor') {
      return res.status(400).json({ message: 'User is not a vendor' });
    }
    
    vendor.vendorStatus = 'approved';
    vendor.verified = true; // Also mark as verified
    await vendor.save();
    
    // Approve all venues of this vendor
    const updateResult = await Venue.updateMany(
      { vendorId: vendor._id },
      { status: 'approved' }
    );
    
    res.json({
      success: true,
      message: `Vendor approved successfully. ${updateResult.modifiedCount} venue(s) have been approved.`,
      vendor: {
        _id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        vendorStatus: vendor.vendorStatus
      },
      venuesApproved: updateResult.modifiedCount
    });
  } catch (error) {
    console.error('Approve vendor error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid vendor ID' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Reject Vendor
export const rejectVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await User.findById(id);
    
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    
    if (vendor.role !== 'vendor') {
      return res.status(400).json({ message: 'User is not a vendor' });
    }
    
    vendor.vendorStatus = 'rejected';
    await vendor.save();
    
    // Reject all venues of this vendor
    await Venue.updateMany(
      { vendorId: vendor._id },
      { status: 'rejected' }
    );
    
    res.json({
      success: true,
      message: 'Vendor rejected successfully. All venues have been rejected.',
      vendor: {
        _id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        vendorStatus: vendor.vendorStatus
      }
    });
  } catch (error) {
    console.error('Reject vendor error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid vendor ID' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete Vendor
export const deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await User.findById(id);
    
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    
    if (vendor.role !== 'vendor') {
      return res.status(400).json({ message: 'User is not a vendor' });
    }
    
    // Store vendor info before deletion
    const vendorInfo = {
      _id: vendor._id,
      name: vendor.name,
      email: vendor.email
    };
    
    // Reject all venues of this vendor before deleting
    await Venue.updateMany(
      { vendorId: vendor._id },
      { status: 'rejected' }
    );
    
    // Hard delete: Completely remove vendor from database
    await User.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Vendor deleted successfully. All venues have been rejected.',
      vendor: vendorInfo
    });
  } catch (error) {
    console.error('Delete vendor error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid vendor ID' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get All Venues
export const getVenues = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status && status !== 'all' ? { status } : {};
    
    const venues = await Venue.find(filter)
      .populate('vendorId', 'name email')
      .sort({ createdAt: -1 });
    res.json(venues);
  } catch (error) {
    console.error('Get venues error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Approve Venue
export const approveVenue = async (req, res) => {
  try {
    const { id } = req.params;
    const venue = await Venue.findByIdAndUpdate(id, { status: 'approved' }, { new: true });
    
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    
    res.json({ message: 'Venue approved successfully', venue });
  } catch (error) {
    console.error('Approve venue error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Reject Venue
export const rejectVenue = async (req, res) => {
  try {
    const { id } = req.params;
    const venue = await Venue.findByIdAndUpdate(id, { status: 'rejected' }, { new: true });
    
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    
    res.json({ message: 'Venue rejected', venue });
  } catch (error) {
    console.error('Reject venue error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update Venue Button Settings
export const updateVenueButtonSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const { bookingButtonEnabled, leadsButtonEnabled } = req.body;
    
    const updateData = {};
    if (typeof bookingButtonEnabled === 'boolean') {
      updateData.bookingButtonEnabled = bookingButtonEnabled;
    }
    if (typeof leadsButtonEnabled === 'boolean') {
      updateData.leadsButtonEnabled = leadsButtonEnabled;
    }
    
    const venue = await Venue.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    
    res.json({ 
      message: 'Venue button settings updated successfully', 
      venue 
    });
  } catch (error) {
    console.error('Update venue button settings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get All Bookings
export const getBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status && status !== 'all' ? { status } : {};
    
    const bookings = await Booking.find(filter)
      .populate('customerId', 'name email phone')
      .populate('venueId', 'name location')
      .sort({ createdAt: -1 });
    
    // Add paymentStatus based on paymentId and remove duplicates by _id
    const seenIds = new Set();
    const bookingsWithPayment = bookings
      .map(booking => ({
        ...booking.toObject(),
        paymentStatus: booking.paymentId ? 'paid' : 'pending',
      }))
      .filter(booking => {
        // Remove duplicates based on _id
        if (seenIds.has(booking._id.toString())) {
          return false;
        }
        seenIds.add(booking._id.toString());
        return true;
      });
    
    res.json({
      success: true,
      count: bookingsWithPayment.length,
      bookings: bookingsWithPayment
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update Booking Status
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const booking = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('customerId', 'name email').populate('venueId', 'name');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json({ message: 'Booking status updated', booking });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Approve Booking (Admin Only) - Makes booking visible to vendor
export const approveBooking = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.findByIdAndUpdate(
      id,
      { adminApproved: true },
      { new: true }
    )
      .populate('customerId', 'name email phone')
      .populate('venueId', 'name location');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Update corresponding Lead status to 'converted' when booking is approved
    await Lead.findOneAndUpdate(
      { bookingId: booking._id },
      { status: 'converted' },
      { new: true }
    );
    
    res.json({ 
      success: true,
      message: 'Booking approved successfully. Vendor can now see this booking.',
      booking: booking.toObject()
    });
  } catch (error) {
    console.error('Approve booking error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Reject Booking (Admin Only)
export const rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const booking = await Booking.findByIdAndUpdate(
      id,
      { 
        adminApproved: false,
        status: 'cancelled'
      },
      { new: true }
    )
      .populate('customerId', 'name email phone')
      .populate('venueId', 'name location');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Update corresponding Lead status to 'lost' when booking is rejected
    await Lead.findOneAndUpdate(
      { bookingId: booking._id },
      { 
        status: 'lost',
        notes: reason ? `Rejected: ${reason}` : 'Booking rejected by admin'
      },
      { new: true }
    );
    
    res.json({ 
      success: true,
      message: 'Booking rejected successfully',
      booking: booking.toObject()
    });
  } catch (error) {
    console.error('Reject booking error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get All Payouts
export const getPayouts = async (req, res) => {
  try {
    const payouts = await Payout.find()
      .populate('vendorId', 'name email')
      .sort({ createdAt: -1 });
    res.json(payouts);
  } catch (error) {
    console.error('Get payouts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get Analytics
export const getAnalytics = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Monthly revenue
    const monthlyRevenue = await Booking.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Bookings trend
    const bookingsTrend = await Booking.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top vendors
    const topVendors = await Booking.aggregate([
      {
        $lookup: {
          from: 'venues',
          localField: 'venueId',
          foreignField: '_id',
          as: 'venue',
        },
      },
      { $unwind: '$venue' },
      {
        $group: {
          _id: '$venue.vendorId',
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'vendor',
        },
      },
      { $unwind: '$vendor' },
    ]);

    // City-wise demand
    const cityWise = await Venue.aggregate([
      {
        $group: {
          _id: '$location',
          value: { $sum: 1 },
        },
      },
      { $sort: { value: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      monthlyRevenue: monthlyRevenue.map((item) => ({
        month: item._id,
        revenue: item.revenue || 0,
      })),
      bookingsTrend: bookingsTrend.map((item) => ({
        month: item._id,
        bookings: item.bookings || 0,
      })),
      topVendors: topVendors.map((item) => ({
        name: item.vendor.name || 'Unknown',
        revenue: item.revenue || 0,
      })),
      cityWise: cityWise.map((item) => ({
        name: item._id || 'Unknown',
        value: item.value || 0,
      })),
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get Admin Profile
export const getProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.user.userId).select('-password');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json(admin);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update Admin Profile
export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const admin = await User.findByIdAndUpdate(
      req.user.userId,
      { name, email },
      { new: true }
    ).select('-password');
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    res.json({ message: 'Profile updated successfully', user: admin });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Change Password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const admin = await User.findById(req.user.userId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get All Leads (Admin Only)
export const getLeads = async (req, res) => {
  try {
    const { status, venueId, dateFrom, dateTo } = req.query;
    
    let filter = {};
    
    // Filter by status if provided
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Filter by venue if provided
    if (venueId) {
      filter.venueId = venueId;
    }
    
    // Filter by date range if provided
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }
    
    const leads = await Lead.find(filter)
      .populate('customerId', 'name email phone')
      .populate('venueId', 'name location price capacity')
      .populate('bookingId', 'status paymentStatus')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: leads.length,
      leads: leads.map(lead => lead.toObject())
    });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get Single Lead by ID (Admin Only)
export const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const lead = await Lead.findById(id)
      .populate('customerId', 'name email phone')
      .populate('venueId', 'name location price capacity amenities')
      .populate('bookingId', 'status paymentStatus totalAmount');
    
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    
    res.json({
      success: true,
      lead: lead.toObject()
    });
  } catch (error) {
    console.error('Get lead by ID error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid lead ID' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Convert Lead to Booking (Admin Only)
export const convertLeadToBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentId } = req.body; // Optional payment ID
    
    // Find the lead
    const lead = await Lead.findById(id)
      .populate('venueId', 'name location price capacity status');
    
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    
    // Check if lead already has a booking
    if (lead.bookingId) {
      return res.status(400).json({ 
        message: 'This lead already has a booking associated with it' 
      });
    }
    
    // Check if venue exists and is approved
    const venue = lead.venueId;
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    
    if (venue.status !== 'approved') {
      return res.status(400).json({ message: 'Venue is not available for booking' });
    }
    
    // Check availability - see if there's already a confirmed or admin-approved booking for this date
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
    
    // Create Booking from Lead
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
      guests: lead.guests,
      foodPreference: lead.foodPreference || 'both',
      totalAmount: lead.totalAmount,
      status: 'pending',
      paymentId: paymentId || null,
      paymentStatus: paymentId ? 'paid' : 'pending', // If paymentId provided, mark as paid
      adminApproved: false, // Admin needs to approve
      deviceId: lead.deviceId || null
    });
    
    await booking.save();
    
    // Update lead to link it with the booking
    lead.bookingId = booking._id;
    lead.status = 'qualified'; // Mark as qualified since booking is created
    if (paymentId) {
      lead.source = 'booking'; // Update source if payment done
    }
    await lead.save();
    
    // Populate booking for response
    await booking.populate('customerId', 'name email phone');
    await booking.populate('venueId', 'name location price capacity');
    
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
      return res.status(400).json({ message: 'Invalid lead ID' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update Lead Status (Admin Only)
export const updateLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    // Validate status
    const validStatuses = ['new', 'contacted', 'qualified', 'converted', 'lost'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Status must be one of: ${validStatuses.join(', ')}` 
      });
    }
    
    const updateData = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    
    const lead = await Lead.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
      .populate('customerId', 'name email phone')
      .populate('venueId', 'name location')
      .populate('bookingId', 'status');
    
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    
    res.json({
      success: true,
      message: 'Lead updated successfully',
      lead: lead.toObject()
    });
  } catch (error) {
    console.error('Update lead status error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid lead ID' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get Payment Configuration (Admin Only)
export const getPaymentConfig = async (req, res) => {
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await connectToDatabase();
      } catch (dbError) {
        return res.status(503).json({ 
          message: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    const config = await PaymentConfig.getConfig();
    
    // Don't send the secret key in full - mask it for security
    const maskedSecret = config.razorpayKeySecret 
      ? config.razorpayKeySecret.substring(0, 4) + '****' + config.razorpayKeySecret.substring(config.razorpayKeySecret.length - 4)
      : '';
    
    res.json({
      success: true,
      config: {
        _id: config._id,
        razorpayKeyId: config.razorpayKeyId,
        razorpayKeySecret: maskedSecret, // Masked for display
        isActive: config.isActive,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      }
    });
  } catch (error) {
    console.error('Get payment config error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update Payment Configuration (Admin Only)
export const updatePaymentConfig = async (req, res) => {
  try {
    const { razorpayKeyId, razorpayKeySecret } = req.body;

    // Validation
    if (!razorpayKeyId || !razorpayKeySecret) {
      return res.status(400).json({ 
        message: 'Razorpay Key ID and Key Secret are required' 
      });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await connectToDatabase();
      } catch (dbError) {
        return res.status(503).json({ 
          message: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    // Validate key format
    const trimmedKeyId = razorpayKeyId.trim();
    const trimmedKeySecret = razorpayKeySecret.trim();
    
    if (!trimmedKeyId.startsWith('rzp_')) {
      return res.status(400).json({ 
        message: 'Invalid Razorpay Key ID format. Key ID should start with "rzp_"' 
      });
    }
    
    if (trimmedKeySecret.length < 20) {
      return res.status(400).json({ 
        message: 'Invalid Razorpay Key Secret. Secret key seems too short.' 
      });
    }
    
    // Get existing config or create new one
    let config = await PaymentConfig.findOne();
    
    if (config) {
      // Update existing config
      config.razorpayKeyId = trimmedKeyId;
      config.razorpayKeySecret = trimmedKeySecret;
      config.isActive = true;
      await config.save();
      console.log('✅ Payment config updated successfully');
      console.log('   Key ID:', trimmedKeyId.substring(0, 8) + '...');
      console.log('   Key Secret length:', trimmedKeySecret.length);
    } else {
      // Create new config
      config = await PaymentConfig.create({
        razorpayKeyId: trimmedKeyId,
        razorpayKeySecret: trimmedKeySecret,
        isActive: true,
      });
      console.log('✅ Payment config created successfully');
      console.log('   Key ID:', trimmedKeyId.substring(0, 8) + '...');
      console.log('   Key Secret length:', trimmedKeySecret.length);
    }

    // Mask secret for response
    const maskedSecret = config.razorpayKeySecret 
      ? config.razorpayKeySecret.substring(0, 4) + '****' + config.razorpayKeySecret.substring(config.razorpayKeySecret.length - 4)
      : '';

    res.json({
      success: true,
      message: 'Payment configuration updated successfully',
      config: {
        _id: config._id,
        razorpayKeyId: config.razorpayKeyId,
        razorpayKeySecret: maskedSecret, // Masked for display
        isActive: config.isActive,
        updatedAt: config.updatedAt,
      }
    });
  } catch (error) {
    console.error('Update payment config error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get Google Maps Configuration (Admin Only)
export const getGoogleMapsConfig = async (req, res) => {
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await connectToDatabase();
      } catch (dbError) {
        return res.status(503).json({ 
          message: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    const config = await AppConfig.getConfig();
    
    // Mask the API key for security (show first 8 and last 4 characters)
    const maskedKey = config.googleMapsApiKey 
      ? config.googleMapsApiKey.substring(0, 8) + '****' + config.googleMapsApiKey.substring(config.googleMapsApiKey.length - 4)
      : '';
    
    res.json({
      success: true,
      config: {
        _id: config._id,
        googleMapsApiKey: maskedKey, // Masked for display
        hasApiKey: !!config.googleMapsApiKey,
        isActive: config.isActive,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      }
    });
  } catch (error) {
    console.error('Get Google Maps config error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update Google Maps Configuration (Admin Only)
export const updateGoogleMapsConfig = async (req, res) => {
  try {
    const { googleMapsApiKey } = req.body;

    // Validation
    if (!googleMapsApiKey || !googleMapsApiKey.trim()) {
      return res.status(400).json({ 
        message: 'Google Maps API Key is required' 
      });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await connectToDatabase();
      } catch (dbError) {
        return res.status(503).json({ 
          message: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    // Validate key format (Google Maps API keys usually start with AIza)
    const trimmedKey = googleMapsApiKey.trim();
    
    if (!trimmedKey.startsWith('AIza')) {
      return res.status(400).json({ 
        message: 'Invalid Google Maps API Key format. Key should start with "AIza"' 
      });
    }
    
    if (trimmedKey.length < 30) {
      return res.status(400).json({ 
        message: 'Invalid Google Maps API Key. Key seems too short.' 
      });
    }
    
    // Get existing config or create new one
    let config = await AppConfig.findOne();
    
    if (config) {
      // Update existing config
      config.googleMapsApiKey = trimmedKey;
      config.isActive = true;
      await config.save();
      console.log('✅ Google Maps config updated successfully');
      console.log('   API Key:', trimmedKey.substring(0, 12) + '...');
    } else {
      // Create new config
      config = await AppConfig.create({
        googleMapsApiKey: trimmedKey,
        isActive: true,
      });
      console.log('✅ Google Maps config created successfully');
      console.log('   API Key:', trimmedKey.substring(0, 12) + '...');
    }

    // Mask key for response
    const maskedKey = config.googleMapsApiKey 
      ? config.googleMapsApiKey.substring(0, 8) + '****' + config.googleMapsApiKey.substring(config.googleMapsApiKey.length - 4)
      : '';

    res.json({
      success: true,
      message: 'Google Maps API key updated successfully',
      config: {
        _id: config._id,
        googleMapsApiKey: maskedKey, // Masked for display
        hasApiKey: true,
        isActive: config.isActive,
        updatedAt: config.updatedAt,
      }
    });
  } catch (error) {
    console.error('Update Google Maps config error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get All Banners (Admin Only)
export const getBanners = async (req, res) => {
  try {
    const { active } = req.query;
    let filter = {};
    
    if (active !== undefined && active !== 'all') {
      filter.isActive = active === 'true';
    }
    
    const banners = await Banner.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 });
    
    res.json({
      success: true,
      count: banners.length,
      banners: banners.map(banner => banner.toObject())
    });
  } catch (error) {
    console.error('Get banners error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get Single Banner by ID (Admin Only)
export const getBannerById = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);
    
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    
    res.json({
      success: true,
      banner: banner.toObject()
    });
  } catch (error) {
    console.error('Get banner by ID error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid banner ID' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create Banner (Admin Only)
export const createBanner = async (req, res) => {
  try {
    const { title, description, link, isActive, sortOrder, startDate, endDate } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Banner title is required' });
    }
    
    // Handle image - either from file upload or URL
    let imageUrl = '';
    if (req.file) {
      // File uploaded
      imageUrl = `/uploads/banners/${req.file.filename}`;
    } else if (req.body.image) {
      // Image URL provided
      imageUrl = req.body.image;
    } else {
      return res.status(400).json({ message: 'Banner image is required' });
    }
    
    const bannerData = {
      title: title.trim(),
      description: description || '',
      image: imageUrl,
      link: link || '',
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder ? parseInt(sortOrder) : 0,
    };
    
    if (startDate) bannerData.startDate = new Date(startDate);
    if (endDate) bannerData.endDate = new Date(endDate);
    
    const banner = await Banner.create(bannerData);
    
    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      banner: banner.toObject()
    });
  } catch (error) {
    console.error('Create banner error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update Banner (Admin Only)
export const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, link, isActive, sortOrder, startDate, endDate } = req.body;
    
    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    
    // Update fields
    if (title !== undefined) banner.title = title.trim();
    if (description !== undefined) banner.description = description;
    if (link !== undefined) banner.link = link;
    if (isActive !== undefined) banner.isActive = isActive;
    if (sortOrder !== undefined) banner.sortOrder = parseInt(sortOrder) || 0;
    if (startDate !== undefined) banner.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) banner.endDate = endDate ? new Date(endDate) : null;
    
    // Handle image update
    if (req.file) {
      // New file uploaded
      banner.image = `/uploads/banners/${req.file.filename}`;
    } else if (req.body.image !== undefined) {
      // Image URL provided or cleared
      banner.image = req.body.image || '';
    }
    
    await banner.save();
    
    res.json({
      success: true,
      message: 'Banner updated successfully',
      banner: banner.toObject()
    });
  } catch (error) {
    console.error('Update banner error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid banner ID' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete Banner (Admin Only)
export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByIdAndDelete(id);
    
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    
    res.json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    console.error('Delete banner error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid banner ID' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Toggle Banner Active Status (Admin Only)
export const toggleBannerActive = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);
    
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    
    banner.isActive = !banner.isActive;
    await banner.save();
    
    res.json({
      success: true,
      message: `Banner ${banner.isActive ? 'activated' : 'deactivated'} successfully`,
      banner: banner.toObject()
    });
  } catch (error) {
    console.error('Toggle banner active error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid banner ID' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ==================== VIDEO CONTROLLERS ====================

// Get All Videos (Admin Only)
export const getVideos = async (req, res) => {
  try {
    const { isActive, sortBy = 'sortOrder', order = 'asc' } = req.query;
    
    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;
    
    const videos = await Video.find(query).sort(sortOptions);
    
    res.json({
      success: true,
      videos: videos.map(v => v.toObject())
    });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get Video By ID (Admin Only)
export const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findById(id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    res.json({
      success: true,
      video: video.toObject()
    });
  } catch (error) {
    console.error('Get video by ID error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid video ID' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create Video (Admin Only)
export const createVideo = async (req, res) => {
  try {
    const { title, description, link, isActive, sortOrder, startDate, endDate, thumbnail } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Video title is required' });
    }
    
    // Handle video - either from file upload or URL
    let videoUrl = '';
    if (req.file) {
      // File uploaded
      videoUrl = `/uploads/videos/${req.file.filename}`;
    } else if (req.body.video) {
      // Video URL provided
      videoUrl = req.body.video;
    } else {
      return res.status(400).json({ message: 'Video file or URL is required' });
    }
    
    const videoData = {
      title: title.trim(),
      description: description || '',
      video: videoUrl,
      thumbnail: thumbnail || '',
      link: link || '',
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder ? parseInt(sortOrder) : 0,
    };
    
    if (startDate) videoData.startDate = new Date(startDate);
    if (endDate) videoData.endDate = new Date(endDate);
    
    const video = await Video.create(videoData);
    
    res.status(201).json({
      success: true,
      message: 'Video created successfully',
      video: video.toObject()
    });
  } catch (error) {
    console.error('Create video error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update Video (Admin Only)
export const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, link, isActive, sortOrder, startDate, endDate, thumbnail } = req.body;
    
    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Update fields
    if (title !== undefined) video.title = title.trim();
    if (description !== undefined) video.description = description;
    if (link !== undefined) video.link = link;
    if (thumbnail !== undefined) video.thumbnail = thumbnail;
    if (isActive !== undefined) video.isActive = isActive;
    if (sortOrder !== undefined) video.sortOrder = parseInt(sortOrder) || 0;
    if (startDate !== undefined) video.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) video.endDate = endDate ? new Date(endDate) : null;
    
    // Handle video update
    if (req.file) {
      // New file uploaded
      video.video = `/uploads/videos/${req.file.filename}`;
    } else if (req.body.video !== undefined) {
      // Video URL provided or cleared
      video.video = req.body.video || '';
    }
    
    await video.save();
    
    res.json({
      success: true,
      message: 'Video updated successfully',
      video: video.toObject()
    });
  } catch (error) {
    console.error('Update video error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid video ID' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete Video (Admin Only)
export const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findByIdAndDelete(id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Delete video error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid video ID' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Toggle Video Active Status (Admin Only)
export const toggleVideoActive = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findById(id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    video.isActive = !video.isActive;
    await video.save();
    
    res.json({
      success: true,
      message: `Video ${video.isActive ? 'activated' : 'deactivated'} successfully`,
      video: video.toObject()
    });
  } catch (error) {
    console.error('Toggle video active error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid video ID' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ==================== TESTIMONIALS ====================

// Get All Testimonials (Admin Only)
export const getTestimonials = async (req, res) => {
  try {
    const { isActive, sortBy = 'sortOrder', order = 'asc' } = req.query;
    
    const query = {};
    // Only filter by isActive if it's explicitly 'true' or 'false', not 'all'
    if (isActive !== undefined && isActive !== 'all' && isActive !== '') {
      query.isActive = isActive === 'true' || isActive === true;
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;
    
    const testimonials = await Testimonial.find(query).sort(sortOptions);
    
    res.json({
      success: true,
      testimonials: testimonials.map(t => t.toObject())
    });
  } catch (error) {
    console.error('Get testimonials error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get Testimonial By ID (Admin Only)
export const getTestimonialById = async (req, res) => {
  try {
    const { id } = req.params;
    const testimonial = await Testimonial.findById(id);
    
    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }
    
    res.json({
      success: true,
      testimonial: testimonial.toObject()
    });
  } catch (error) {
    console.error('Get testimonial by ID error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid testimonial ID' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create Testimonial (Admin Only)
export const createTestimonial = async (req, res) => {
  try {
    const { name, text, event, rating, image, isActive, sortOrder } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Testimonial name is required' });
    }
    
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Testimonial text is required' });
    }
    
    const testimonialData = {
      name: name.trim(),
      text: text.trim(),
      event: event || '',
      rating: rating ? parseInt(rating) : 5,
      image: image || '',
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder ? parseInt(sortOrder) : 0,
    };
    
    const testimonial = await Testimonial.create(testimonialData);
    
    res.status(201).json({
      success: true,
      message: 'Testimonial created successfully',
      testimonial: testimonial.toObject()
    });
  } catch (error) {
    console.error('Create testimonial error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update Testimonial (Admin Only)
export const updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, text, event, rating, image, isActive, sortOrder } = req.body;
    
    const testimonial = await Testimonial.findById(id);
    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }
    
    // Update fields
    if (name !== undefined) testimonial.name = name.trim();
    if (text !== undefined) testimonial.text = text.trim();
    if (event !== undefined) testimonial.event = event;
    if (rating !== undefined) testimonial.rating = parseInt(rating) || 5;
    if (image !== undefined) testimonial.image = image;
    if (isActive !== undefined) testimonial.isActive = isActive;
    if (sortOrder !== undefined) testimonial.sortOrder = parseInt(sortOrder) || 0;
    
    await testimonial.save();
    
    res.json({
      success: true,
      message: 'Testimonial updated successfully',
      testimonial: testimonial.toObject()
    });
  } catch (error) {
    console.error('Update testimonial error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid testimonial ID' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete Testimonial (Admin Only)
export const deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const testimonial = await Testimonial.findByIdAndDelete(id);
    
    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }
    
    res.json({
      success: true,
      message: 'Testimonial deleted successfully'
    });
  } catch (error) {
    console.error('Delete testimonial error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid testimonial ID' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Toggle Testimonial Active Status (Admin Only)
export const toggleTestimonialActive = async (req, res) => {
  try {
    const { id } = req.params;
    const testimonial = await Testimonial.findById(id);
    
    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }
    
    testimonial.isActive = !testimonial.isActive;
    await testimonial.save();
    
    res.json({
      success: true,
      message: `Testimonial ${testimonial.isActive ? 'activated' : 'deactivated'} successfully`,
      testimonial: testimonial.toObject()
    });
  } catch (error) {
    console.error('Toggle testimonial active error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid testimonial ID' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ==================== FAQs ====================

// Get All FAQs (Admin Only)
export const getFAQs = async (req, res) => {
  try {
    const { isActive, sortBy = 'sortOrder', order = 'asc' } = req.query;
    
    const query = {};
    // Only filter by isActive if it's explicitly 'true' or 'false', not 'all'
    if (isActive !== undefined && isActive !== 'all' && isActive !== '') {
      query.isActive = isActive === 'true' || isActive === true;
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;
    
    const faqs = await FAQ.find(query).sort(sortOptions);
    
    res.json({
      success: true,
      faqs: faqs.map(faq => faq.toObject())
    });
  } catch (error) {
    console.error('Get FAQs error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get FAQ By ID (Admin Only)
export const getFAQById = async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await FAQ.findById(id);
    
    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }
    
    res.json({
      success: true,
      faq: faq.toObject()
    });
  } catch (error) {
    console.error('Get FAQ by ID error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid FAQ ID' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create FAQ (Admin Only)
export const createFAQ = async (req, res) => {
  try {
    const { question, answer, category, isActive, sortOrder } = req.body;
    
    if (!question || !question.trim()) {
      return res.status(400).json({ message: 'FAQ question is required' });
    }
    
    if (!answer || !answer.trim()) {
      return res.status(400).json({ message: 'FAQ answer is required' });
    }
    
    const faqData = {
      question: question.trim(),
      answer: answer.trim(),
      category: category || '',
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder ? parseInt(sortOrder) : 0,
    };
    
    const faq = await FAQ.create(faqData);
    
    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      faq: faq.toObject()
    });
  } catch (error) {
    console.error('Create FAQ error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update FAQ (Admin Only)
export const updateFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, category, isActive, sortOrder } = req.body;
    
    const faq = await FAQ.findById(id);
    
    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }
    
    if (question !== undefined) {
      if (!question || !question.trim()) {
        return res.status(400).json({ message: 'FAQ question cannot be empty' });
      }
      faq.question = question.trim();
    }
    
    if (answer !== undefined) {
      if (!answer || !answer.trim()) {
        return res.status(400).json({ message: 'FAQ answer cannot be empty' });
      }
      faq.answer = answer.trim();
    }
    
    if (category !== undefined) {
      faq.category = category || '';
    }
    
    if (isActive !== undefined) {
      faq.isActive = isActive;
    }
    
    if (sortOrder !== undefined) {
      faq.sortOrder = parseInt(sortOrder);
    }
    
    await faq.save();
    
    res.json({
      success: true,
      message: 'FAQ updated successfully',
      faq: faq.toObject()
    });
  } catch (error) {
    console.error('Update FAQ error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid FAQ ID' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete FAQ (Admin Only)
export const deleteFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await FAQ.findByIdAndDelete(id);
    
    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }
    
    res.json({
      success: true,
      message: 'FAQ deleted successfully'
    });
  } catch (error) {
    console.error('Delete FAQ error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid FAQ ID' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Toggle FAQ Active Status (Admin Only)
export const toggleFAQActive = async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await FAQ.findById(id);
    
    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }
    
    faq.isActive = !faq.isActive;
    await faq.save();
    
    res.json({
      success: true,
      message: `FAQ ${faq.isActive ? 'activated' : 'deactivated'} successfully`,
      faq: faq.toObject()
    });
  } catch (error) {
    console.error('Toggle FAQ active error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid FAQ ID' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ==================== COMPANY ====================

// Get Company Data (Admin Only)
export const getCompany = async (req, res) => {
  try {
    const company = await Company.getCompany();
    
    res.json({
      success: true,
      company: company.toObject()
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update Company Data (Admin Only)
export const updateCompany = async (req, res) => {
  try {
    const {
      companyName,
      description,
      address,
      phone,
      email,
      facebook,
      twitter,
      instagram,
      linkedin,
      copyright,
      isActive,
    } = req.body;
    
    let company = await Company.findOne();
    
    if (!company) {
      company = await Company.create({
        companyName: companyName || 'VenueBook',
        description: description || '',
        address: address || '',
        phone: phone || '',
        email: email || '',
        facebook: facebook || '',
        twitter: twitter || '',
        instagram: instagram || '',
        linkedin: linkedin || '',
        copyright: copyright || '© 2024 VenueBook. All rights reserved.',
        isActive: isActive !== undefined ? isActive : true,
      });
    } else {
      if (companyName !== undefined) company.companyName = companyName.trim();
      if (description !== undefined) company.description = description || '';
      if (address !== undefined) company.address = address || '';
      if (phone !== undefined) company.phone = phone || '';
      if (email !== undefined) company.email = email || '';
      if (facebook !== undefined) company.facebook = facebook || '';
      if (twitter !== undefined) company.twitter = twitter || '';
      if (instagram !== undefined) company.instagram = instagram || '';
      if (linkedin !== undefined) company.linkedin = linkedin || '';
      if (copyright !== undefined) company.copyright = copyright || '';
      if (isActive !== undefined) company.isActive = isActive;
      
      await company.save();
    }
    
    res.json({
      success: true,
      message: 'Company data updated successfully',
      company: company.toObject()
    });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ==================== LEGAL PAGES ====================

// Get All Legal Pages (Admin Only)
export const getLegalPages = async (req, res) => {
  try {
    const legalPages = await LegalPage.find().sort({ type: 1 });
    
    res.json({
      success: true,
      legalPages: legalPages.map(page => page.toObject())
    });
  } catch (error) {
    console.error('Get legal pages error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get Legal Page By Type (Admin Only)
export const getLegalPageByType = async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['privacy-policy', 'terms-of-service', 'cookie-policy', 'about-us'].includes(type)) {
      return res.status(400).json({ message: 'Invalid page type' });
    }
    
    let page = await LegalPage.findOne({ type });
    
    if (!page) {
      // Create default page if none exists
      const defaultContent = getDefaultContent(type);
      page = await LegalPage.create({
        type,
        title: defaultContent.title,
        content: defaultContent.content,
        isActive: true,
      });
    }
    
    res.json({
      success: true,
      legalPage: page.toObject()
    });
  } catch (error) {
    console.error('Get legal page by type error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid legal page type' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update Legal Page (Admin Only)
export const updateLegalPage = async (req, res) => {
  try {
    const { type } = req.params;
    const { title, content, isActive } = req.body;
    
    if (!['privacy-policy', 'terms-of-service', 'cookie-policy', 'about-us'].includes(type)) {
      return res.status(400).json({ message: 'Invalid page type' });
    }
    
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content is required' });
    }
    
    let page = await LegalPage.findOne({ type });
    
    if (!page) {
      page = await LegalPage.create({
        type,
        title: title.trim(),
        content: content.trim(),
        lastUpdated: new Date(),
        isActive: isActive !== undefined ? isActive : true,
      });
    } else {
      page.title = title.trim();
      page.content = content.trim();
      page.lastUpdated = new Date();
      if (isActive !== undefined) page.isActive = isActive;
      
      await page.save();
    }
    
    res.json({
      success: true,
      message: 'Legal page updated successfully',
      legalPage: page.toObject()
    });
  } catch (error) {
    console.error('Update legal page error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid legal page type' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

function getDefaultContent(type) {
  const defaults = {
    'privacy-policy': {
      title: 'Privacy Policy',
      content: 'Privacy Policy content will be updated soon.'
    },
    'terms-of-service': {
      title: 'Terms of Service',
      content: 'Terms of Service content will be updated soon.'
    },
    'cookie-policy': {
      title: 'Cookie Policy',
      content: 'Cookie Policy content will be updated soon.'
    },
    'about-us': {
      title: 'About VenueBook',
      content: 'About Us content will be updated soon.'
    }
  };
  return defaults[type] || { title: 'Page', content: 'Content will be updated soon.' };
}

// ==================== CONTACT SUBMISSIONS ====================

// Get All Contact Submissions (Admin Only)
export const getContacts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    const query = {};
    if (status && ['new', 'read', 'replied', 'resolved'].includes(status)) {
      query.status = status;
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [contacts, total] = await Promise.all([
      Contact.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('repliedBy', 'name email')
        .lean(),
      Contact.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get Contact By ID (Admin Only)
export const getContactById = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findById(id)
      .populate('repliedBy', 'name email')
      .lean();
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact submission not found' });
    }
    
    res.json({
      success: true,
      contact
    });
  } catch (error) {
    console.error('Get contact by ID error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid contact ID' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update Contact Status (Admin Only)
export const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, replyMessage } = req.body;
    
    if (!['new', 'read', 'replied', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const contact = await Contact.findById(id);
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact submission not found' });
    }
    
    contact.status = status;
    
    if (status === 'replied' && replyMessage) {
      contact.replyMessage = replyMessage.trim();
      contact.repliedBy = req.user.id;
      contact.repliedAt = new Date();
    }
    
    await contact.save();
    
    const updatedContact = await Contact.findById(id)
      .populate('repliedBy', 'name email')
      .lean();
    
    res.json({
      success: true,
      message: 'Contact status updated successfully',
      contact: updatedContact
    });
  } catch (error) {
    console.error('Update contact status error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid contact ID' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete Contact (Admin Only)
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findByIdAndDelete(id);
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact submission not found' });
    }
    
    res.json({
      success: true,
      message: 'Contact submission deleted successfully'
    });
  } catch (error) {
    console.error('Delete contact error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid contact ID' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};


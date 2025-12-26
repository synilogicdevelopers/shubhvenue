import mongoose from 'mongoose';
import Shotlist from '../models/Shotlist.js';
import Venue from '../models/Venue.js';

// Helper function for database connection with timeout
const withTimeout = (promise, timeoutMs) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database operation timed out')), timeoutMs)
    )
  ]);
};

// Like/Unlike a venue (adds to shotlist or removes from shotlist)
export const toggleVenueLike = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await withTimeout(connectToDatabase(), 8000);
      } catch (dbError) {
        console.error('Database connection error:', dbError.message);
        return res.status(503).json({
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    const { venueId } = req.params;
    const userId = req.user?.userId || null;
    const deviceId = req.body.deviceId || req.headers['x-device-id'] || null;

    // Validation
    if (!venueId) {
      return res.status(400).json({ error: 'Venue ID is required' });
    }

    if (!userId && !deviceId) {
      return res.status(400).json({ 
        error: 'Either user authentication or deviceId is required' 
      });
    }

    // Validate venue exists
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    // Check if already in shotlist
    const query = userId 
      ? { userId, venueId }
      : { deviceId, venueId };

    const existingShotlist = await Shotlist.findOne(query);

    if (existingShotlist) {
      // Remove from shotlist (unlike)
      await Shotlist.findByIdAndDelete(existingShotlist._id);
      return res.json({
        success: true,
        message: 'Venue removed from shotlist',
        isLiked: false
      });
    } else {
      // Add to shotlist (like)
      const shotlist = await Shotlist.create({
        userId: userId || null,
        deviceId: deviceId || null,
        venueId
      });

      return res.status(201).json({
        success: true,
        message: 'Venue added to shotlist',
        isLiked: true,
        shotlist: {
          id: shotlist._id,
          venueId: shotlist.venueId
        }
      });
    }
  } catch (error) {
    console.error('Toggle venue like error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ 
        error: 'Venue already in shotlist' 
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid venue ID' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all shotlisted venues for a user
export const getShotlist = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await withTimeout(connectToDatabase(), 8000);
      } catch (dbError) {
        console.error('Database connection error:', dbError.message);
        return res.status(503).json({
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    const userId = req.user?.userId || null;
    const deviceId = req.query.deviceId || req.headers['x-device-id'] || null;

    if (!userId && !deviceId) {
      return res.status(400).json({ 
        error: 'Either user authentication or deviceId is required' 
      });
    }

    // Build query
    const query = userId 
      ? { userId }
      : { deviceId };

    // Get shotlist entries with venue details
    const shotlistEntries = await Shotlist.find(query)
      .populate({
        path: 'venueId',
        select: 'name slug description location capacity price pricingInfo images rating ratingInfo status vendorActive',
        populate: {
          path: 'categoryId',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 })
      .lean();

    // Filter out entries where venue doesn't exist or is deleted
    const validEntries = shotlistEntries.filter(entry => entry.venueId);

    // Format response
    const venues = validEntries.map(entry => {
      const venue = entry.venueId;
      return {
        id: venue._id,
        name: venue.name,
        slug: venue.slug,
        description: venue.description,
        location: venue.location,
        capacity: venue.capacity,
        price: venue.price,
        pricingInfo: venue.pricingInfo,
        images: venue.images || [],
        rating: venue.rating,
        ratingInfo: venue.ratingInfo,
        status: venue.status,
        vendorActive: venue.vendorActive,
        category: venue.categoryId ? {
          id: venue.categoryId._id,
          name: venue.categoryId.name
        } : null,
        shotlistedAt: entry.createdAt
      };
    });

    res.json({
      success: true,
      count: venues.length,
      venues
    });
  } catch (error) {
    console.error('Get shotlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Check if a venue is in shotlist
export const checkVenueLikeStatus = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await withTimeout(connectToDatabase(), 8000);
      } catch (dbError) {
        console.error('Database connection error:', dbError.message);
        return res.status(503).json({
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    const { venueId } = req.params;
    const userId = req.user?.userId || null;
    const deviceId = req.query.deviceId || req.headers['x-device-id'] || null;

    if (!venueId) {
      return res.status(400).json({ error: 'Venue ID is required' });
    }

    // If no user or deviceId, return false
    if (!userId && !deviceId) {
      return res.json({
        success: true,
        isLiked: false
      });
    }

    // Check if venue is in shotlist
    const query = userId 
      ? { userId, venueId }
      : { deviceId, venueId };

    const shotlistEntry = await Shotlist.findOne(query);

    res.json({
      success: true,
      isLiked: !!shotlistEntry
    });
  } catch (error) {
    console.error('Check venue like status error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid venue ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};





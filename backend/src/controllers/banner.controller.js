import mongoose from 'mongoose';
import Banner from '../models/Banner.js';

// Get public banners (for customers - only active banners)
export const getPublicBanners = async (req, res) => {
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

    // Only get active banners for public access
    const now = new Date();
    const filter = { 
      isActive: true,
      $and: [
        {
          $or: [
            { startDate: { $exists: false } }, // No start date
            { startDate: { $lte: now } } // Start date has passed or is today
          ]
        },
        {
          $or: [
            { endDate: { $exists: false } }, // No end date
            { endDate: { $gte: now } } // End date hasn't passed
          ]
        }
      ]
    };

    const banners = await Banner.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .select('title description image link sortOrder')
      .maxTimeMS(10000);
    
    res.json({
      success: true,
      count: banners.length,
      banners: banners.map(banner => banner.toObject())
    });
  } catch (error) {
    console.error('Get public banners error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single banner by ID (public)
export const getPublicBannerById = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findOne({ 
      _id: id, 
      isActive: true 
    }).select('title description image link sortOrder');
    
    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }
    
    res.json({
      success: true,
      banner: banner.toObject()
    });
  } catch (error) {
    console.error('Get public banner by ID error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid banner ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};


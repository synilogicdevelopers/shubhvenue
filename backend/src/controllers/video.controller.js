import mongoose from 'mongoose';
import Video from '../models/Video.js';

// Get public videos (for customers - only active videos)
export const getPublicVideos = async (req, res) => {
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

    // Only get active videos for public access
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

    const videos = await Video.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .select('title description video thumbnail link sortOrder')
      .maxTimeMS(10000);
    
    res.json({
      success: true,
      count: videos.length,
      videos: videos.map(video => video.toObject())
    });
  } catch (error) {
    console.error('Get public videos error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single video by ID (public)
export const getPublicVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findOne({ 
      _id: id, 
      isActive: true 
    }).select('title description video thumbnail link sortOrder');
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    res.json({
      success: true,
      video: video.toObject()
    });
  } catch (error) {
    console.error('Get public video by ID error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid video ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};


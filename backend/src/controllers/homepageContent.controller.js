import mongoose from 'mongoose';
import HomepageContent from '../models/HomepageContent.js';

// Get public homepage content (for customers)
export const getPublicHomepageContent = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await connectToDatabase();
      } catch (dbError) {
        return res.status(503).json({
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings'
        });
      }
    }

    const { type } = req.params;

    if (!type || !['seo-content', 'city-seo'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid content type. Must be "seo-content" or "city-seo"'
      });
    }

    const content = await HomepageContent.getByType(type);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      content: {
        type: content.type,
        title: content.title || '',
        content: content.content || '',
        cities: content.cities || [],
        lastUpdated: content.lastUpdated
      }
    });
  } catch (error) {
    console.error('Get public homepage content error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get all homepage content (Admin Only)
export const getAllHomepageContent = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await connectToDatabase();
      } catch (dbError) {
        return res.status(503).json({
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings'
        });
      }
    }

    const contents = await HomepageContent.find({ isActive: true }).sort({ createdAt: -1 });

    res.json({
      success: true,
      contents: contents.map(content => ({
        _id: content._id,
        type: content.type,
        title: content.title,
        content: content.content,
        cities: content.cities || [],
        isActive: content.isActive,
        lastUpdated: content.lastUpdated,
        createdAt: content.createdAt,
        updatedAt: content.updatedAt
      }))
    });
  } catch (error) {
    console.error('Get all homepage content error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    });
  }
};

// Get homepage content by type (Admin Only)
export const getHomepageContentByType = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await connectToDatabase();
      } catch (dbError) {
        return res.status(503).json({
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings'
        });
      }
    }

    const { type } = req.params;

    if (!type || !['seo-content', 'city-seo'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid content type. Must be "seo-content" or "city-seo"'
      });
    }

    const content = await HomepageContent.getByType(type);

    res.json({
      success: true,
      content: {
        _id: content._id,
        type: content.type,
        title: content.title,
        content: content.content,
        cities: content.cities || [],
        isActive: content.isActive,
        lastUpdated: content.lastUpdated,
        createdAt: content.createdAt,
        updatedAt: content.updatedAt
      }
    });
  } catch (error) {
    console.error('Get homepage content by type error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    });
  }
};

// Update homepage content (Admin Only)
export const updateHomepageContent = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await connectToDatabase();
      } catch (dbError) {
        return res.status(503).json({
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings'
        });
      }
    }

    const { type } = req.params;
    const { title, content, cities } = req.body;

    if (!type || !['seo-content', 'city-seo'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid content type. Must be "seo-content" or "city-seo"'
      });
    }

    // Find existing content or create new
    let homepageContent = await HomepageContent.findOne({ type });

    if (!homepageContent) {
      // Create new if doesn't exist
      homepageContent = new HomepageContent({
        type,
        title: title || '',
        content: content || '',
        cities: cities || [],
        isActive: true
      });
    } else {
      // Update existing
      if (title !== undefined) homepageContent.title = title.trim();
      if (content !== undefined) homepageContent.content = content.trim();
      if (cities !== undefined && Array.isArray(cities)) {
        homepageContent.cities = cities.filter(city => city.name && city.name.trim());
      }
      homepageContent.lastUpdated = new Date();
    }

    await homepageContent.save();

    res.json({
      success: true,
      message: 'Homepage content updated successfully',
      content: {
        _id: homepageContent._id,
        type: homepageContent.type,
        title: homepageContent.title,
        content: homepageContent.content,
        cities: homepageContent.cities || [],
        isActive: homepageContent.isActive,
        lastUpdated: homepageContent.lastUpdated
      }
    });
  } catch (error) {
    console.error('Update homepage content error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message
      });
    }
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    });
  }
};


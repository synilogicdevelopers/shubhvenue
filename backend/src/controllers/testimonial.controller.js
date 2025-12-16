import mongoose from 'mongoose';
import Testimonial from '../models/Testimonial.js';

// Get public testimonials (for customers - only active testimonials)
export const getPublicTestimonials = async (req, res) => {
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

    // Only get active testimonials for public access
    const filter = { 
      isActive: true
    };

    const testimonials = await Testimonial.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .select('name text event rating image sortOrder')
      .maxTimeMS(10000);
    
    res.json({
      success: true,
      count: testimonials.length,
      testimonials: testimonials.map(testimonial => testimonial.toObject())
    });
  } catch (error) {
    console.error('Get public testimonials error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single testimonial by ID (public)
export const getPublicTestimonialById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const testimonial = await Testimonial.findOne({ 
      _id: id, 
      isActive: true 
    }).select('name text event rating image sortOrder');
    
    if (!testimonial) {
      return res.status(404).json({ 
        error: 'Testimonial not found',
        message: 'The testimonial you are looking for does not exist or is not active'
      });
    }
    
    res.json({
      success: true,
      testimonial: testimonial.toObject()
    });
  } catch (error) {
    console.error('Get public testimonial by ID error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid testimonial ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};


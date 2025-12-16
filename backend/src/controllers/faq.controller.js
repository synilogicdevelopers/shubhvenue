import mongoose from 'mongoose';
import FAQ from '../models/FAQ.js';

// Helper function for database connection with timeout
const withTimeout = (promise, timeoutMs) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database operation timed out')), timeoutMs)
    )
  ]);
};

// Get public FAQs (for customers - only active FAQs)
export const getPublicFAQs = async (req, res) => {
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

    const now = new Date();
    const filter = {
      isActive: true,
    };

    const faqs = await FAQ.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .select('question answer category')
      .maxTimeMS(10000);

    res.json({
      success: true,
      count: faqs.length,
      faqs: faqs.map(faq => faq.toObject())
    });
  } catch (error) {
    console.error('Get public FAQs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single FAQ by ID (public)
export const getPublicFAQById = async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await FAQ.findOne({
      _id: id,
      isActive: true
    }).select('question answer category');

    if (!faq) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    res.json({
      success: true,
      faq: faq.toObject()
    });
  } catch (error) {
    console.error('Get public FAQ by ID error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid FAQ ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};


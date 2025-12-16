import mongoose from 'mongoose';
import LegalPage from '../models/LegalPage.js';

// Helper function for database connection with timeout
const withTimeout = (promise, timeoutMs) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database operation timed out')), timeoutMs)
    )
  ]);
};

// Get public legal page by type (for customers - only active pages)
export const getPublicLegalPage = async (req, res) => {
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

    const { type } = req.params;
    
    if (!['privacy-policy', 'terms-of-service', 'cookie-policy', 'about-us'].includes(type)) {
      return res.status(400).json({ error: 'Invalid page type' });
    }

    const page = await LegalPage.getByType(type);

    if (!page || !page.isActive) {
      // Return default content if page is not active
      const defaultContent = getDefaultContent(type);
      return res.json({
        success: true,
        legalPage: {
          type,
          title: defaultContent.title,
          content: defaultContent.content,
          lastUpdated: new Date(),
        }
      });
    }

    res.json({
      success: true,
      legalPage: {
        type: page.type,
        title: page.title,
        content: page.content,
        lastUpdated: page.lastUpdated || page.updatedAt,
      }
    });
  } catch (error) {
    console.error('Get public legal page error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid legal page type' });
    }
    res.status(500).json({ error: 'Internal server error' });
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


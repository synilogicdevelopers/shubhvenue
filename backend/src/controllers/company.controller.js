import mongoose from 'mongoose';
import Company from '../models/Company.js';

// Helper function for database connection with timeout
const withTimeout = (promise, timeoutMs) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database operation timed out')), timeoutMs)
    )
  ]);
};

// Get public company data (for customers - only active company)
export const getPublicCompany = async (req, res) => {
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

    const company = await Company.getCompany();

    if (!company || !company.isActive) {
      // Return default values if company is not active
      return res.json({
        success: true,
        company: {
          companyName: 'VenueBook',
          description: 'Your trusted partner in finding the perfect venue for every occasion.',
          address: '',
          phone: '',
          email: '',
          facebook: '',
          twitter: '',
          instagram: '',
          linkedin: '',
          copyright: '© 2024 VenueBook. All rights reserved.',
        }
      });
    }

    res.json({
      success: true,
      company: {
        companyName: company.companyName,
        description: company.description,
        address: company.address,
        phone: company.phone,
        email: company.email,
        facebook: company.facebook,
        twitter: company.twitter,
        instagram: company.instagram,
        linkedin: company.linkedin,
        copyright: company.copyright,
      }
    });
  } catch (error) {
    console.error('Get public company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


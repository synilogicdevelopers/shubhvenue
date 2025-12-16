import mongoose from 'mongoose';
import Contact from '../models/Contact.js';

// Helper function for database connection with timeout
const withTimeout = (promise, timeoutMs) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database operation timed out')), timeoutMs)
    )
  ]);
};

// Submit Contact Form (Public)
export const submitContact = async (req, res) => {
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

    const { name, email, phone, subject, message } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Create contact submission
    const contact = await Contact.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      subject: subject ? subject.trim() : '',
      message: message.trim(),
      status: 'new',
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you soon.',
      contact: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
      }
    });
  } catch (error) {
    console.error('Submit contact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get Contact By ID (Public - for confirmation)
export const getContactById = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findById(id).select('name email status createdAt');

    if (!contact) {
      return res.status(404).json({ error: 'Contact submission not found' });
    }

    res.json({
      success: true,
      contact: contact.toObject()
    });
  } catch (error) {
    console.error('Get contact by ID error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid contact ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get Contact By Email (Public - for users to check their submission)
export const getContactByEmail = async (req, res) => {
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

    const { email } = req.query;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Get all contacts for this email, sorted by latest first
    const contacts = await Contact.find({ email: email.trim().toLowerCase() })
      .sort({ createdAt: -1 })
      .select('name email phone subject message status replyMessage repliedAt createdAt')
      .lean();

    if (contacts.length === 0) {
      return res.status(404).json({ 
        error: 'No submissions found for this email address' 
      });
    }

    res.json({
      success: true,
      contacts: contacts.map(contact => ({
        ...contact,
        createdAt: contact.createdAt,
        repliedAt: contact.repliedAt || null,
      }))
    });
  } catch (error) {
    console.error('Get contact by email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


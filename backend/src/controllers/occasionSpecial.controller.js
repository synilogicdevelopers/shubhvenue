import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OccasionSpecial from '../models/OccasionSpecial.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to delete occasion special image file
const deleteOccasionSpecialImageFile = (imagePath) => {
  if (!imagePath) return;
  
  try {
    const filename = imagePath.replace('/uploads/occasion-specials/', '');
    if (filename && !filename.includes('http')) {
      const filePath = path.join(__dirname, '../../uploads/occasion-specials', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old occasion special image: ${filePath}`);
      }
    }
  } catch (error) {
    console.error(`Error deleting occasion special image file ${imagePath}:`, error.message);
  }
};

// Helper function to validate image URL
const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }
    
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i;
    const hasImageExtension = imageExtensions.test(urlObj.pathname);
    
    const imageHosts = /(imgur|unsplash|pexels|pixabay|cloudinary|s3|amazonaws|googleusercontent|fbcdn|cdn)/i;
    const isImageHost = imageHosts.test(urlObj.hostname);
    
    return hasImageExtension || isImageHost;
  } catch (error) {
    return false;
  }
};

// Helper function to validate and process image URLs
const validateAndProcessImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  if (imageUrl.startsWith('/uploads/')) {
    return imageUrl;
  }
  
  if (isValidImageUrl(imageUrl)) {
    return imageUrl;
  }
  
  return null;
};

// Helper function to add timeout to promises
const withTimeout = (promise, timeoutMs = 10000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    )
  ]);
};

// Get all occasion specials
export const getOccasionSpecials = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await withTimeout(connectToDatabase(), 5000);
      } catch (dbError) {
        console.error('Database connection error:', dbError.message);
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    const { active } = req.query;
    let filter = {};

    if (active !== undefined && active !== 'all' && active !== '') {
      if (active === 'true' || active === true) {
        filter.isActive = true;
      } else if (active === 'false' || active === false) {
        filter.isActive = false;
      }
    } else if (active === 'all' || active === '') {
      // Show all
    } else {
      const userRole = req.user?.role;
      if (userRole !== 'admin') {
        filter.isActive = true;
      }
    }

    const occasionSpecialsQuery = OccasionSpecial.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .maxTimeMS(10000);

    const occasionSpecials = await withTimeout(occasionSpecialsQuery, 12000);

    res.json({
      success: true,
      count: occasionSpecials.length,
      occasionSpecials: occasionSpecials
    });
  } catch (error) {
    console.error('Get occasion specials error:', error);
    if (error.message === 'Operation timed out') {
      return res.status(504).json({ 
        error: 'Request timeout',
        hint: 'Database query took too long. Please try again.'
      });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single occasion special by ID
export const getOccasionSpecialById = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await withTimeout(connectToDatabase(), 5000);
      } catch (dbError) {
        console.error('Database connection error:', dbError.message);
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    const occasionSpecialQuery = OccasionSpecial.findById(id).maxTimeMS(10000);
    const occasionSpecial = await withTimeout(occasionSpecialQuery, 12000);

    if (!occasionSpecial) {
      return res.status(404).json({ error: 'Occasion special not found' });
    }

    res.json({
      success: true,
      occasionSpecial: occasionSpecial
    });
  } catch (error) {
    console.error('Get occasion special by ID error:', error);
    if (error.message === 'Operation timed out') {
      return res.status(504).json({ 
        error: 'Request timeout',
        hint: 'Database query took too long. Please try again.'
      });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid occasion special ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create occasion special (Admin only)
export const createOccasionSpecial = async (req, res) => {
  try {
    const { name, description, image, isActive, sortOrder } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Occasion special name is required' });
    }

    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await withTimeout(connectToDatabase(), 5000);
      } catch (dbError) {
        console.error('Database connection error:', dbError.message);
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    const existingOccasionSpecialQuery = OccasionSpecial.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    }).maxTimeMS(5000);
    
    const existingOccasionSpecial = await withTimeout(existingOccasionSpecialQuery, 7000);

    if (existingOccasionSpecial) {
      return res.status(409).json({ error: 'Occasion special with this name already exists' });
    }

    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/occasion-specials/${req.file.filename}`;
    } else if (image) {
      imagePath = validateAndProcessImageUrl(image);
      if (image && !imagePath) {
        return res.status(400).json({ 
          error: 'Invalid image URL. Please provide a valid image URL (http/https) or upload a file.' 
        });
      }
    } else {
      return res.status(400).json({ error: 'Image is required for occasion special' });
    }

    const occasionSpecial = new OccasionSpecial({
      name: name.trim(),
      description: description || '',
      image: imagePath,
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder || 0
    });

    const savePromise = occasionSpecial.save();
    await withTimeout(savePromise, 10000);

    res.status(201).json({
      success: true,
      message: 'Occasion special created successfully',
      occasionSpecial
    });
  } catch (error) {
    console.error('Create occasion special error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Occasion special with this name already exists' });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update occasion special (Admin only)
export const updateOccasionSpecial = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, isActive, sortOrder } = req.body;

    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await withTimeout(connectToDatabase(), 5000);
      } catch (dbError) {
        console.error('Database connection error:', dbError.message);
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    const occasionSpecialQuery = OccasionSpecial.findById(id).maxTimeMS(10000);
    const occasionSpecial = await withTimeout(occasionSpecialQuery, 12000);

    if (!occasionSpecial) {
      return res.status(404).json({ error: 'Occasion special not found' });
    }

    if (name && name.trim() !== occasionSpecial.name) {
      const existingOccasionSpecialQuery = OccasionSpecial.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: id }
      }).maxTimeMS(5000);
      
      const existingOccasionSpecial = await withTimeout(existingOccasionSpecialQuery, 7000);

      if (existingOccasionSpecial) {
        return res.status(409).json({ error: 'Occasion special with this name already exists' });
      }
      occasionSpecial.name = name.trim();
    }

    if (req.file) {
      if (occasionSpecial.image) {
        deleteOccasionSpecialImageFile(occasionSpecial.image);
      }
      occasionSpecial.image = `/uploads/occasion-specials/${req.file.filename}`;
    }
    else if (image !== undefined) {
      if (image === null || image === '') {
        return res.status(400).json({ error: 'Image is required for occasion special' });
      } else if (image !== occasionSpecial.image) {
        const validatedUrl = validateAndProcessImageUrl(image);
        if (!validatedUrl) {
          return res.status(400).json({ 
            error: 'Invalid image URL. Please provide a valid image URL (http/https) or upload a file.' 
          });
        }
        
        if (occasionSpecial.image && !occasionSpecial.image.includes('http')) {
          deleteOccasionSpecialImageFile(occasionSpecial.image);
        }
        occasionSpecial.image = validatedUrl;
      }
    }

    if (description !== undefined) occasionSpecial.description = description;
    if (isActive !== undefined) occasionSpecial.isActive = isActive;
    if (sortOrder !== undefined) occasionSpecial.sortOrder = sortOrder;

    const savePromise = occasionSpecial.save();
    await withTimeout(savePromise, 10000);

    res.json({
      success: true,
      message: 'Occasion special updated successfully',
      occasionSpecial
    });
  } catch (error) {
    console.error('Update occasion special error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid occasion special ID' });
    }

    if (error.code === 11000) {
      return res.status(409).json({ error: 'Occasion special with this name already exists' });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete occasion special (Admin only)
export const deleteOccasionSpecial = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await withTimeout(connectToDatabase(), 5000);
      } catch (dbError) {
        console.error('Database connection error:', dbError.message);
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    const occasionSpecialQuery = OccasionSpecial.findById(id).maxTimeMS(10000);
    const occasionSpecial = await withTimeout(occasionSpecialQuery, 12000);

    if (!occasionSpecial) {
      return res.status(404).json({ error: 'Occasion special not found' });
    }

    if (occasionSpecial.image) {
      deleteOccasionSpecialImageFile(occasionSpecial.image);
    }

    const deletePromise = OccasionSpecial.findByIdAndDelete(id);
    await withTimeout(deletePromise, 10000);

    res.json({
      success: true,
      message: 'Occasion special deleted successfully'
    });
  } catch (error) {
    console.error('Delete occasion special error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid occasion special ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};


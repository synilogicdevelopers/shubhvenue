import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import DecorationCategory from '../models/DecorationCategory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to delete decoration category image file
const deleteDecorationCategoryImageFile = (imagePath) => {
  if (!imagePath) return;
  
  try {
    const filename = imagePath.replace('/uploads/decoration-categories/', '');
    if (filename && !filename.includes('http')) {
      const filePath = path.join(__dirname, '../../uploads/decoration-categories', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old decoration category image: ${filePath}`);
      }
    }
  } catch (error) {
    console.error(`Error deleting decoration category image file ${imagePath}:`, error.message);
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

// Get all decoration categories
export const getDecorationCategories = async (req, res) => {
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
      // Show all categories
    } else {
      const userRole = req.user?.role;
      if (userRole !== 'admin') {
        filter.isActive = true;
      }
    }

    const categoriesQuery = DecorationCategory.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .maxTimeMS(10000);

    const categories = await withTimeout(categoriesQuery, 12000);

    res.json({
      success: true,
      count: categories.length,
      categories: categories
    });
  } catch (error) {
    console.error('Get decoration categories error:', error);
    if (error.message === 'Operation timed out') {
      return res.status(504).json({ 
        error: 'Request timeout',
        hint: 'Database query took too long. Please try again.'
      });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single decoration category by ID
export const getDecorationCategoryById = async (req, res) => {
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

    const categoryQuery = DecorationCategory.findById(id).maxTimeMS(10000);
    const category = await withTimeout(categoryQuery, 12000);

    if (!category) {
      return res.status(404).json({ error: 'Decoration category not found' });
    }

    res.json({
      success: true,
      category: category
    });
  } catch (error) {
    console.error('Get decoration category by ID error:', error);
    if (error.message === 'Operation timed out') {
      return res.status(504).json({ 
        error: 'Request timeout',
        hint: 'Database query took too long. Please try again.'
      });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid decoration category ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create decoration category (Admin only)
export const createDecorationCategory = async (req, res) => {
  try {
    const { name, description, icon, image, isActive, sortOrder } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Decoration category name is required' });
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

    const existingCategoryQuery = DecorationCategory.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    }).maxTimeMS(5000);
    
    const existingCategory = await withTimeout(existingCategoryQuery, 7000);

    if (existingCategory) {
      return res.status(409).json({ error: 'Decoration category with this name already exists' });
    }

    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/decoration-categories/${req.file.filename}`;
    } else if (image) {
      imagePath = validateAndProcessImageUrl(image);
      if (image && !imagePath) {
        return res.status(400).json({ 
          error: 'Invalid image URL. Please provide a valid image URL (http/https) or upload a file.' 
        });
      }
    }

    const category = new DecorationCategory({
      name: name.trim(),
      description: description || '',
      icon: icon || '',
      image: imagePath || '',
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder || 0
    });

    const savePromise = category.save();
    await withTimeout(savePromise, 10000);

    res.status(201).json({
      success: true,
      message: 'Decoration category created successfully',
      category
    });
  } catch (error) {
    console.error('Create decoration category error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Decoration category with this name already exists' });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update decoration category (Admin only)
export const updateDecorationCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, image, isActive, sortOrder } = req.body;

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

    const categoryQuery = DecorationCategory.findById(id).maxTimeMS(10000);
    const category = await withTimeout(categoryQuery, 12000);

    if (!category) {
      return res.status(404).json({ error: 'Decoration category not found' });
    }

    if (name && name.trim() !== category.name) {
      const existingCategoryQuery = DecorationCategory.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: id }
      }).maxTimeMS(5000);
      
      const existingCategory = await withTimeout(existingCategoryQuery, 7000);

      if (existingCategory) {
        return res.status(409).json({ error: 'Decoration category with this name already exists' });
      }
      category.name = name.trim();
    }

    if (req.file) {
      if (category.image) {
        deleteDecorationCategoryImageFile(category.image);
      }
      category.image = `/uploads/decoration-categories/${req.file.filename}`;
    }
    else if (image !== undefined) {
      if (image === null || image === '') {
        if (category.image) {
          deleteDecorationCategoryImageFile(category.image);
        }
        category.image = '';
      } else if (image !== category.image) {
        const validatedUrl = validateAndProcessImageUrl(image);
        if (!validatedUrl) {
          return res.status(400).json({ 
            error: 'Invalid image URL. Please provide a valid image URL (http/https) or upload a file.' 
          });
        }
        
        if (category.image && !category.image.includes('http')) {
          deleteDecorationCategoryImageFile(category.image);
        }
        category.image = validatedUrl;
      }
    }

    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (isActive !== undefined) category.isActive = isActive;
    if (sortOrder !== undefined) category.sortOrder = sortOrder;

    const savePromise = category.save();
    await withTimeout(savePromise, 10000);

    res.json({
      success: true,
      message: 'Decoration category updated successfully',
      category
    });
  } catch (error) {
    console.error('Update decoration category error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid decoration category ID' });
    }

    if (error.code === 11000) {
      return res.status(409).json({ error: 'Decoration category with this name already exists' });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete decoration category (Admin only)
export const deleteDecorationCategory = async (req, res) => {
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

    const categoryQuery = DecorationCategory.findById(id).maxTimeMS(10000);
    const category = await withTimeout(categoryQuery, 12000);

    if (!category) {
      return res.status(404).json({ error: 'Decoration category not found' });
    }

    if (category.image) {
      deleteDecorationCategoryImageFile(category.image);
    }

    const deletePromise = DecorationCategory.findByIdAndDelete(id);
    await withTimeout(deletePromise, 10000);

    res.json({
      success: true,
      message: 'Decoration category deleted successfully'
    });
  } catch (error) {
    console.error('Delete decoration category error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid decoration category ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};


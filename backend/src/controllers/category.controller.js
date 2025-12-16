import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Category from '../models/Category.js';
import Venue from '../models/Venue.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to delete category image file
const deleteCategoryImageFile = (imagePath) => {
  if (!imagePath) return;
  
  try {
    // Remove /uploads/categories/ prefix to get filename
    const filename = imagePath.replace('/uploads/categories/', '');
    if (filename && !filename.includes('http')) {
      // Only delete local files, not URLs
      const filePath = path.join(__dirname, '../../uploads/categories', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old category image: ${filePath}`);
      }
    }
  } catch (error) {
    console.error(`Error deleting category image file ${imagePath}:`, error.message);
    // Don't throw error, just log it
  }
};

// Helper function to validate image URL
const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    // Check if it's http or https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }
    
    // Check for common image extensions in URL
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i;
    const hasImageExtension = imageExtensions.test(urlObj.pathname);
    
    // Also accept URLs that might not have extension but are from known image hosts
    const imageHosts = /(imgur|unsplash|pexels|pixabay|cloudinary|s3|amazonaws|googleusercontent|fbcdn|cdn)/i;
    const isImageHost = imageHosts.test(urlObj.hostname);
    
    return hasImageExtension || isImageHost;
  } catch (error) {
    // Invalid URL format
    return false;
  }
};

// Helper function to validate and process image URLs
const validateAndProcessImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  // If it's already a local path, return as is
  if (imageUrl.startsWith('/uploads/')) {
    return imageUrl;
  }
  
  // If it's a valid URL, return it
  if (isValidImageUrl(imageUrl)) {
    return imageUrl;
  }
  
  // If it's not a valid URL, return null
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

// Get all categories (public)
export const getCategories = async (req, res) => {
  try {
    // Check MongoDB connection with timeout
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await withTimeout(connectToDatabase(), 5000); // 5 second timeout for connection
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

    // Filter by active status if specified
    if (active !== undefined && active !== 'all' && active !== '') {
      // If active is explicitly 'true' or 'false', filter by it
      if (active === 'true' || active === true) {
        filter.isActive = true;
      } else if (active === 'false' || active === false) {
        filter.isActive = false;
      }
    } else if (active === 'all' || active === '') {
      // If active is 'all' or empty, don't add isActive filter (show all categories)
      // This allows admin to see all categories including inactive ones
      // No filter applied - will return all categories
    } else {
      // By default (no active parameter), show only active categories for public access
      // But if user is admin (authenticated), show all categories
      const userRole = req.user?.role;
      if (userRole !== 'admin') {
        filter.isActive = true;
      }
      // Admin users can see all categories by default if no filter specified
    }

    // Execute query with timeout
    const categoriesQuery = Category.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .maxTimeMS(10000); // 10 second query timeout

    const categories = await withTimeout(categoriesQuery, 12000);

    // Get venue count for each category (if category is linked to venues) with timeout
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const venueCountQuery = Venue.countDocuments({ 
          categoryId: category._id,
          status: 'approved'
        }).maxTimeMS(5000); // 5 second timeout per count
        
        const venueCount = await withTimeout(venueCountQuery, 7000);
        return {
          ...category.toObject(),
          venueCount
        };
      })
    );

    res.json({
      success: true,
      count: categoriesWithCount.length,
      categories: categoriesWithCount
    });
  } catch (error) {
    console.error('Get categories error:', error);
    if (error.message === 'Operation timed out') {
      return res.status(504).json({ 
        error: 'Request timeout',
        hint: 'Database query took too long. Please try again.'
      });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single category by ID
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check MongoDB connection with timeout
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await withTimeout(connectToDatabase(), 5000); // 5 second timeout for connection
      } catch (dbError) {
        console.error('Database connection error:', dbError.message);
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    const categoryQuery = Category.findById(id).maxTimeMS(10000);
    const category = await withTimeout(categoryQuery, 12000);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Get venue count with timeout
    const venueCountQuery = Venue.countDocuments({ 
      categoryId: category._id,
      status: 'approved'
    }).maxTimeMS(5000);
    
    const venueCount = await withTimeout(venueCountQuery, 7000);

    res.json({
      success: true,
      category: {
        ...category.toObject(),
        venueCount
      }
    });
  } catch (error) {
    console.error('Get category by ID error:', error);
    if (error.message === 'Operation timed out') {
      return res.status(504).json({ 
        error: 'Request timeout',
        hint: 'Database query took too long. Please try again.'
      });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid category ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create category (admin only)
export const createCategory = async (req, res) => {
  try {
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create categories' });
    }

    const { name, description, icon, image, isActive, sortOrder } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Check MongoDB connection with timeout
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await withTimeout(connectToDatabase(), 5000); // 5 second timeout for connection
      } catch (dbError) {
        console.error('Database connection error:', dbError.message);
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    // Check if category already exists with timeout
    const existingCategoryQuery = Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    }).maxTimeMS(5000);
    
    const existingCategory = await withTimeout(existingCategoryQuery, 7000);

    if (existingCategory) {
      return res.status(409).json({ error: 'Category with this name already exists' });
    }

    // Handle image upload - priority: file upload > body URL
    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/categories/${req.file.filename}`;
    } else if (image) {
      // Validate and process network image URL
      imagePath = validateAndProcessImageUrl(image);
      if (image && !imagePath) {
        return res.status(400).json({ 
          error: 'Invalid image URL. Please provide a valid image URL (http/https) or upload a file.' 
        });
      }
    }

    const category = new Category({
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
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    console.error('Create category error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Category with this name already exists' });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update category (admin only)
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update categories' });
    }

    const { name, description, icon, image, isActive, sortOrder } = req.body;

    // Check MongoDB connection with timeout
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await withTimeout(connectToDatabase(), 5000); // 5 second timeout for connection
      } catch (dbError) {
        console.error('Database connection error:', dbError.message);
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    const categoryQuery = Category.findById(id).maxTimeMS(10000);
    const category = await withTimeout(categoryQuery, 12000);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if name is being changed and if new name already exists
    if (name && name.trim() !== category.name) {
      const existingCategoryQuery = Category.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: id }
      }).maxTimeMS(5000);
      
      const existingCategory = await withTimeout(existingCategoryQuery, 7000);

      if (existingCategory) {
        return res.status(409).json({ error: 'Category with this name already exists' });
      }
      category.name = name.trim();
    }

    // Handle image update
    // Support image update via file upload
    if (req.file) {
      // Delete old image file if exists
      if (category.image) {
        deleteCategoryImageFile(category.image);
      }
      category.image = `/uploads/categories/${req.file.filename}`;
    }
    // Support image update via body (URL or null to remove)
    else if (image !== undefined) {
      if (image === null || image === '') {
        // Remove image
        if (category.image) {
          deleteCategoryImageFile(category.image);
        }
        category.image = '';
      } else if (image !== category.image) {
        // Validate network image URL
        const validatedUrl = validateAndProcessImageUrl(image);
        if (!validatedUrl) {
          return res.status(400).json({ 
            error: 'Invalid image URL. Please provide a valid image URL (http/https) or upload a file.' 
          });
        }
        
        // Update with new URL, delete old file if it was a local file
        if (category.image && !category.image.includes('http')) {
          deleteCategoryImageFile(category.image);
        }
        category.image = validatedUrl;
      }
    }

    // Update fields if provided
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (isActive !== undefined) category.isActive = isActive;
    if (sortOrder !== undefined) category.sortOrder = sortOrder;

    const savePromise = category.save();
    await withTimeout(savePromise, 10000);

    res.json({
      success: true,
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    console.error('Update category error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    if (error.code === 11000) {
      return res.status(409).json({ error: 'Category with this name already exists' });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete category (admin only)
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete categories' });
    }

    // Check MongoDB connection with timeout
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await withTimeout(connectToDatabase(), 5000); // 5 second timeout for connection
      } catch (dbError) {
        console.error('Database connection error:', dbError.message);
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    const categoryQuery = Category.findById(id).maxTimeMS(10000);
    const category = await withTimeout(categoryQuery, 12000);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category is being used by any venues with timeout
    const venuesCountQuery = Venue.countDocuments({ categoryId: id }).maxTimeMS(5000);
    const venuesUsingCategory = await withTimeout(venuesCountQuery, 7000);

    if (venuesUsingCategory > 0) {
      return res.status(400).json({ 
        error: `Cannot delete category. It is being used by ${venuesUsingCategory} venue(s). Please remove or update venues first.` 
      });
    }

    // Delete category image file if exists
    if (category.image) {
      deleteCategoryImageFile(category.image);
    }

    const deletePromise = Category.findByIdAndDelete(id);
    await withTimeout(deletePromise, 10000);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid category ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};




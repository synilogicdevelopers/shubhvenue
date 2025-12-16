import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Menu from '../models/Menu.js';
import Venue from '../models/Venue.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to delete menu image file
const deleteMenuImageFile = (imagePath) => {
  if (!imagePath) return;
  
  try {
    // Remove /uploads/menus/ prefix to get filename
    const filename = imagePath.replace('/uploads/menus/', '');
    if (filename && !filename.includes('http')) {
      // Only delete local files, not URLs
      const filePath = path.join(__dirname, '../../uploads/menus', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old menu image: ${filePath}`);
      }
    }
  } catch (error) {
    console.error(`Error deleting menu image file ${imagePath}:`, error.message);
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

// Get all menus (public) - returns main menus with their submenus
export const getMenus = async (req, res) => {
  try {
    // Check MongoDB connection with timeout
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

    const { active, parentMenuId } = req.query;
    let filter = {};

    // Filter by parent menu (null means main menu, otherwise submenu)
    if (parentMenuId !== undefined) {
      if (parentMenuId === null || parentMenuId === 'null' || parentMenuId === '') {
        filter.parentMenuId = null; // Get main menus only
      } else {
        filter.parentMenuId = parentMenuId; // Get submenus of a specific menu
      }
    } else {
      // By default, get main menus only (parentMenuId is null)
      filter.parentMenuId = null;
    }

    // Filter by active status if specified
    if (active !== undefined && active !== 'all' && active !== '') {
      if (active === 'true' || active === true) {
        filter.isActive = true;
      } else if (active === 'false' || active === false) {
        filter.isActive = false;
      }
    } else if (active === 'all' || active === '') {
      // Show all menus
    } else {
      // By default, show only active menus for public access
      const userRole = req.user?.role;
      if (userRole !== 'admin') {
        filter.isActive = true;
      }
    }

    // Execute query with timeout
    const menusQuery = Menu.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .maxTimeMS(10000);

    const menus = await withTimeout(menusQuery, 12000);

    // Get submenus and venue count for each menu
    const menusWithDetails = await Promise.all(
      menus.map(async (menu) => {
        // Get submenus for this menu
        const submenusQuery = Menu.find({ 
          parentMenuId: menu._id,
          isActive: filter.isActive !== undefined ? filter.isActive : (req.user?.role !== 'admin' ? true : undefined)
        })
          .sort({ sortOrder: 1, createdAt: -1 })
          .maxTimeMS(5000);
        
        const submenus = await withTimeout(submenusQuery, 7000);

        // Get venue count for this menu (venues with menuId or subMenuId matching this menu)
        const venueCountQuery = Venue.countDocuments({ 
          $or: [
            { menuId: menu._id },
            { subMenuId: menu._id }
          ],
          status: 'approved'
        }).maxTimeMS(5000);
        
        const venueCount = await withTimeout(venueCountQuery, 7000);

        // Get venue count for each submenu
        const submenusWithCount = await Promise.all(
          submenus.map(async (submenu) => {
            const submenuVenueCountQuery = Venue.countDocuments({ 
              subMenuId: submenu._id,
              status: 'approved'
            }).maxTimeMS(5000);
            
            const submenuVenueCount = await withTimeout(submenuVenueCountQuery, 7000);
            return {
              ...submenu.toObject(),
              venueCount: submenuVenueCount
            };
          })
        );

        return {
          ...menu.toObject(),
          venueCount,
          submenus: submenusWithCount
        };
      })
    );

    res.json({
      success: true,
      count: menusWithDetails.length,
      menus: menusWithDetails
    });
  } catch (error) {
    console.error('Get menus error:', error);
    if (error.message === 'Operation timed out') {
      return res.status(504).json({ 
        error: 'Request timeout',
        hint: 'Database query took too long. Please try again.'
      });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single menu by ID
export const getMenuById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check MongoDB connection with timeout
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

    const menuQuery = Menu.findById(id).maxTimeMS(10000);
    const menu = await withTimeout(menuQuery, 12000);

    if (!menu) {
      return res.status(404).json({ error: 'Menu not found' });
    }

    // Get submenus if this is a main menu
    let submenus = [];
    if (!menu.parentMenuId) {
      const submenusQuery = Menu.find({ 
        parentMenuId: menu._id,
        isActive: true
      })
        .sort({ sortOrder: 1, createdAt: -1 })
        .maxTimeMS(5000);
      
      submenus = await withTimeout(submenusQuery, 7000);
    }

    // Get venue count
    const venueCountQuery = Venue.countDocuments({ 
      $or: [
        { menuId: menu._id },
        { subMenuId: menu._id }
      ],
      status: 'approved'
    }).maxTimeMS(5000);
    
    const venueCount = await withTimeout(venueCountQuery, 7000);

    res.json({
      success: true,
      menu: {
        ...menu.toObject(),
        venueCount,
        submenus: submenus.map(s => s.toObject())
      }
    });
  } catch (error) {
    console.error('Get menu by ID error:', error);
    if (error.message === 'Operation timed out') {
      return res.status(504).json({ 
        error: 'Request timeout',
        hint: 'Database query took too long. Please try again.'
      });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid menu ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create menu (admin only)
export const createMenu = async (req, res) => {
  try {
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create menus' });
    }

    const { name, description, icon, image, parentMenuId, isActive, sortOrder } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({ error: 'Menu name is required' });
    }

    // Check MongoDB connection with timeout
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

    // Validate parentMenuId if provided
    if (parentMenuId && parentMenuId !== 'null' && parentMenuId !== '') {
      const parentMenuQuery = Menu.findById(parentMenuId).maxTimeMS(5000);
      const parentMenu = await withTimeout(parentMenuQuery, 7000);
      
      if (!parentMenu) {
        return res.status(400).json({ error: 'Invalid parent menu ID' });
      }
      
      // Prevent nested submenus (submenu cannot have submenus)
      if (parentMenu.parentMenuId) {
        return res.status(400).json({ error: 'Cannot create submenu of a submenu. Only main menus can have submenus.' });
      }
    }

    // Check if menu already exists with timeout
    const existingMenuQuery = Menu.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      parentMenuId: parentMenuId || null
    }).maxTimeMS(5000);
    
    const existingMenu = await withTimeout(existingMenuQuery, 7000);

    if (existingMenu) {
      return res.status(409).json({ error: 'Menu with this name already exists' });
    }

    // Handle image upload - priority: file upload > body URL
    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/menus/${req.file.filename}`;
    } else if (image) {
      // Validate and process network image URL
      imagePath = validateAndProcessImageUrl(image);
      if (image && !imagePath) {
        return res.status(400).json({ 
          error: 'Invalid image URL. Please provide a valid image URL (http/https) or upload a file.' 
        });
      }
    }

    const menu = new Menu({
      name: name.trim(),
      description: description || '',
      icon: icon || '',
      image: imagePath || '',
      parentMenuId: parentMenuId && parentMenuId !== 'null' && parentMenuId !== '' ? parentMenuId : null,
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder || 0
    });

    const savePromise = menu.save();
    await withTimeout(savePromise, 10000);

    res.status(201).json({
      success: true,
      message: 'Menu created successfully',
      menu
    });
  } catch (error) {
    console.error('Create menu error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Menu with this name already exists' });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update menu (admin only)
export const updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update menus' });
    }

    const { name, description, icon, image, parentMenuId, isActive, sortOrder } = req.body;

    // Check MongoDB connection with timeout
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

    const menuQuery = Menu.findById(id).maxTimeMS(10000);
    const menu = await withTimeout(menuQuery, 12000);

    if (!menu) {
      return res.status(404).json({ error: 'Menu not found' });
    }

    // Validate parentMenuId if being changed
    if (parentMenuId !== undefined) {
      const newParentMenuId = parentMenuId && parentMenuId !== 'null' && parentMenuId !== '' ? parentMenuId : null;
      
      if (newParentMenuId) {
        // Check if parent menu exists
        const parentMenuQuery = Menu.findById(newParentMenuId).maxTimeMS(5000);
        const parentMenu = await withTimeout(parentMenuQuery, 7000);
        
        if (!parentMenu) {
          return res.status(400).json({ error: 'Invalid parent menu ID' });
        }
        
        // Prevent nested submenus
        if (parentMenu.parentMenuId) {
          return res.status(400).json({ error: 'Cannot set submenu as parent. Only main menus can have submenus.' });
        }
        
        // Prevent setting itself as parent
        if (newParentMenuId.toString() === id) {
          return res.status(400).json({ error: 'Menu cannot be its own parent' });
        }
      }
      
      menu.parentMenuId = newParentMenuId;
    }

    // Check if name is being changed and if new name already exists
    if (name && name.trim() !== menu.name) {
      const existingMenuQuery = Menu.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        parentMenuId: menu.parentMenuId,
        _id: { $ne: id }
      }).maxTimeMS(5000);
      
      const existingMenu = await withTimeout(existingMenuQuery, 7000);

      if (existingMenu) {
        return res.status(409).json({ error: 'Menu with this name already exists' });
      }
      menu.name = name.trim();
    }

    // Handle image update
    if (req.file) {
      // Delete old image file if exists
      if (menu.image) {
        deleteMenuImageFile(menu.image);
      }
      menu.image = `/uploads/menus/${req.file.filename}`;
    }
    // Support image update via body (URL or null to remove)
    else if (image !== undefined) {
      if (image === null || image === '') {
        // Remove image
        if (menu.image) {
          deleteMenuImageFile(menu.image);
        }
        menu.image = '';
      } else if (image !== menu.image) {
        // Validate network image URL
        const validatedUrl = validateAndProcessImageUrl(image);
        if (!validatedUrl) {
          return res.status(400).json({ 
            error: 'Invalid image URL. Please provide a valid image URL (http/https) or upload a file.' 
          });
        }
        
        // Update with new URL, delete old file if it was a local file
        if (menu.image && !menu.image.includes('http')) {
          deleteMenuImageFile(menu.image);
        }
        menu.image = validatedUrl;
      }
    }

    // Update fields if provided
    if (description !== undefined) menu.description = description;
    if (icon !== undefined) menu.icon = icon;
    if (isActive !== undefined) menu.isActive = isActive;
    if (sortOrder !== undefined) menu.sortOrder = sortOrder;

    const savePromise = menu.save();
    await withTimeout(savePromise, 10000);

    res.json({
      success: true,
      message: 'Menu updated successfully',
      menu
    });
  } catch (error) {
    console.error('Update menu error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid menu ID' });
    }

    if (error.code === 11000) {
      return res.status(409).json({ error: 'Menu with this name already exists' });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete menu (admin only)
export const deleteMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete menus' });
    }

    // Check MongoDB connection with timeout
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

    const menuQuery = Menu.findById(id).maxTimeMS(10000);
    const menu = await withTimeout(menuQuery, 12000);

    if (!menu) {
      return res.status(404).json({ error: 'Menu not found' });
    }

    // Get all submenus of this menu
    const submenusQuery = Menu.find({ parentMenuId: id }).maxTimeMS(5000);
    const submenus = await withTimeout(submenusQuery, 7000);
    const submenusCount = submenus.length;

    // Check if menu or any of its submenus is being used by any venues
    const menuVenuesQuery = Venue.countDocuments({ 
      menuId: id
    }).maxTimeMS(5000);
    const venuesUsingMenu = await withTimeout(menuVenuesQuery, 7000);

    // Check submenus for venue usage
    let venuesUsingSubmenus = 0;
    if (submenus.length > 0) {
      const submenuIds = submenus.map(s => s._id);
      const submenuVenuesQuery = Venue.countDocuments({ 
        subMenuId: { $in: submenuIds }
      }).maxTimeMS(5000);
      venuesUsingSubmenus = await withTimeout(submenuVenuesQuery, 7000);
    }

    if (venuesUsingMenu > 0 || venuesUsingSubmenus > 0) {
      return res.status(400).json({ 
        error: `Cannot delete menu. It is being used by ${venuesUsingMenu + venuesUsingSubmenus} venue(s). Please remove or update venues first.` 
      });
    }

    // Delete all submenus first (including their images)
    let deletedSubmenusCount = 0;
    if (submenus.length > 0) {
      for (const submenu of submenus) {
        // Delete submenu image if exists
        if (submenu.image) {
          deleteMenuImageFile(submenu.image);
        }
        // Delete submenu
        const deleteSubmenuPromise = Menu.findByIdAndDelete(submenu._id);
        await withTimeout(deleteSubmenuPromise, 5000);
        deletedSubmenusCount++;
      }
    }

    // Delete main menu image file if exists
    if (menu.image) {
      deleteMenuImageFile(menu.image);
    }

    // Delete main menu
    const deletePromise = Menu.findByIdAndDelete(id);
    await withTimeout(deletePromise, 10000);

    // Success message
    let message = 'Menu deleted successfully';
    if (deletedSubmenusCount > 0) {
      message = `Menu and ${deletedSubmenusCount} submenu(s) deleted successfully`;
    }

    res.json({
      success: true,
      message: message,
      deletedSubmenus: deletedSubmenusCount
    });
  } catch (error) {
    console.error('Delete menu error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid menu ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};


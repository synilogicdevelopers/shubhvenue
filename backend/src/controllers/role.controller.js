import Role from '../models/Role.js';
import mongoose from 'mongoose';
import { ALL_PERMISSIONS, ROLE_TEMPLATES } from '../data/permissions.js';

// Create a new role
export const createRole = async (req, res) => {
  try {
    const { name, permissions, description } = req.body;

    // Validation
    if (!name || !permissions) {
      return res.status(400).json({ error: 'Name and permissions are required' });
    }

    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({ error: 'Permissions must be a non-empty array' });
    }

    // Check if role with same name already exists
    const existingRole = await Role.findOne({ name: name.trim() });
    if (existingRole) {
      return res.status(409).json({ error: 'Role with this name already exists' });
    }

    // Create role
    const role = new Role({
      name: name.trim(),
      permissions: permissions.map(p => String(p).trim()).filter(Boolean),
      description: description ? description.trim() : undefined
    });

    await role.save();

    res.status(201).json({
      message: 'Role created successfully',
      role
    });
  } catch (error) {
    console.error('Create role error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Role with this name already exists' });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all roles
export const getRoles = async (req, res) => {
  try {
    const { isActive } = req.query;
    
    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const roles = await Role.find(query).sort({ createdAt: -1 });

    res.json({
      roles
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get role by ID
export const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid role ID' });
    }

    const role = await Role.findById(id);

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json({ role });
  } catch (error) {
    console.error('Get role by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update role
export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, permissions, description, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid role ID' });
    }

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // If name is being updated, check for duplicates
    if (name && name.trim() !== role.name) {
      const existingRole = await Role.findOne({ name: name.trim(), _id: { $ne: id } });
      if (existingRole) {
        return res.status(409).json({ error: 'Role with this name already exists' });
      }
      role.name = name.trim();
    }

    if (permissions !== undefined) {
      if (!Array.isArray(permissions) || permissions.length === 0) {
        return res.status(400).json({ error: 'Permissions must be a non-empty array' });
      }
      role.permissions = permissions.map(p => String(p).trim()).filter(Boolean);
    }

    if (description !== undefined) {
      role.description = description ? description.trim() : undefined;
    }

    if (isActive !== undefined) {
      role.isActive = isActive;
    }

    await role.save();

    res.json({
      message: 'Role updated successfully',
      role
    });
  } catch (error) {
    console.error('Update role error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Role with this name already exists' });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete role
export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid role ID' });
    }

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Check if any staff is using this role
    const Staff = (await import('../models/Staff.js')).default;
    const staffCount = await Staff.countDocuments({ role: id, isDeleted: false });
    
    if (staffCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete role. ${staffCount} staff member(s) are using this role. Please reassign them first.` 
      });
    }

    await Role.findByIdAndDelete(id);

    res.json({
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all available permissions
export const getAvailablePermissions = async (req, res) => {
  try {
    // Group permissions by category for better UI
    const permissionsByCategory = {
      dashboard: ['view_dashboard'],
      users: ['view_users', 'create_users', 'edit_users', 'delete_users'],
      vendors: ['view_vendors', 'create_vendors', 'edit_vendors', 'approve_vendors', 'reject_vendors', 'delete_vendors'],
      venues: ['view_venues', 'create_venues', 'edit_venues', 'approve_venues', 'reject_venues', 'delete_venues'],
      bookings: ['view_bookings', 'edit_bookings', 'approve_bookings', 'reject_bookings'],
      leads: ['view_leads', 'edit_leads', 'convert_leads'],
      payouts: ['view_payouts', 'edit_payouts'],
      analytics: ['view_analytics'],
      settings: ['view_settings', 'edit_settings'],
      banners: ['view_banners', 'create_banners', 'edit_banners', 'delete_banners'],
      videos: ['view_videos', 'create_videos', 'edit_videos', 'delete_videos'],
      testimonials: ['view_testimonials', 'create_testimonials', 'edit_testimonials', 'delete_testimonials'],
      faqs: ['view_faqs', 'create_faqs', 'edit_faqs', 'delete_faqs'],
      company: ['view_company', 'edit_company'],
      legal_pages: ['view_legal_pages', 'edit_legal_pages'],
      contacts: ['view_contacts', 'edit_contacts', 'delete_contacts'],
      reviews: ['view_reviews', 'edit_reviews', 'delete_reviews', 'approve_reviews', 'reject_reviews'],
      review_replies: ['view_review_replies', 'create_review_replies', 'edit_review_replies', 'delete_review_replies'],
      categories: ['view_categories', 'create_categories', 'edit_categories', 'delete_categories'],
      menus: ['view_menus', 'create_menus', 'edit_menus', 'delete_menus'],
      roles: ['view_roles', 'create_roles', 'edit_roles', 'delete_roles'],
      staff: ['view_staff', 'create_staff', 'edit_staff', 'delete_staff'],
    };

    res.json({
      allPermissions: ALL_PERMISSIONS,
      permissionsByCategory,
      roleTemplates: ROLE_TEMPLATES
    });
  } catch (error) {
    console.error('Get available permissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


import VendorRole from '../models/VendorRole.js';
import mongoose from 'mongoose';
import { VENDOR_ALL_PERMISSIONS, VENDOR_ROLE_TEMPLATES } from '../data/vendor-permissions.js';

// Create a new vendor role
export const createVendorRole = async (req, res) => {
  try {
    const { name, permissions, description } = req.body;
    const vendorId = req.user?.userId;

    if (!vendorId || req.user?.role !== 'vendor') {
      return res.status(403).json({ error: 'Access denied. Vendor access required.' });
    }

    // Validation
    if (!name || !permissions) {
      return res.status(400).json({ error: 'Name and permissions are required' });
    }

    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({ error: 'Permissions must be a non-empty array' });
    }

    // Check if role with same name already exists for this vendor
    const existingRole = await VendorRole.findOne({ 
      vendorId: vendorId,
      name: name.trim() 
    });
    if (existingRole) {
      return res.status(409).json({ error: 'Role with this name already exists' });
    }

    // Create role
    const role = new VendorRole({
      name: name.trim(),
      permissions: permissions.map(p => String(p).trim()).filter(Boolean),
      description: description ? description.trim() : undefined,
      vendorId: vendorId
    });

    await role.save();

    res.status(201).json({
      message: 'Role created successfully',
      role
    });
  } catch (error) {
    console.error('Create vendor role error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Role with this name already exists' });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all vendor roles
export const getVendorRoles = async (req, res) => {
  try {
    const vendorId = req.user?.userId;

    if (!vendorId || req.user?.role !== 'vendor') {
      return res.status(403).json({ error: 'Access denied. Vendor access required.' });
    }

    const { isActive } = req.query;
    
    const query = { vendorId: vendorId };
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const roles = await VendorRole.find(query).sort({ createdAt: -1 });

    res.json({
      roles
    });
  } catch (error) {
    console.error('Get vendor roles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get vendor role by ID
export const getVendorRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user?.userId;

    if (!vendorId || req.user?.role !== 'vendor') {
      return res.status(403).json({ error: 'Access denied. Vendor access required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid role ID' });
    }

    const role = await VendorRole.findOne({ _id: id, vendorId: vendorId });

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json({ role });
  } catch (error) {
    console.error('Get vendor role by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update vendor role
export const updateVendorRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, permissions, description, isActive } = req.body;
    const vendorId = req.user?.userId;

    if (!vendorId || req.user?.role !== 'vendor') {
      return res.status(403).json({ error: 'Access denied. Vendor access required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid role ID' });
    }

    const role = await VendorRole.findOne({ _id: id, vendorId: vendorId });
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // If name is being updated, check for duplicates
    if (name && name.trim() !== role.name) {
      const existingRole = await VendorRole.findOne({ 
        vendorId: vendorId,
        name: name.trim(), 
        _id: { $ne: id } 
      });
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
    console.error('Update vendor role error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Role with this name already exists' });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete vendor role
export const deleteVendorRole = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user?.userId;

    if (!vendorId || req.user?.role !== 'vendor') {
      return res.status(403).json({ error: 'Access denied. Vendor access required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid role ID' });
    }

    const role = await VendorRole.findOne({ _id: id, vendorId: vendorId });
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Check if any staff is using this role
    const VendorStaff = (await import('../models/VendorStaff.js')).default;
    const staffCount = await VendorStaff.countDocuments({ 
      vendorId: vendorId,
      role: id, 
      isDeleted: false 
    });
    
    if (staffCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete role. ${staffCount} staff member(s) are using this role. Please reassign them first.` 
      });
    }

    await VendorRole.findByIdAndDelete(id);

    res.json({
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Delete vendor role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all available vendor permissions
export const getAvailableVendorPermissions = async (req, res) => {
  try {
    const vendorId = req.user?.userId;

    if (!vendorId || req.user?.role !== 'vendor') {
      return res.status(403).json({ error: 'Access denied. Vendor access required.' });
    }

    // Group permissions by category for better UI
    const permissionsByCategory = {
      dashboard: ['vendor_view_dashboard'],
      calendar: ['vendor_view_calendar', 'vendor_manage_calendar'],
      venues: ['vendor_view_venues', 'vendor_create_venues', 'vendor_edit_venues', 'vendor_delete_venues', 'vendor_toggle_venues'],
      bookings: ['vendor_view_bookings', 'vendor_create_bookings', 'vendor_edit_bookings', 'vendor_approve_bookings', 'vendor_reject_bookings', 'vendor_cancel_bookings'],
      payouts: ['vendor_view_payouts', 'vendor_edit_payouts', 'vendor_request_payouts'],
      ledger: ['vendor_view_ledger', 'vendor_create_ledger', 'vendor_edit_ledger', 'vendor_delete_ledger'],
      blocked_dates: ['vendor_view_blocked_dates', 'vendor_create_blocked_dates', 'vendor_edit_blocked_dates', 'vendor_delete_blocked_dates'],
      reviews: ['vendor_view_reviews', 'vendor_reply_reviews', 'vendor_edit_reviews', 'vendor_delete_reviews'],
      profile: ['vendor_view_profile', 'vendor_edit_profile', 'vendor_change_password'],
    };

    res.json({
      allPermissions: VENDOR_ALL_PERMISSIONS,
      permissionsByCategory,
      roleTemplates: VENDOR_ROLE_TEMPLATES
    });
  } catch (error) {
    console.error('Get available vendor permissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


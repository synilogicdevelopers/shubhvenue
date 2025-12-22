import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Staff from '../models/Staff.js';
import Role from '../models/Role.js';

// Staff Login
export const staffLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      try {
        const { connectToDatabase } = await import('../config/db.js');
        await connectToDatabase();
      } catch (dbError) {
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          hint: dbError.message || 'Please check MongoDB connection settings and restart backend server'
        });
      }
    }

    // Find staff
    const normalizedEmail = email.toLowerCase().trim();
    const staff = await Staff.findOne({ email: normalizedEmail }).populate('role');
    
    if (!staff) {
      console.log(`Staff login attempt failed: Staff not found for email: ${normalizedEmail}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if staff is deleted
    if (staff.isDeleted) {
      console.log(`Staff login attempt failed: Staff account deleted for email: ${normalizedEmail}`);
      return res.status(403).json({ error: 'Your account has been deleted. Please contact support.' });
    }

    // Check if staff is active
    if (!staff.isActive) {
      console.log(`Staff login attempt failed: Staff account inactive for email: ${normalizedEmail}`);
      return res.status(403).json({ error: 'Your account is inactive. Please contact support.' });
    }

    // Check if role exists and is active
    if (!staff.role || !staff.role.isActive) {
      console.log(`Staff login attempt failed: Role inactive for email: ${normalizedEmail}`);
      return res.status(403).json({ error: 'Your role is inactive. Please contact support.' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, staff.password);
    if (!isPasswordValid) {
      console.log(`Staff login attempt failed: Invalid password for email: ${normalizedEmail}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token with permissions
    const permissions = staff.role.permissions || [];
    console.log('Staff login - Permissions:', {
      staffEmail: staff.email,
      roleName: staff.role.name,
      permissions: permissions,
      permissionsCount: permissions.length
    });
    
    const token = jwt.sign(
      { 
        userId: staff._id, 
        email: staff.email, 
        role: 'staff',
        roleId: staff.role._id,
        permissions: permissions
      },
      process.env.JWT_SECRET || 'change_me',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        location: staff.location,
        gender: staff.gender,
        img: staff.img,
        role: {
          id: staff.role._id,
          name: staff.role.name,
          permissions: staff.role.permissions
        }
      }
    });
  } catch (error) {
    console.error('Staff login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get staff profile
export const getStaffProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const staff = await Staff.findById(userId).populate('role').select('-password');
    
    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    if (staff.isDeleted) {
      return res.status(403).json({ error: 'Your account has been deleted. Please contact support.' });
    }

    res.json({
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        location: staff.location,
        gender: staff.gender,
        img: staff.img,
        role: {
          id: staff.role._id,
          name: staff.role.name,
          permissions: staff.role.permissions
        },
        isActive: staff.isActive,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt
      }
    });
  } catch (error) {
    console.error('Get staff profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create staff (Admin only)
export const createStaff = async (req, res) => {
  try {
    const { name, phone, email, password, location, gender, role } = req.body;

    // Validation
    if (!name || !phone || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, phone, email, password, and role are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Validate role ID
    if (!mongoose.Types.ObjectId.isValid(role)) {
      return res.status(400).json({ error: 'Invalid role ID' });
    }

    // Check if role exists
    const roleDoc = await Role.findById(role);
    if (!roleDoc) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (!roleDoc.isActive) {
      return res.status(400).json({ error: 'Cannot assign inactive role' });
    }

    // Check if staff with same email already exists
    const existingStaff = await Staff.findOne({ email: email.toLowerCase().trim() });
    if (existingStaff) {
      return res.status(409).json({ error: 'Staff with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle image upload
    let imgPath = null;
    if (req.file) {
      imgPath = `/uploads/staff/${req.file.filename}`;
    }

    // Create staff
    const staff = new Staff({
      name: name.trim(),
      phone: phone.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      location: location ? location.trim() : undefined,
      gender: gender || undefined,
      img: imgPath,
      role: role
    });

    await staff.save();
    await staff.populate('role');

    res.status(201).json({
      message: 'Staff created successfully',
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        location: staff.location,
        gender: staff.gender,
        img: staff.img,
        role: {
          id: staff.role._id,
          name: staff.role.name,
          permissions: staff.role.permissions
        }
      }
    });
  } catch (error) {
    console.error('Create staff error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Staff with this email already exists' });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all staff (Admin only)
export const getStaff = async (req, res) => {
  try {
    const { isActive, role } = req.query;
    
    const query = { isDeleted: false };
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    if (role && mongoose.Types.ObjectId.isValid(role)) {
      query.role = role;
    }

    const staff = await Staff.find(query)
      .populate('role', 'name permissions')
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      staff
    });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get staff by ID (Admin only)
export const getStaffById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid staff ID' });
    }

    const staff = await Staff.findById(id).populate('role').select('-password');

    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    res.json({ staff });
  } catch (error) {
    console.error('Get staff by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update staff (Admin only)
export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, password, location, gender, role, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid staff ID' });
    }

    const staff = await Staff.findById(id);
    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    // Validate email format if email is being updated
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Check if email is already taken by another staff
      const existingStaff = await Staff.findOne({ 
        email: email.toLowerCase().trim(),
        _id: { $ne: id }
      });
      
      if (existingStaff) {
        return res.status(409).json({ error: 'Email already exists' });
      }
    }

    // Validate role if being updated
    if (role) {
      if (!mongoose.Types.ObjectId.isValid(role)) {
        return res.status(400).json({ error: 'Invalid role ID' });
      }

      const roleDoc = await Role.findById(role);
      if (!roleDoc) {
        return res.status(404).json({ error: 'Role not found' });
      }

      if (!roleDoc.isActive) {
        return res.status(400).json({ error: 'Cannot assign inactive role' });
      }
    }

    // Update fields
    if (name !== undefined) staff.name = name.trim();
    if (phone !== undefined) staff.phone = phone.trim();
    if (email !== undefined) staff.email = email.toLowerCase().trim();
    if (location !== undefined) staff.location = location ? location.trim() : undefined;
    if (gender !== undefined) staff.gender = gender || undefined;
    if (role !== undefined) staff.role = role;
    if (isActive !== undefined) staff.isActive = isActive;

    // Handle password update
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }
      staff.password = await bcrypt.hash(password, 10);
    }

    // Handle image upload
    if (req.file) {
      // Delete old image if exists
      if (staff.img && !staff.img.startsWith('http')) {
        const fs = await import('fs');
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const oldImagePath = path.join(__dirname, '../../', staff.img);
        try {
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        } catch (e) {
          // Non-fatal
        }
      }
      staff.img = `/uploads/staff/${req.file.filename}`;
    }

    await staff.save();
    await staff.populate('role');

    res.json({
      message: 'Staff updated successfully',
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        location: staff.location,
        gender: staff.gender,
        img: staff.img,
        role: {
          id: staff.role._id,
          name: staff.role.name,
          permissions: staff.role.permissions
        },
        isActive: staff.isActive
      }
    });
  } catch (error) {
    console.error('Update staff error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete staff (Admin only) - Soft delete
export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid staff ID' });
    }

    const staff = await Staff.findById(id);
    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    // Soft delete
    staff.isDeleted = true;
    staff.isActive = false;
    await staff.save();

    res.json({
      message: 'Staff deleted successfully'
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


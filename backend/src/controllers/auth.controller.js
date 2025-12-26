import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';

// Register new user
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, role = 'customer', vendorCategory } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
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

    // Validate role
    const validRoles = ['customer', 'vendor', 'affiliate', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be one of: customer, vendor, affiliate, admin' });
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

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      // Check if existing user has a different role
      if (existingUser.role !== role) {
        return res.status(409).json({ 
          error: `This email is already registered as a ${existingUser.role}. You cannot register with a different role.` 
        });
      }
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Validate vendor category if role is vendor
    if (role === 'vendor' && vendorCategory) {
      if (!mongoose.Types.ObjectId.isValid(vendorCategory)) {
        return res.status(400).json({ error: 'Invalid vendor category ID' });
      }
      
      const VendorCategory = (await import('../models/VendorCategory.js')).default;
      const category = await VendorCategory.findOne({ 
        _id: vendorCategory, 
        isActive: true 
      });
      
      if (!category) {
        return res.status(400).json({ error: 'Invalid or inactive vendor category' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || undefined,
      role,
      // For vendors, set vendorStatus to 'pending' (requires admin approval)
      vendorStatus: role === 'vendor' ? 'pending' : undefined,
      // Set vendor category if provided
      vendorCategory: role === 'vendor' && vendorCategory ? vendorCategory : undefined
    });

    await user.save();
    
    console.log('✅ User registered successfully');
    console.log('   User ID:', user._id);
    console.log('   User Name:', user.name);
    console.log('   User Email:', user.email);
    console.log('   User Role:', user.role);

    // Send welcome emails based on user role
    console.log('📧 Checking user role for email sending...');
    console.log('   Role:', user.role);
    console.log('   Role type:', typeof user.role);
    console.log('   Is vendor?', user.role === 'vendor');
    console.log('   Is customer?', user.role === 'customer');
    
    try {
      if (user.role === 'vendor') {
        console.log('📧 Vendor detected, sending vendor emails...');
        // Vendor registration emails
        const { sendVendorWelcomeEmail, sendVendorRegistrationEmailToAdmin } = await import('../utils/emailService.js');
        
        // Send welcome email to vendor
        const welcomeResult = await sendVendorWelcomeEmail(user);
        if (welcomeResult.success) {
          console.log('✅ Vendor welcome email sent to:', user.email);
        } else {
          console.error('❌ Failed to send vendor welcome email:', welcomeResult.error);
        }
        
        // Send notification email to admin
        const adminResult = await sendVendorRegistrationEmailToAdmin(user);
        if (adminResult.success) {
          console.log('✅ Vendor registration notification sent to admin');
        } else {
          console.error('❌ Failed to send admin notification:', adminResult.error);
        }
      } else if (user.role === 'customer') {
        // Customer welcome email
        console.log('📧 Customer detected, sending customer welcome email...');
        console.log('   Customer Email:', user.email);
        console.log('   Customer Name:', user.name);
        
        try {
          const { sendCustomerWelcomeEmail } = await import('../utils/emailService.js');
          console.log('   Email service imported successfully');
          
          const welcomeResult = await sendCustomerWelcomeEmail(user);
          console.log('   Email function returned:', welcomeResult);
          
          if (welcomeResult && welcomeResult.success) {
            console.log('✅✅✅ Customer welcome email sent successfully to:', user.email);
            console.log('   Message ID:', welcomeResult.messageId);
          } else {
            console.error('❌❌❌ Failed to send customer welcome email to:', user.email);
            console.error('   Result:', welcomeResult);
            console.error('   Error:', welcomeResult?.error || 'Unknown error');
          }
        } catch (emailError) {
          console.error('❌❌❌ Error in customer welcome email:', emailError);
          console.error('   Error message:', emailError.message);
          console.error('   Error stack:', emailError.stack);
        }
      } else {
        console.log('📧 User role is:', user.role, '- No welcome email configured for this role');
      }
    } catch (emailError) {
      console.error('❌❌❌ Error in email sending block:', emailError);
      console.error('   Error message:', emailError.message);
      console.error('   Error stack:', emailError.stack);
      // Don't fail registration if email fails
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'change_me',
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const responseData = {
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        verified: user.verified
      }
    };

    // Include vendorStatus and vendorCategory for vendors
    if (user.role === 'vendor') {
      responseData.user.vendorStatus = user.vendorStatus;
      if (user.vendorCategory) {
        await user.populate('vendorCategory', 'name description');
        responseData.user.vendorCategory = user.vendorCategory;
      }
    }

    res.status(201).json(responseData);
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate key error (MongoDB unique constraint)
    if (error.code === 11000) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Login user
export const login = async (req, res) => {
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

    // Find user (vendor owner or customer)
    const normalizedEmail = email.toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });
    let isVendorStaff = false;
    let vendorStaff = null;
    
    // If user not found in User model, check VendorStaff model
    if (!user) {
      const VendorStaff = (await import('../models/VendorStaff.js')).default;
      vendorStaff = await VendorStaff.findOne({ email: normalizedEmail })
        .populate('role')
        .populate('vendorId');
      
      if (vendorStaff) {
        isVendorStaff = true;
        
        // Check if staff is deleted
        if (vendorStaff.isDeleted) {
          console.log(`Login attempt failed: Vendor staff account deleted for email: ${normalizedEmail}`);
          return res.status(403).json({ error: 'Your account has been deleted. Please contact support.' });
        }

        // Check if staff is active
        if (!vendorStaff.isActive) {
          console.log(`Login attempt failed: Vendor staff account inactive for email: ${normalizedEmail}`);
          return res.status(403).json({ error: 'Your account is inactive. Please contact support.' });
        }

        // Check if role exists and is active
        if (!vendorStaff.role || !vendorStaff.role.isActive) {
          console.log(`Login attempt failed: Vendor staff role inactive for email: ${normalizedEmail}`);
          return res.status(403).json({ error: 'Your role is inactive. Please contact support.' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, vendorStaff.password);
        if (!isPasswordValid) {
          console.log(`Login attempt failed: Invalid password for vendor staff email: ${normalizedEmail}`);
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token for vendor staff
        const permissions = vendorStaff.role.permissions || [];
        console.log('Vendor staff login - Permissions:', {
          staffEmail: vendorStaff.email,
          roleName: vendorStaff.role.name,
          vendorId: vendorStaff.vendorId._id,
          permissionsCount: permissions.length
        });
        
        const token = jwt.sign(
          { 
            userId: vendorStaff._id, 
            email: vendorStaff.email, 
            role: 'vendor_staff',
            vendorId: vendorStaff.vendorId._id,
            roleId: vendorStaff.role._id,
            permissions: permissions
          },
          process.env.JWT_SECRET || 'change_me',
          { expiresIn: '7d' }
        );

        return res.json({
          message: 'Login successful',
          token,
          user: {
            id: vendorStaff._id,
            name: vendorStaff.name,
            email: vendorStaff.email,
            phone: vendorStaff.phone,
            role: 'vendor_staff',
            vendorId: vendorStaff.vendorId._id,
            permissions: permissions
          }
        });
      } else {
      console.log(`Login attempt failed: User not found for email: ${normalizedEmail}`);
      return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    // Regular user (vendor owner or customer) login
    // Check if vendor is deleted (for backward compatibility with soft-deleted accounts)
    if (user.isDeleted) {
      console.log(`Login attempt failed: Vendor account deleted for email: ${normalizedEmail}`);
      return res.status(403).json({ error: 'Your account has been deleted. Please contact support.' });
    }

    // Note: Removed reject check - rejected vendors can still login
    // Rejection only affects venue creation, not login access
    // Note: Removed approval check - vendors can now login immediately after registration
    // Approval is only required for adding venues, not for login

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log(`Login attempt failed: Invalid password for email: ${normalizedEmail}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // For vendors, include all vendor permissions in token
    let permissions = [];
    if (user.role === 'vendor') {
      const { VENDOR_ALL_PERMISSIONS } = await import('../data/vendor-permissions.js');
      permissions = VENDOR_ALL_PERMISSIONS; // Vendor owners have all permissions
      console.log('Vendor login - Permissions:', {
        vendorEmail: user.email,
        permissionsCount: permissions.length
      });
    }

    // Generate JWT token
    const tokenPayload = {
      userId: user._id,
      email: user.email,
      role: user.role
    };

    // Add permissions if vendor
    if (permissions.length > 0) {
      tokenPayload.permissions = permissions;
    }

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'change_me',
      { expiresIn: '7d' }
    );

    const responseData = {
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        verified: user.verified
      }
    };

    // Include vendorStatus for vendors
    if (user.role === 'vendor') {
      responseData.user.vendorStatus = user.vendorStatus;
    }

    // Include permissions in response for vendors
    if (permissions.length > 0) {
      responseData.user.permissions = permissions;
    }

    res.json(responseData);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  try {
    // This will be called with requireAuth middleware
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
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

    // Handle vendor staff profile
    if (userRole === 'vendor_staff') {
      const VendorStaff = (await import('../models/VendorStaff.js')).default;
      const staff = await VendorStaff.findById(userId)
        .populate('role')
        .populate('vendorId')
        .select('-password');
      
      if (!staff) {
        return res.status(404).json({ error: 'Staff not found' });
      }

      if (staff.isDeleted) {
        return res.status(403).json({ error: 'Your account has been deleted. Please contact support.' });
      }

      const permissions = staff.role.permissions || [];
      
      return res.json({
        staff: {
          id: staff._id,
          name: staff.name,
          email: staff.email,
          phone: staff.phone,
          location: staff.location,
          gender: staff.gender,
          img: staff.img,
          vendorId: staff.vendorId._id,
          role: 'vendor_staff',
          permissions: permissions, // Include permissions at top level for easier access
          roleDetails: {
            id: staff.role._id,
            name: staff.role.name,
            permissions: permissions
          },
          isActive: staff.isActive
        }
      });
    }

    // Handle regular user (vendor owner or customer) profile
    const user = await User.findById(userId)
      .select('-password')
      .populate('vendorCategory');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if vendor is deleted (for backward compatibility with soft-deleted accounts)
    if (user.isDeleted) {
      return res.status(403).json({ error: 'Your account has been deleted. Please contact support.' });
    }

    // Note: Removed reject check - rejected vendors can still access profile
    // Rejection only affects venue creation, not profile access
    // Note: Removed approval check - vendors can now access profile immediately after registration
    // Approval is only required for adding venues, not for accessing profile

    // For vendors, include permissions (empty array means all permissions)
    let permissions = [];
    if (user.role === 'vendor') {
      const { VENDOR_ALL_PERMISSIONS } = await import('../data/vendor-permissions.js');
      permissions = VENDOR_ALL_PERMISSIONS; // Vendor owners have all permissions
    }
    
    const responseData = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        verified: user.verified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    };
    
    // Include vendorStatus and vendorCategory for vendors
    if (user.role === 'vendor') {
      responseData.user.vendorStatus = user.vendorStatus;
      if (user.vendorCategory) {
        responseData.user.vendorCategory = {
          _id: user.vendorCategory._id,
          name: user.vendorCategory.name,
          description: user.vendorCategory.description,
          formConfig: user.vendorCategory.formConfig || null
        };
      }
    }
    
    // Include permissions in response for vendors
    if (permissions.length > 0) {
      responseData.user.permissions = permissions;
    }
    
    res.json(responseData);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, email, phone } = req.body;

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

    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate email format if email is being updated
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: userId }
      });
      
      if (existingUser) {
        return res.status(409).json({ error: 'Email already exists' });
      }
    }

    // Update fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email.toLowerCase();
    if (phone !== undefined) updateData.phone = phone;

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        verified: updatedUser.verified,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    // Handle duplicate key error (MongoDB unique constraint)
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
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

    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Google Login (Auto-registers if user doesn't exist - includes FCM token save)
export const googleLogin = async (req, res) => {
  try {
    const { idToken, role = 'customer', fcmToken } = req.body;

    console.log('Google login request received');
    console.log('Role:', role);
    console.log('ID Token length:', idToken?.length || 0);
    console.log('ID Token preview:', idToken ? idToken.substring(0, 50) + '...' : 'Missing');

    if (!idToken) {
      return res.status(400).json({ error: 'Google ID token is required' });
    }

    // Validate role
    const validRoles = ['customer', 'vendor', 'affiliate', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be one of: customer, vendor, affiliate, admin' });
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

    // Verify Google ID token
    // For Firebase Auth tokens, we need to handle different audiences
    let ticket;
    let payload;
    
    // First, decode the token to see what audience it has (without verification)
    let decodedToken;
    try {
      // Decode without verification to check audience
      const tokenParts = idToken.split('.');
      if (tokenParts.length === 3) {
        const payloadBase64 = tokenParts[1];
        // Handle base64 padding
        const paddedPayload = payloadBase64 + '='.repeat((4 - payloadBase64.length % 4) % 4);
        const decodedPayload = Buffer.from(paddedPayload, 'base64').toString('utf-8');
        decodedToken = JSON.parse(decodedPayload);
        console.log('=== Token Decoded ===');
        console.log('Token audience:', decodedToken.aud);
        console.log('Token issuer:', decodedToken.iss);
        console.log('Token email:', decodedToken.email);
        console.log('Token exp:', new Date(decodedToken.exp * 1000).toISOString());
        console.log('Token iat:', new Date(decodedToken.iat * 1000).toISOString());
      }
    } catch (decodeError) {
      console.error('Failed to decode token:', decodeError);
    }
    
    // Try multiple verification strategies
    const verificationStrategies = [];
    
    // Strategy 1: Verify with the token's own audience first (for Firebase tokens)
    // This is the most reliable for Firebase tokens
    if (decodedToken?.aud) {
      verificationStrategies.push({
        name: 'Token audience (Firebase)',
        audience: decodedToken.aud
      });
    }
    
    // Strategy 2: Verify with GOOGLE_CLIENT_ID if set and different from token audience
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== decodedToken?.aud) {
      verificationStrategies.push({
        name: 'GOOGLE_CLIENT_ID',
        audience: process.env.GOOGLE_CLIENT_ID
      });
    }
    
    // Strategy 3: Verify without audience check (most permissive - try last)
    // Note: This might fail for some tokens, but works for standard Google tokens
    verificationStrategies.push({
      name: 'No audience check (permissive)',
      audience: null
    });
    
    let verificationSuccess = false;
    let lastError = null;
    
    console.log('=== Starting Token Verification ===');
    console.log(`Total strategies to try: ${verificationStrategies.length}`);
    
    for (const strategy of verificationStrategies) {
      try {
        console.log(`\n[${verificationStrategies.indexOf(strategy) + 1}/${verificationStrategies.length}] Trying: ${strategy.name}`);
        
        // Create OAuth2Client - don't pass client ID to constructor
        // The client ID/audience is passed to verifyIdToken instead
        const client = new OAuth2Client();
        
        const verifyOptions = { idToken: idToken };
        if (strategy.audience) {
          verifyOptions.audience = strategy.audience;
          console.log(`  ✓ Using audience: ${strategy.audience}`);
        } else {
          console.log(`  ✓ No audience check (permissive mode)`);
        }
        
        console.log(`  → Calling verifyIdToken...`);
        ticket = await client.verifyIdToken(verifyOptions);
        payload = ticket.getPayload();
        
        console.log(`\n✅✅✅ SUCCESS! Token verified using: ${strategy.name}`);
        console.log('═══════════════════════════════════════════════════');
        console.log('Token Payload Details:');
        console.log('  - Audience:', payload.aud);
        console.log('  - Issuer:', payload.iss);
        console.log('  - Email:', payload.email);
        console.log('  - Name:', payload.name);
        console.log('  - Picture:', payload.picture || 'N/A');
        console.log('  - Subject (Google ID):', payload.sub);
        console.log('  - Expires:', new Date(payload.exp * 1000).toISOString());
        console.log('═══════════════════════════════════════════════════');
        
        verificationSuccess = true;
        break;
      } catch (strategyError) {
        console.error(`\n❌ Strategy "${strategy.name}" FAILED`);
        console.error(`  Error Message: ${strategyError.message}`);
        if (strategyError.code) {
          console.error(`  Error Code: ${strategyError.code}`);
        }
        if (strategyError.stack) {
          console.error(`  Stack: ${strategyError.stack.split('\n').slice(0, 3).join('\n')}`);
        }
        lastError = strategyError;
        continue;
      }
    }
    
    if (!verificationSuccess) {
      console.error('\n❌❌❌ ALL VERIFICATION STRATEGIES FAILED ❌❌❌');
      console.error('═══════════════════════════════════════════════════');
      console.error('Last Error Details:');
      console.error('  Message:', lastError?.message);
      console.error('  Code:', lastError?.code || 'N/A');
      console.error('\nDecoded Token Info (before verification):');
      console.error('  Audience:', decodedToken?.aud || 'N/A');
      console.error('  Issuer:', decodedToken?.iss || 'N/A');
      console.error('  Email:', decodedToken?.email || 'N/A');
      console.error('  Expires:', decodedToken?.exp ? new Date(decodedToken.exp * 1000).toISOString() : 'N/A');
      console.error('\nConfiguration:');
      console.error('  GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✓ Set' : '✗ Not set');
      console.error('═══════════════════════════════════════════════════');
      
      return res.status(401).json({ 
        error: 'Invalid Google token',
        details: {
          message: lastError?.message || 'Token verification failed',
          code: lastError?.code,
          decodedAudience: decodedToken?.aud,
          decodedIssuer: decodedToken?.iss,
          decodedEmail: decodedToken?.email,
          googleClientId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set',
          strategiesTried: verificationStrategies.length
        }
      });
    }

    // Extract user info from token payload (payload is already set above)
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ error: 'Email not provided by Google' });
    }

    // Check if user exists with this Google ID
    let user = await User.findOne({ googleId });
    let isNewUser = false;

    if (!user) {
      // Check if user exists with this email (for users who registered with email/password)
      user = await User.findOne({ email: email.toLowerCase() });
      
      if (user) {
        // Check if existing user has a different role than requested
        if (user.role !== role) {
          return res.status(403).json({ 
            error: `This email is already registered as a ${user.role}. You cannot login as a ${role}.` 
          });
        }
        // Link Google account to existing user
        user.googleId = googleId;
        if (!user.name && name) user.name = name;
        // Save FCM token if provided
        if (fcmToken) user.fcmToken = fcmToken;
        await user.save();
        isNewUser = false; // Existing user, just linked Google account
      } else {
        // Validate vendor category if role is vendor
        if (role === 'vendor' && vendorCategory) {
          if (!mongoose.Types.ObjectId.isValid(vendorCategory)) {
            return res.status(400).json({ error: 'Invalid vendor category ID' });
          }
          
          const VendorCategory = (await import('../models/VendorCategory.js')).default;
          const category = await VendorCategory.findOne({ 
            _id: vendorCategory, 
            isActive: true 
          });
          
          if (!category) {
            return res.status(400).json({ error: 'Invalid or inactive vendor category' });
          }
        }

        // Auto-register: Create new user (same flow as POST /api/auth/register)
        user = new User({
          name: name || 'User',
          email: email.toLowerCase(),
          googleId: googleId,
          role: role,
          verified: true, // Google emails are verified
          fcmToken: fcmToken || undefined,
          // For vendors, set vendorStatus to 'pending' (requires admin approval)
          vendorStatus: role === 'vendor' ? 'pending' : undefined,
          // Set vendor category if provided
          vendorCategory: role === 'vendor' && vendorCategory ? vendorCategory : undefined
        });
        await user.save();
        isNewUser = true; // New user registered
        
        console.log('✅ New user created via Google login');
        console.log('   User ID:', user._id);
        console.log('   User Name:', user.name);
        console.log('   User Email:', user.email);
        console.log('   User Role:', user.role);
        
        // Send welcome emails for new users (async, non-blocking)
        // Don't await - let it run in background so login response is fast
        (async () => {
          try {
            if (user.role === 'vendor') {
            console.log('📧 Vendor detected (Google login), sending vendor emails...');
            const { sendVendorWelcomeEmail, sendVendorRegistrationEmailToAdmin } = await import('../utils/emailService.js');
            
            // Send welcome email to vendor
            const welcomeResult = await sendVendorWelcomeEmail(user);
            if (welcomeResult && welcomeResult.success) {
              console.log('✅ Vendor welcome email sent to:', user.email);
            } else {
              console.error('❌ Failed to send vendor welcome email:', welcomeResult?.error);
            }
            
            // Send notification email to admin
            const adminResult = await sendVendorRegistrationEmailToAdmin(user);
            if (adminResult && adminResult.success) {
              console.log('✅ Vendor registration notification sent to admin');
            } else {
              console.error('❌ Failed to send admin notification:', adminResult?.error);
            }
          } else if (user.role === 'customer') {
            // Customer welcome email
            console.log('📧 Customer detected (Google login), sending customer welcome email...');
            console.log('   Customer Email:', user.email);
            console.log('   Customer Name:', user.name);
            
            try {
              const { sendCustomerWelcomeEmail } = await import('../utils/emailService.js');
              console.log('   Email service imported successfully');
              
              const welcomeResult = await sendCustomerWelcomeEmail(user);
              console.log('   Email function returned:', welcomeResult);
              
              if (welcomeResult && welcomeResult.success) {
                console.log('✅✅✅ Customer welcome email sent successfully to:', user.email);
                console.log('   Message ID:', welcomeResult.messageId);
              } else {
                console.error('❌❌❌ Failed to send customer welcome email to:', user.email);
                console.error('   Result:', welcomeResult);
                console.error('   Error:', welcomeResult?.error || 'Unknown error');
              }
            } catch (emailError) {
              console.error('❌❌❌ Error in customer welcome email (Google login):', emailError);
              console.error('   Error message:', emailError.message);
              console.error('   Error stack:', emailError.stack);
            }
          }
          } catch (emailError) {
            console.error('❌❌❌ Error sending welcome emails (Google login):', emailError);
            console.error('   Error message:', emailError.message);
            // Don't fail login if email fails
          }
        })(); // Immediately invoked async function - runs in background
      }
    } else {
      // User exists with this Google ID - check if role matches
      if (user.role !== role) {
        return res.status(403).json({ 
          error: `This Google account is already registered as a ${user.role}. You cannot login as a ${role}.` 
        });
      }
      // Update user info if needed
      let updated = false;
      if (name && user.name !== name) {
        user.name = name;
        updated = true;
      }
      // Update FCM token if provided
      if (fcmToken && user.fcmToken !== fcmToken) {
        user.fcmToken = fcmToken;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
      isNewUser = false; // Existing user
    }

    // Check if vendor is deleted (for backward compatibility with soft-deleted accounts)
    if (user.isDeleted) {
      console.log(`Google login attempt failed: Vendor account deleted for email: ${user.email}`);
      return res.status(403).json({ error: 'Your account has been deleted. Please contact support.' });
    }

    // Check if vendor is rejected
    if (user.role === 'vendor' && user.vendorStatus === 'rejected') {
      console.log(`Google login attempt failed: Vendor account rejected for email: ${user.email}`);
      return res.status(403).json({ error: 'Your vendor account has been rejected. Please contact support.' });
    }

    // Note: Removed approval check for Google login - vendors can login immediately after registration
    // Approval is only required for adding venues, not for login

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'change_me',
      { expiresIn: '7d' }
    );

    // Populate vendorCategory if vendor
    if (user.role === 'vendor' && user.vendorCategory) {
      await user.populate('vendorCategory', 'name description');
    }

    res.json({
      message: isNewUser ? 'Registration successful' : 'Google login successful',
      token,
      isNewUser: isNewUser,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        verified: user.verified,
        picture: picture || null,
        ...(user.role === 'vendor' && {
          vendorStatus: user.vendorStatus,
          vendorCategory: user.vendorCategory || null
        })
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ error: 'User with this Google account already exists' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};


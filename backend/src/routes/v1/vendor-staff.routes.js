import { Router } from 'express';
import { requireAuth, requireRole, requirePermission } from '../../middlewares/auth.js';
import { uploadVendorStaffImage, handleUploadError } from '../../middlewares/upload.js';
import {
  vendorStaffLogin,
  getVendorStaffProfile,
  createVendorStaff,
  getVendorStaff,
  getVendorStaffById,
  updateVendorStaff,
  deleteVendorStaff
} from '../../controllers/vendor-staff.controller.js';

const router = Router();

// Staff login (public - no auth required)
router.post('/login', vendorStaffLogin);

// Get staff profile (requires auth)
router.get('/profile', requireAuth, requireRole('vendor_staff'), getVendorStaffProfile);

// All other routes require vendor owner authentication (not vendor_staff)
router.use(requireAuth);
router.use(requireRole('vendor')); // Only vendor owners can manage staff

// Get all vendor staff
router.get('/', getVendorStaff);

// Get vendor staff by ID
router.get('/:id', getVendorStaffById);

// Create vendor staff (with image upload)
router.post('/', uploadVendorStaffImage, handleUploadError, createVendorStaff);

// Update vendor staff (with optional image upload)
router.put('/:id', uploadVendorStaffImage, handleUploadError, updateVendorStaff);

// Delete vendor staff
router.delete('/:id', deleteVendorStaff);

export default router;


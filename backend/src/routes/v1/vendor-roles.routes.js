import { Router } from 'express';
import { requireAuth, requireRole, requirePermission } from '../../middlewares/auth.js';
import {
  createVendorRole,
  getVendorRoles,
  getVendorRoleById,
  updateVendorRole,
  deleteVendorRole,
  getAvailableVendorPermissions
} from '../../controllers/vendor-role.controller.js';

const router = Router();

// All routes require vendor owner authentication (not vendor_staff)
router.use(requireAuth);
router.use(requireRole('vendor')); // Only vendor owners can manage roles

// Get available permissions (for creating roles)
router.get('/permissions/available', getAvailableVendorPermissions);

// Get all vendor roles
router.get('/', getVendorRoles);

// Get vendor role by ID
router.get('/:id', getVendorRoleById);

// Create vendor role
router.post('/', createVendorRole);

// Update vendor role
router.put('/:id', updateVendorRole);

// Delete vendor role
router.delete('/:id', deleteVendorRole);

export default router;


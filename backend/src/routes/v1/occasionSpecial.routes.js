import { Router } from 'express';
import { requireAuth, requireRole, requirePermission } from '../../middlewares/auth.js';
import { uploadOccasionSpecialImage, handleUploadError } from '../../middlewares/upload.js';
import {
  getOccasionSpecials,
  getOccasionSpecialById,
  createOccasionSpecial,
  updateOccasionSpecial,
  deleteOccasionSpecial
} from '../../controllers/occasionSpecial.controller.js';

const router = Router();

// Public routes (no authentication required)
router.get('/', getOccasionSpecials);
router.get('/:id', getOccasionSpecialById);

// Protected routes (admin/staff with permissions) - with image upload support
router.post('/', requireAuth, requireRole('admin', 'staff'), requirePermission('create_menus'), uploadOccasionSpecialImage, handleUploadError, createOccasionSpecial);
router.put('/:id', requireAuth, requireRole('admin', 'staff'), requirePermission('edit_menus'), uploadOccasionSpecialImage, handleUploadError, updateOccasionSpecial);
router.delete('/:id', requireAuth, requireRole('admin', 'staff'), requirePermission('delete_menus'), deleteOccasionSpecial);

export default router;


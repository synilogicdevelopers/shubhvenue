import { Router } from 'express';
import { requireAuth, requireRole, requirePermission } from '../../middlewares/auth.js';
import { uploadDecorationCategoryImage, handleUploadError } from '../../middlewares/upload.js';
import {
  getDecorationCategories,
  getDecorationCategoryById,
  createDecorationCategory,
  updateDecorationCategory,
  deleteDecorationCategory
} from '../../controllers/decorationCategory.controller.js';

const router = Router();

// Public routes (no authentication required)
router.get('/', getDecorationCategories);
router.get('/:id', getDecorationCategoryById);

// Protected routes (admin/staff with permissions) - with image upload support
router.post('/', requireAuth, requireRole('admin', 'staff'), requirePermission('create_categories'), uploadDecorationCategoryImage, handleUploadError, createDecorationCategory);
router.put('/:id', requireAuth, requireRole('admin', 'staff'), requirePermission('edit_categories'), uploadDecorationCategoryImage, handleUploadError, updateDecorationCategory);
router.delete('/:id', requireAuth, requireRole('admin', 'staff'), requirePermission('delete_categories'), deleteDecorationCategory);

export default router;


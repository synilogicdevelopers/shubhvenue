import { Router } from 'express';
import { requireAuth, requireRole, requirePermission } from '../../middlewares/auth.js';
import { uploadCategoryImage, handleUploadError } from '../../middlewares/upload.js';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from '../../controllers/category.controller.js';

const router = Router();

// Public routes (no authentication required)
router.get('/', getCategories);
router.get('/:id', getCategoryById);

// Protected routes (admin/staff with permissions) - with image upload support
router.post('/', requireAuth, requireRole('admin', 'staff'), requirePermission('create_categories'), uploadCategoryImage, handleUploadError, createCategory);
router.put('/:id', requireAuth, requireRole('admin', 'staff'), requirePermission('edit_categories'), uploadCategoryImage, handleUploadError, updateCategory);
router.delete('/:id', requireAuth, requireRole('admin', 'staff'), requirePermission('delete_categories'), deleteCategory);

export default router;




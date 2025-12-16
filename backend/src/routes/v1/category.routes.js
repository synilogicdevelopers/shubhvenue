import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
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

// Protected routes (admin only) - with image upload support
router.post('/', requireAuth, uploadCategoryImage, handleUploadError, createCategory);
router.put('/:id', requireAuth, uploadCategoryImage, handleUploadError, updateCategory);
router.delete('/:id', requireAuth, deleteCategory);

export default router;




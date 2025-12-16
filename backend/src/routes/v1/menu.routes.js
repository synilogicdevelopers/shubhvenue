import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { uploadMenuImage, handleUploadError } from '../../middlewares/upload.js';
import {
  getMenus,
  getMenuById,
  createMenu,
  updateMenu,
  deleteMenu
} from '../../controllers/menu.controller.js';

const router = Router();

// Public routes (no authentication required)
router.get('/', getMenus);
router.get('/:id', getMenuById);

// Protected routes (admin only) - with image upload support
router.post('/', requireAuth, uploadMenuImage, handleUploadError, createMenu);
router.put('/:id', requireAuth, uploadMenuImage, handleUploadError, updateMenu);
router.delete('/:id', requireAuth, deleteMenu);

export default router;





import { Router } from 'express';
import { requireAuth, requireRole, requirePermission } from '../../middlewares/auth.js';
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

// Protected routes (admin/staff with permissions) - with image upload support
router.post('/', requireAuth, requireRole('admin', 'staff'), requirePermission('create_menus'), uploadMenuImage, handleUploadError, createMenu);
router.put('/:id', requireAuth, requireRole('admin', 'staff'), requirePermission('edit_menus'), uploadMenuImage, handleUploadError, updateMenu);
router.delete('/:id', requireAuth, requireRole('admin', 'staff'), requirePermission('delete_menus'), deleteMenu);

export default router;





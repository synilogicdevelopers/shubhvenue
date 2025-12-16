import { Router } from 'express';
import { getPublicBanners, getPublicBannerById } from '../../controllers/banner.controller.js';

const router = Router();

// Public routes (no authentication required) - for customers
router.get('/', getPublicBanners);
router.get('/:id', getPublicBannerById);

export default router;



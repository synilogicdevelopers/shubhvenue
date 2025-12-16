import { Router } from 'express';
import { getPublicVideos, getPublicVideoById } from '../../controllers/video.controller.js';

const router = Router();

// Public routes (no authentication required) - for customers
router.get('/', getPublicVideos);
router.get('/:id', getPublicVideoById);

export default router;


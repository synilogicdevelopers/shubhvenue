import { Router } from 'express';
import { getPublicHomepageContent } from '../../controllers/homepageContent.controller.js';

const router = Router();

// Public routes (no auth required)
router.get('/:type', getPublicHomepageContent);

export default router;




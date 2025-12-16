import { Router } from 'express';
import { getPublicFAQs, getPublicFAQById } from '../../controllers/faq.controller.js';

const router = Router();

// Public routes (no authentication required) - for customers
router.get('/', getPublicFAQs);
router.get('/:id', getPublicFAQById);

export default router;


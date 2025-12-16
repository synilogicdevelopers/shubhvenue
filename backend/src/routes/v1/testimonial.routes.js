import { Router } from 'express';
import { getPublicTestimonials, getPublicTestimonialById } from '../../controllers/testimonial.controller.js';

const router = Router();

// Public routes (no authentication required) - for customers
router.get('/', getPublicTestimonials);
router.get('/:id', getPublicTestimonialById);

export default router;


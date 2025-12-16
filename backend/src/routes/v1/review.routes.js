import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import {
  createReview,
  getReviewsByVenue,
  getReviewsByUser,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
  getReviewsByVendor,
  addReplyToReview,
  updateReplyToReview,
  deleteReplyFromReview
} from '../../controllers/review.controller.js';

const router = Router();

// Public routes (no authentication required)
router.get('/venue/:venueId', getReviewsByVenue);
router.get('/', getReviews);
router.get('/:id', getReviewById);

// Protected routes (authentication required)
router.post('/', requireAuth, createReview);
router.get('/user/:userId', requireAuth, getReviewsByUser);
router.get('/vendor/all', requireAuth, getReviewsByVendor);
router.put('/:id', requireAuth, updateReview);
router.delete('/:id', requireAuth, deleteReview);

// Reply routes (vendor only)
router.post('/:id/reply', requireAuth, addReplyToReview);
router.put('/:id/reply', requireAuth, updateReplyToReview);
router.delete('/:id/reply', requireAuth, deleteReplyFromReview);

export default router;


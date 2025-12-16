import { Router } from 'express';
import { optionalAuth } from '../../middlewares/auth.js';
import {
  createPaymentOrder,
  verifyPayment,
  verifyPaymentForLead,
  getPaymentConfig,
} from '../../controllers/payment.controller.js';

const router = Router();

// Public route - Get payment config (Razorpay key ID)
router.get('/config', getPaymentConfig);

// Create payment order (optional auth - can be used without login)
router.post('/create-order', optionalAuth, createPaymentOrder);

// Verify payment and create booking (optional auth)
router.post('/verify', optionalAuth, verifyPayment);

// Verify payment for lead and convert to booking (optional auth)
router.post('/verify-lead', optionalAuth, verifyPaymentForLead);

export default router;








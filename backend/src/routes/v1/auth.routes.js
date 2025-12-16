import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getProfile, updateProfile, changePassword, googleLogin } from '../../controllers/auth.controller.js';
import { requireAuth } from '../../middlewares/auth.js';

const router = Router();

// More lenient rate limiting for auth routes (10 requests per minute)
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: { error: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Public routes with auth rate limiting
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google-login', authLimiter, googleLogin);

// Protected routes
router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);
router.put('/change-password', requireAuth, changePassword);

export default router;






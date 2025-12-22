import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import {
  staffLogin,
  getStaffProfile
} from '../../controllers/staff.controller.js';

const router = Router();

// Public route - Staff login
router.post('/login', staffLogin);

// Protected routes (require staff role)
router.use(requireAuth);
router.use(requireRole('staff'));

// Get staff profile
router.get('/profile', getStaffProfile);

export default router;


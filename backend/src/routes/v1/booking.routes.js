import { Router } from 'express';
import { requireAuth, optionalAuth } from '../../middlewares/auth.js';
import {
  getBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  getBookingCountByDeviceId,
  convertLeadToBookingWithPayment
} from '../../controllers/booking.controller.js';

const router = Router();

// Public routes - no authentication required
// Create booking (public - no login required)
router.post('/', createBooking);

// Get booking count by device_id (public - no login required)
router.get('/count/device/:deviceId', getBookingCountByDeviceId);

// Get bookings (role-aware) - optional auth, MUST be before /:id route to avoid route conflict
router.get('/', optionalAuth, getBookings);

// Get single booking (public) - must be after / route
router.get('/:id', getBookingById);

// Update booking status (protected)
router.put('/:id/status', requireAuth, updateBookingStatus);

// Convert lead to booking (public - for app)
router.post('/convert-lead', convertLeadToBookingWithPayment);

export default router;






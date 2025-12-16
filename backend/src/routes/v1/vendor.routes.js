import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import {
  getVendorDashboard,
  getVendorBookings,
  getVendorPayouts,
  getVendorLedger,
  getBlockedDates,
  addBlockedDates,
  removeBlockedDates,
  createVendorBooking,
  addLedgerEntry,
  updateLedgerEntry,
  deleteLedgerEntry
} from '../../controllers/vendor.controller.js';

const router = Router();

// All vendor routes require authentication
router.use(requireAuth);

// Get vendor dashboard stats
router.get('/dashboard', getVendorDashboard);

// Get vendor bookings
router.get('/bookings', getVendorBookings);

// Create booking by vendor (direct, no payment, no admin approval)
router.post('/bookings', createVendorBooking);

// Get vendor payouts
router.get('/payouts', getVendorPayouts);

// Get vendor ledger
router.get('/ledger', getVendorLedger);

// Ledger entry management
router.post('/ledger', addLedgerEntry);
router.put('/ledger/:id', updateLedgerEntry);
router.delete('/ledger/:id', deleteLedgerEntry);

// Blocked dates management
router.get('/blocked-dates', getBlockedDates);
router.post('/blocked-dates', addBlockedDates);
router.delete('/blocked-dates', removeBlockedDates);

export default router;



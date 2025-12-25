import { Router } from 'express';
import { requireAuth, requireRole, requirePermission } from '../../middlewares/auth.js';
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
  deleteLedgerEntry,
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent
} from '../../controllers/vendor.controller.js';

const router = Router();

// All vendor routes require authentication and vendor role
router.use(requireAuth);
router.use(requireRole('vendor', 'vendor_staff'));

// Get vendor dashboard stats
router.get('/dashboard', requirePermission('vendor_view_dashboard'), getVendorDashboard);

// Get vendor bookings
router.get('/bookings', requirePermission('vendor_view_bookings'), getVendorBookings);

// Create booking by vendor (direct, no payment, no admin approval)
router.post('/bookings', requirePermission('vendor_create_bookings'), createVendorBooking);

// Get vendor payouts
router.get('/payouts', requirePermission('vendor_view_payouts'), getVendorPayouts);

// Get vendor ledger
router.get('/ledger', requirePermission('vendor_view_ledger'), getVendorLedger);

// Ledger entry management
router.post('/ledger', requirePermission('vendor_create_ledger'), addLedgerEntry);
router.put('/ledger/:id', requirePermission('vendor_edit_ledger'), updateLedgerEntry);
router.delete('/ledger/:id', requirePermission('vendor_delete_ledger'), deleteLedgerEntry);

// Blocked dates management
router.get('/blocked-dates', requirePermission('vendor_view_blocked_dates'), getBlockedDates);
router.post('/blocked-dates', requirePermission('vendor_create_blocked_dates'), addBlockedDates);
router.delete('/blocked-dates', requirePermission('vendor_delete_blocked_dates'), removeBlockedDates);

// Calendar events management
router.get('/calendar-events', requirePermission('vendor_view_blocked_dates'), getCalendarEvents);
router.post('/calendar-events', requirePermission('vendor_create_blocked_dates'), createCalendarEvent);
router.put('/calendar-events/:id', requirePermission('vendor_create_blocked_dates'), updateCalendarEvent);
router.delete('/calendar-events/:id', requirePermission('vendor_delete_blocked_dates'), deleteCalendarEvent);

export default router;



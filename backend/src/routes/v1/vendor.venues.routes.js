import { Router } from 'express';
import { requireAuth, optionalAuth } from '../../middlewares/auth.js';
import { uploadVenueMedia, handleUploadError } from '../../middlewares/upload.js';
import {
  getVenues,
  getVenueById,
  createVenue,
  updateVenue,
  deleteVenue,
  toggleVenueStatus,
  searchVenues,
  getStates,
  getCities,
  getSearchSuggestions
} from '../../controllers/vendor.venues.controller.js';

const router = Router();

// Get all Indian states (public - no auth required)
router.get('/states', getStates);

// Get cities by state (public - no auth required)
router.get('/cities', getCities);

// Get search suggestions (public - no auth required)
router.get('/search/suggestions', getSearchSuggestions);

// Search venues (public - no auth required)
router.get('/search', searchVenues);

// Get venues (optional auth - vendors see their own, public sees all approved)
router.get('/', optionalAuth, getVenues);

// Get single venue (optional auth - vendors can see their own regardless of status)
router.get('/:id', optionalAuth, getVenueById);

// Protected routes - require authentication
router.use(requireAuth);

// Create venue (vendor only) - with image and video upload support
router.post('/', uploadVenueMedia, handleUploadError, createVenue);

// Update venue (vendor only, own venues) - with image and video upload support
router.put('/:id', uploadVenueMedia, handleUploadError, updateVenue);

// Toggle venue active/inactive status (vendor only, own venues)
router.patch('/:id/toggle-status', toggleVenueStatus);

// Delete venue (vendor only, own venues)
router.delete('/:id', deleteVenue);

export default router;






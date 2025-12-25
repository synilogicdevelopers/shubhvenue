import { Router } from 'express';
import { 
  toggleVenueLike, 
  getShotlist, 
  checkVenueLikeStatus 
} from '../../controllers/shotlist.controller.js';
import { optionalAuth } from '../../middlewares/auth.js';

const router = Router();

// All routes use optionalAuth - works for both logged in and non-logged in users
// For non-logged in users, deviceId should be provided in body or header

// Toggle like/unlike a venue (add/remove from shotlist)
router.post('/venue/:venueId/like', optionalAuth, toggleVenueLike);

// Get all shotlisted venues
router.get('/', optionalAuth, getShotlist);

// Check if a venue is liked (in shotlist)
router.get('/venue/:venueId/status', optionalAuth, checkVenueLikeStatus);

export default router;




import { Router } from 'express';
import {
  getLocationSuggestions,
  getLocationDetails,
  getMapsApiKey
} from '../../controllers/googlemaps.controller.js';

const router = Router();

// Get location suggestions (autocomplete) - Public API
router.get('/suggestions', getLocationSuggestions);

// Get location details by place ID - Public API
router.get('/details', getLocationDetails);

// Get Google Maps API key (for frontend) - Public API
router.get('/api-key', getMapsApiKey);

export default router;


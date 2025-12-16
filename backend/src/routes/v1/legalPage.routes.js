import { Router } from 'express';
import { getPublicLegalPage } from '../../controllers/legalPage.controller.js';

const router = Router();

// Public route (no authentication required) - for customers
router.get('/:type', getPublicLegalPage);

export default router;


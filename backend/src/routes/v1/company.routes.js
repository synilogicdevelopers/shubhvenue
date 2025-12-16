import { Router } from 'express';
import { getPublicCompany } from '../../controllers/company.controller.js';

const router = Router();

// Public route (no authentication required) - for customers
router.get('/', getPublicCompany);

export default router;


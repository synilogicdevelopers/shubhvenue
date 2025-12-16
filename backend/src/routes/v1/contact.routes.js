import { Router } from 'express';
import { submitContact, getContactById, getContactByEmail } from '../../controllers/contact.controller.js';

const router = Router();

// Public routes (no authentication required) - for customers
router.post('/', submitContact);
router.get('/by-email', getContactByEmail); // Must be before /:id route
router.get('/:id', getContactById);

export default router;


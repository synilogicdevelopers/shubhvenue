import { Router } from 'express';

const router = Router();

router.post('/customers', (req, res) => res.status(501).json({ error: 'Not implemented' }));
router.get('/bookings', (req, res) => res.status(501).json({ error: 'Not implemented' }));
router.get('/earnings', (req, res) => res.status(501).json({ error: 'Not implemented' }));

export default router;









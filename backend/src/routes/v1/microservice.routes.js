import { Router } from 'express';
import { handleMicroserviceCallback } from '../../controllers/microserviceCallback.controller.js';

const router = Router();

// Callback endpoint for Razorpay Central Payments Microservice
// Configure this URL in microservice project settings as callback URL:
// https://shubhvenue.com/api/microservice/payment-callback
router.post('/payment-callback', handleMicroserviceCallback);

export default router;


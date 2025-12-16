import { Router } from 'express';
import authRoutes from './v1/auth.routes.js';
import venueRoutes from './v1/vendor.venues.routes.js';
import vendorRoutes from './v1/vendor.routes.js';
import bookingRoutes from './v1/booking.routes.js';
import affiliateRoutes from './v1/affiliate.routes.js';
import adminRoutes from './v1/admin.routes.js';
import paymentRoutes from './v1/payment.routes.js';
import aiRoutes from './v1/ai.routes.js';
import categoryRoutes from './v1/category.routes.js';
import menuRoutes from './v1/menu.routes.js';
import bannerRoutes from './v1/banner.routes.js';
import videoRoutes from './v1/video.routes.js';
import testimonialRoutes from './v1/testimonial.routes.js';
import faqRoutes from './v1/faq.routes.js';
import companyRoutes from './v1/company.routes.js';
import legalPageRoutes from './v1/legalPage.routes.js';
import contactRoutes from './v1/contact.routes.js';
import googleMapsRoutes from './v1/googlemaps.routes.js';
import reviewRoutes from './v1/review.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/vendor/venues', venueRoutes);
router.use('/vendor', vendorRoutes);
router.use('/bookings', bookingRoutes);
router.use('/affiliate', affiliateRoutes);
router.use('/admin', adminRoutes);
router.use('/payment', paymentRoutes);
router.use('/ai', aiRoutes);
router.use('/categories', categoryRoutes);
router.use('/menus', menuRoutes);
router.use('/banners', bannerRoutes);
router.use('/videos', videoRoutes);
router.use('/testimonials', testimonialRoutes);
router.use('/faqs', faqRoutes);
router.use('/company', companyRoutes);
router.use('/legal-pages', legalPageRoutes);
router.use('/contact', contactRoutes);
router.use('/maps', googleMapsRoutes);
router.use('/reviews', reviewRoutes);

export default router;









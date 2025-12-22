import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import {
  adminLogin,
  getDashboard,
  getUsers,
  getUserById,
  deleteUser,
  blockUser,
  createVendorByAdmin,
  getVendors,
  getVendorById,
  approveVendor,
  rejectVendor,
  deleteVendor,
  createVenueByAdmin,
  getVenueByIdAdmin,
  updateVenueByAdmin,
  deleteVenueByAdmin,
  getVenues,
  approveVenue,
  rejectVenue,
  updateVenueButtonSettings,
  getBookings,
  updateBookingStatus,
  approveBooking,
  rejectBooking,
  createLedgerForExistingBookings,
  getPayouts,
  getAnalytics,
  getProfile,
  updateProfile,
  changePassword,
  getLeads,
  getLeadById,
  updateLeadStatus,
  convertLeadToBooking,
  getPaymentConfig,
  updatePaymentConfig,
  getGoogleMapsConfig,
  updateGoogleMapsConfig,
  getBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerActive,
  getVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
  toggleVideoActive,
  getTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  toggleTestimonialActive,
  getFAQs,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  toggleFAQActive,
  getCompany,
  updateCompany,
  getLegalPages,
  getLegalPageByType,
  updateLegalPage,
  getContacts,
  getContactById,
  updateContactStatus,
  deleteContact,
} from '../../controllers/admin.controller.js';
import Payout from '../../models/Payout.js';
import { uploadBannerImage, uploadVideo, uploadVenueMedia, handleUploadError } from '../../middlewares/upload.js';

const router = Router();

// Public route
router.post('/login', adminLogin);

// Protected routes (require admin role)
router.use(requireAuth);
router.use(requireRole('admin'));

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/block', blockUser);
router.get('/vendors', getVendors);
router.post('/vendors', createVendorByAdmin);
router.get('/vendors/:id', getVendorById);
router.put('/vendors/:id/approve', approveVendor);
router.put('/vendors/:id/reject', rejectVendor);
router.delete('/vendors/:id', deleteVendor);
router.get('/venues', getVenues);
router.post('/venues', uploadVenueMedia, handleUploadError, createVenueByAdmin);
router.put('/venues/approve/:id', approveVenue);
router.put('/venues/reject/:id', rejectVenue);
router.put('/venues/:id/button-settings', updateVenueButtonSettings);
router.get('/venues/:id', getVenueByIdAdmin);
router.put('/venues/:id', uploadVenueMedia, handleUploadError, updateVenueByAdmin);
router.delete('/venues/:id', deleteVenueByAdmin);
router.get('/bookings', getBookings);
router.put('/bookings/:id/status', updateBookingStatus);
router.put('/bookings/:id/approve', approveBooking);
router.put('/bookings/:id/reject', rejectBooking);
router.post('/bookings/create-ledger-entries', createLedgerForExistingBookings);
router.get('/leads', getLeads);
router.get('/leads/:id', getLeadById);
router.put('/leads/:id/status', updateLeadStatus);
router.post('/leads/:id/convert-to-booking', convertLeadToBooking);
router.get('/payouts', getPayouts);
router.put('/payouts/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const payout = await Payout.findByIdAndUpdate(
      id,
      { payment_status: 'paid' },
      { new: true }
    ).populate('vendorId', 'name email');
    
    if (!payout) {
      return res.status(404).json({ message: 'Payout not found' });
    }
    
    res.json({ message: 'Payout marked as completed', payout });
  } catch (error) {
    console.error('Mark payout complete error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
router.get('/analytics', getAnalytics);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.get('/payment-config', getPaymentConfig);
router.put('/payment-config', updatePaymentConfig);
router.get('/google-maps-config', getGoogleMapsConfig);
router.put('/google-maps-config', updateGoogleMapsConfig);

// Banner routes
router.get('/banners', getBanners);
router.get('/banners/:id', getBannerById);
router.post('/banners', uploadBannerImage, handleUploadError, createBanner);
router.put('/banners/:id', uploadBannerImage, handleUploadError, updateBanner);
router.delete('/banners/:id', deleteBanner);
router.put('/banners/:id/toggle-active', toggleBannerActive);

// Video routes
router.get('/videos', getVideos);
router.get('/videos/:id', getVideoById);
router.post('/videos', uploadVideo, handleUploadError, createVideo);
router.put('/videos/:id', uploadVideo, handleUploadError, updateVideo);
router.delete('/videos/:id', deleteVideo);
router.put('/videos/:id/toggle-active', toggleVideoActive);

// Testimonial routes
router.get('/testimonials', getTestimonials);
router.get('/testimonials/:id', getTestimonialById);
router.post('/testimonials', createTestimonial);
router.put('/testimonials/:id', updateTestimonial);
router.delete('/testimonials/:id', deleteTestimonial);
router.put('/testimonials/:id/toggle-active', toggleTestimonialActive);

// FAQ routes
router.get('/faqs', getFAQs);
router.get('/faqs/:id', getFAQById);
router.post('/faqs', createFAQ);
router.put('/faqs/:id', updateFAQ);
router.delete('/faqs/:id', deleteFAQ);
router.put('/faqs/:id/toggle-active', toggleFAQActive);

// Company routes
router.get('/company', getCompany);
router.put('/company', updateCompany);

// Legal Pages routes
router.get('/legal-pages', getLegalPages);
router.get('/legal-pages/:type', getLegalPageByType);
router.put('/legal-pages/:type', updateLegalPage);

// Contact Submissions routes
router.get('/contacts', getContacts);
router.get('/contacts/:id', getContactById);
router.put('/contacts/:id/status', updateContactStatus);
router.delete('/contacts/:id', deleteContact);

export default router;



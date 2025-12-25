import { Router } from 'express';
import { requireAuth, requireRole, requirePermission } from '../../middlewares/auth.js';
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
  getEmailConfig,
  updateEmailConfig,
  testEmail,
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
import { uploadBannerImage, uploadVideo, uploadVenueMedia, uploadStaffImage, uploadVendorCategoryImage, handleUploadError } from '../../middlewares/upload.js';
import {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
  getAvailablePermissions
} from '../../controllers/role.controller.js';
import {
  createStaff,
  getStaff,
  getStaffById,
  updateStaff,
  deleteStaff
} from '../../controllers/staff.controller.js';
import {
  getReviews,
  getReviewById,
  updateReview,
  deleteReview
} from '../../controllers/review.controller.js';
import {
  getVendorCategories,
  getVendorCategoryById,
  createVendorCategory,
  updateVendorCategory,
  deleteVendorCategory,
  updateVendorCategoryForVendor,
  getVendorCategoriesPublic
} from '../../controllers/admin.controller.js';

const router = Router();

// Public routes (no authentication required)
router.post('/login', adminLogin);
router.get('/vendor-categories/public', getVendorCategoriesPublic); // Public endpoint for registration

// Protected routes (require admin or staff role)
router.use(requireAuth);
router.use(requireRole('admin', 'staff'));

// Dashboard - accessible to all authenticated admin/staff
router.get('/dashboard', getDashboard);

// Users - require view_users permission
router.get('/users', requirePermission('view_users'), getUsers);
router.get('/users/:id', requirePermission('view_users'), getUserById);
router.delete('/users/:id', requirePermission('delete_users'), deleteUser);
router.put('/users/:id/block', requirePermission('edit_users'), blockUser);
router.get('/vendors', requirePermission('view_vendors'), getVendors);
router.post('/vendors', requirePermission('create_vendors'), createVendorByAdmin);
router.get('/vendors/:id', requirePermission('view_vendors'), getVendorById);
router.put('/vendors/:id/approve', requirePermission('edit_vendors'), approveVendor);
router.put('/vendors/:id/reject', requirePermission('edit_vendors'), rejectVendor);
router.delete('/vendors/:id', requirePermission('delete_vendors'), deleteVendor);
router.get('/venues', requirePermission('view_venues'), getVenues);
router.post('/venues', requirePermission('create_venues'), uploadVenueMedia, handleUploadError, createVenueByAdmin);
router.put('/venues/approve/:id', requirePermission('edit_venues'), approveVenue);
router.put('/venues/reject/:id', requirePermission('edit_venues'), rejectVenue);
router.put('/venues/:id/button-settings', requirePermission('edit_venues'), updateVenueButtonSettings);
router.get('/venues/:id', requirePermission('view_venues'), getVenueByIdAdmin);
router.put('/venues/:id', requirePermission('edit_venues'), uploadVenueMedia, handleUploadError, updateVenueByAdmin);
router.delete('/venues/:id', requirePermission('delete_venues'), deleteVenueByAdmin);
router.get('/bookings', requirePermission('view_bookings'), getBookings);
router.put('/bookings/:id/status', requirePermission('edit_bookings'), updateBookingStatus);
router.put('/bookings/:id/approve', requirePermission('edit_bookings'), approveBooking);
router.put('/bookings/:id/reject', requirePermission('edit_bookings'), rejectBooking);
router.post('/bookings/create-ledger-entries', requirePermission('edit_bookings'), createLedgerForExistingBookings);
router.get('/leads', requirePermission('view_leads'), getLeads);
router.get('/leads/:id', requirePermission('view_leads'), getLeadById);
router.put('/leads/:id/status', requirePermission('edit_leads'), updateLeadStatus);
router.post('/leads/:id/convert-to-booking', requirePermission('edit_leads'), convertLeadToBooking);
router.get('/payouts', requirePermission('view_payouts'), getPayouts);
router.put('/payouts/:id/complete', requirePermission('edit_payouts'), async (req, res) => {
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
router.get('/analytics', requirePermission('view_analytics'), getAnalytics);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.get('/payment-config', requirePermission('view_settings'), getPaymentConfig);
router.put('/payment-config', requirePermission('edit_settings'), updatePaymentConfig);
router.get('/email-config', requirePermission('view_settings'), getEmailConfig);
router.put('/email-config', requirePermission('edit_settings'), updateEmailConfig);
router.post('/email-config/test', requirePermission('edit_settings'), testEmail);
router.get('/google-maps-config', requirePermission('view_settings'), getGoogleMapsConfig);
router.put('/google-maps-config', requirePermission('edit_settings'), updateGoogleMapsConfig);

// Banner routes
router.get('/banners', requirePermission('view_banners'), getBanners);
router.get('/banners/:id', requirePermission('view_banners'), getBannerById);
router.post('/banners', requirePermission('create_banners'), uploadBannerImage, handleUploadError, createBanner);
router.put('/banners/:id', requirePermission('edit_banners'), uploadBannerImage, handleUploadError, updateBanner);
router.delete('/banners/:id', requirePermission('delete_banners'), deleteBanner);
router.put('/banners/:id/toggle-active', requirePermission('edit_banners'), toggleBannerActive);

// Video routes
router.get('/videos', requirePermission('view_videos'), getVideos);
router.get('/videos/:id', requirePermission('view_videos'), getVideoById);
router.post('/videos', requirePermission('create_videos'), uploadVideo, handleUploadError, createVideo);
router.put('/videos/:id', requirePermission('edit_videos'), uploadVideo, handleUploadError, updateVideo);
router.delete('/videos/:id', requirePermission('delete_videos'), deleteVideo);
router.put('/videos/:id/toggle-active', requirePermission('edit_videos'), toggleVideoActive);

// Testimonial routes
router.get('/testimonials', requirePermission('view_testimonials'), getTestimonials);
router.get('/testimonials/:id', requirePermission('view_testimonials'), getTestimonialById);
router.post('/testimonials', requirePermission('create_testimonials'), createTestimonial);
router.put('/testimonials/:id', requirePermission('edit_testimonials'), updateTestimonial);
router.delete('/testimonials/:id', requirePermission('delete_testimonials'), deleteTestimonial);
router.put('/testimonials/:id/toggle-active', requirePermission('edit_testimonials'), toggleTestimonialActive);

// FAQ routes
router.get('/faqs', requirePermission('view_faqs'), getFAQs);
router.get('/faqs/:id', requirePermission('view_faqs'), getFAQById);
router.post('/faqs', requirePermission('create_faqs'), createFAQ);
router.put('/faqs/:id', requirePermission('edit_faqs'), updateFAQ);
router.delete('/faqs/:id', requirePermission('delete_faqs'), deleteFAQ);
router.put('/faqs/:id/toggle-active', requirePermission('edit_faqs'), toggleFAQActive);

// Company routes
router.get('/company', requirePermission('view_company'), getCompany);
router.put('/company', requirePermission('edit_company'), updateCompany);

// Legal Pages routes
router.get('/legal-pages', requirePermission('view_legal_pages'), getLegalPages);
router.get('/legal-pages/:type', requirePermission('view_legal_pages'), getLegalPageByType);
router.put('/legal-pages/:type', requirePermission('edit_legal_pages'), updateLegalPage);

// Contact Submissions routes
router.get('/contacts', requirePermission('view_contacts'), getContacts);
router.get('/contacts/:id', requirePermission('view_contacts'), getContactById);
router.put('/contacts/:id/status', requirePermission('edit_contacts'), updateContactStatus);
router.delete('/contacts/:id', requirePermission('delete_contacts'), deleteContact);

// Role routes
router.get('/roles', requirePermission('view_roles'), getRoles);
router.get('/roles/permissions/available', requirePermission('view_roles'), getAvailablePermissions);
router.get('/roles/:id', requirePermission('view_roles'), getRoleById);
router.post('/roles', requirePermission('create_roles'), createRole);
router.put('/roles/:id', requirePermission('edit_roles'), updateRole);
router.delete('/roles/:id', requirePermission('delete_roles'), deleteRole);

// Staff routes
router.get('/staff', requirePermission('view_staff'), getStaff);
router.get('/staff/:id', requirePermission('view_staff'), getStaffById);
router.post('/staff', requirePermission('create_staff'), uploadStaffImage, handleUploadError, createStaff);
router.put('/staff/:id', requirePermission('edit_staff'), uploadStaffImage, handleUploadError, updateStaff);
router.delete('/staff/:id', requirePermission('delete_staff'), deleteStaff);

// Review routes
router.get('/reviews', requirePermission('view_reviews'), getReviews);
router.get('/reviews/:id', requirePermission('view_reviews'), getReviewById);
router.put('/reviews/:id', requirePermission('edit_reviews'), updateReview);
router.delete('/reviews/:id', requirePermission('delete_reviews'), deleteReview);

// Vendor Category routes (Admin only)
router.get('/vendor-categories', requirePermission('view_vendors'), getVendorCategories);
router.get('/vendor-categories/:id', requirePermission('view_vendors'), getVendorCategoryById);
router.post('/vendor-categories', requirePermission('edit_vendors'), uploadVendorCategoryImage, handleUploadError, createVendorCategory);
router.put('/vendor-categories/:id', requirePermission('edit_vendors'), uploadVendorCategoryImage, handleUploadError, updateVendorCategory);
router.delete('/vendor-categories/:id', requirePermission('edit_vendors'), deleteVendorCategory);
router.put('/vendors/:vendorId/category', requirePermission('edit_vendors'), updateVendorCategoryForVendor);

export default router;



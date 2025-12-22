// All available permissions in the admin panel
// Use these when creating roles

export const ALL_PERMISSIONS = [
  // Dashboard
  'view_dashboard',
  
  // Users Management
  'view_users',
  'create_users',
  'edit_users',
  'delete_users',
  
  // Vendors Management
  'view_vendors',
  'create_vendors',
  'edit_vendors',
  'approve_vendors',
  'reject_vendors',
  'delete_vendors',
  
  // Venues Management
  'view_venues',
  'create_venues',
  'edit_venues',
  'approve_venues',
  'reject_venues',
  'delete_venues',
  
  // Bookings Management
  'view_bookings',
  'edit_bookings',
  'approve_bookings',
  'reject_bookings',
  
  // Leads Management
  'view_leads',
  'edit_leads',
  'convert_leads',
  
  // Payouts Management
  'view_payouts',
  'edit_payouts',
  
  // Analytics
  'view_analytics',
  
  // Settings
  'view_settings',
  'edit_settings',
  
  // Banners Management
  'view_banners',
  'create_banners',
  'edit_banners',
  'delete_banners',
  
  // Videos Management
  'view_videos',
  'create_videos',
  'edit_videos',
  'delete_videos',
  
  // Testimonials Management
  'view_testimonials',
  'create_testimonials',
  'edit_testimonials',
  'delete_testimonials',
  
  // FAQs Management
  'view_faqs',
  'create_faqs',
  'edit_faqs',
  'delete_faqs',
  
  // Company Management
  'view_company',
  'edit_company',
  
  // Legal Pages Management
  'view_legal_pages',
  'edit_legal_pages',
  
  // Contact Submissions
  'view_contacts',
  'edit_contacts',
  'delete_contacts',
  
  // Reviews Management
  'view_reviews',
  'edit_reviews',
  'delete_reviews',
  'approve_reviews',
  'reject_reviews',
  
  // Review Replies Management
  'view_review_replies',
  'create_review_replies',
  'edit_review_replies',
  'delete_review_replies',
  
  // Categories Management
  'view_categories',
  'create_categories',
  'edit_categories',
  'delete_categories',
  
  // Menus Management
  'view_menus',
  'create_menus',
  'edit_menus',
  'delete_menus',
  
  // Roles Management
  'view_roles',
  'create_roles',
  'edit_roles',
  'delete_roles',
  
  // Staff Management
  'view_staff',
  'create_staff',
  'edit_staff',
  'delete_staff',
];

// Predefined role templates with common permission sets
export const ROLE_TEMPLATES = {
  // Super Admin - All permissions
  SUPER_ADMIN: ALL_PERMISSIONS,
  
  // Manager - Can view and edit most things, but can't manage roles/staff
  MANAGER: [
    'view_dashboard',
    'view_users',
    'edit_users',
    'view_vendors',
    'edit_vendors',
    'approve_vendors',
    'reject_vendors',
    'view_venues',
    'edit_venues',
    'approve_venues',
    'reject_venues',
    'view_bookings',
    'edit_bookings',
    'approve_bookings',
    'reject_bookings',
    'view_leads',
    'edit_leads',
    'convert_leads',
    'view_payouts',
    'edit_payouts',
    'view_analytics',
    'view_banners',
    'edit_banners',
    'view_videos',
    'edit_videos',
    'view_testimonials',
    'edit_testimonials',
    'view_faqs',
    'edit_faqs',
    'view_company',
    'view_legal_pages',
    'view_contacts',
    'edit_contacts',
    'view_reviews',
    'edit_reviews',
    'delete_reviews',
    'view_categories',
    'create_categories',
    'edit_categories',
    'delete_categories',
    'view_menus',
    'create_menus',
    'edit_menus',
    'delete_menus',
  ],
  
  // Support Staff - Can view and respond to contacts, view bookings
  SUPPORT: [
    'view_dashboard',
    'view_users',
    'view_bookings',
    'view_leads',
    'edit_leads',
    'view_contacts',
    'edit_contacts',
    'view_reviews',
  ],
  
  // Content Manager - Can manage banners, videos, testimonials, FAQs, categories, menus
  CONTENT_MANAGER: [
    'view_dashboard',
    'view_banners',
    'create_banners',
    'edit_banners',
    'delete_banners',
    'view_videos',
    'create_videos',
    'edit_videos',
    'delete_videos',
    'view_testimonials',
    'create_testimonials',
    'edit_testimonials',
    'delete_testimonials',
    'view_faqs',
    'create_faqs',
    'edit_faqs',
    'delete_faqs',
    'view_categories',
    'create_categories',
    'edit_categories',
    'delete_categories',
    'view_menus',
    'create_menus',
    'edit_menus',
    'delete_menus',
  ],
  
  // Booking Manager - Focus on bookings and leads
  BOOKING_MANAGER: [
    'view_dashboard',
    'view_bookings',
    'edit_bookings',
    'approve_bookings',
    'reject_bookings',
    'view_leads',
    'edit_leads',
    'convert_leads',
    'view_venues',
    'view_vendors',
    'approve_venues',
    'reject_venues',
    'approve_vendors',
    'reject_vendors',
    'view_reviews',
    'edit_reviews',
    'delete_reviews',
    'view_review_replies',
    'create_review_replies',
    'edit_review_replies',
    'delete_review_replies',
  ],
};

export default ALL_PERMISSIONS;


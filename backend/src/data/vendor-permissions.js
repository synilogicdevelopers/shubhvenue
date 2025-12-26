// All available permissions for vendor panel
// Use these when creating vendor roles

export const VENDOR_ALL_PERMISSIONS = [
  // Dashboard
  'vendor_view_dashboard',
  
  // Management
  'vendor_view_calendar',
  'vendor_manage_calendar',
  
  // Venues Management
  'vendor_view_venues',
  'vendor_create_venues',
  'vendor_edit_venues',
  'vendor_delete_venues',
  'vendor_toggle_venues',
  
  // Bookings Management
  'vendor_view_bookings',
  'vendor_create_bookings',
  'vendor_edit_bookings',
  'vendor_approve_bookings',
  'vendor_reject_bookings',
  'vendor_cancel_bookings',
  
  // Payouts Management
  'vendor_view_payouts',
  'vendor_edit_payouts',
  'vendor_request_payouts',
  
  // Ledger Management
  'vendor_view_ledger',
  'vendor_create_ledger',
  'vendor_edit_ledger',
  'vendor_delete_ledger',
  
  // Blocked Dates Management
  'vendor_view_blocked_dates',
  'vendor_create_blocked_dates',
  'vendor_edit_blocked_dates',
  'vendor_delete_blocked_dates',
  
  // Reviews Management
  'vendor_view_reviews',
  'vendor_reply_reviews',
  'vendor_edit_reviews',
  'vendor_delete_reviews',
  
  // Profile Management
  'vendor_view_profile',
  'vendor_edit_profile',
  'vendor_change_password',
];

// Predefined role templates with common permission sets for vendors
export const VENDOR_ROLE_TEMPLATES = {
  // Vendor Owner - All permissions
  VENDOR_OWNER: VENDOR_ALL_PERMISSIONS,
  
  // Venue Manager - Can manage venues and bookings
  VENUE_MANAGER: [
    'vendor_view_dashboard',
    'vendor_view_venues',
    'vendor_create_venues',
    'vendor_edit_venues',
    'vendor_delete_venues',
    'vendor_toggle_venues',
    'vendor_view_bookings',
    'vendor_create_bookings',
    'vendor_edit_bookings',
    'vendor_approve_bookings',
    'vendor_reject_bookings',
    'vendor_view_blocked_dates',
    'vendor_create_blocked_dates',
    'vendor_delete_blocked_dates',
    'vendor_view_reviews',
    'vendor_reply_reviews',
  ],
  
  // Booking Manager - Can manage bookings and blocked dates
  BOOKING_MANAGER: [
    'vendor_view_dashboard',
    'vendor_view_bookings',
    'vendor_create_bookings',
    'vendor_edit_bookings',
    'vendor_approve_bookings',
    'vendor_reject_bookings',
    'vendor_view_blocked_dates',
    'vendor_create_blocked_dates',
    'vendor_delete_blocked_dates',
    'vendor_view_venues',
  ],
  
  // Accountant - Can view payouts and ledger
  ACCOUNTANT: [
    'vendor_view_dashboard',
    'vendor_view_payouts',
    'vendor_view_ledger',
    'vendor_create_ledger',
    'vendor_edit_ledger',
    'vendor_delete_ledger',
  ],
  
  // Support Staff - Can view bookings and reply to reviews
  SUPPORT: [
    'vendor_view_dashboard',
    'vendor_view_bookings',
    'vendor_view_reviews',
    'vendor_reply_reviews',
  ],
};

export default VENDOR_ALL_PERMISSIONS;


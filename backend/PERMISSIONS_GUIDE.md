# Admin Panel Permissions Guide

## Overview
Yeh document admin panel ke saare available permissions ki list hai jo aap role create karte waqt use kar sakte ho.

## API Endpoint
**GET** `/api/admin/roles/permissions/available`

Yeh endpoint saare available permissions return karta hai, organized by category.

**Response:**
```json
{
  "allPermissions": [
    "view_dashboard",
    "view_users",
    "create_users",
    ...
  ],
  "permissionsByCategory": {
    "dashboard": ["view_dashboard"],
    "users": ["view_users", "create_users", "edit_users", "delete_users"],
    ...
  },
  "roleTemplates": {
    "SUPER_ADMIN": [...],
    "MANAGER": [...],
    ...
  }
}
```

---

## Complete Permissions List

### Dashboard
- `view_dashboard` - Dashboard dekhne ki permission

### Users Management
- `view_users` - Users list dekhne ki permission
- `create_users` - Naya user create karne ki permission
- `edit_users` - User edit/block karne ki permission
- `delete_users` - User delete karne ki permission

### Vendors Management
- `view_vendors` - Vendors list dekhne ki permission
- `create_vendors` - Naya vendor create karne ki permission
- `edit_vendors` - Vendor edit karne ki permission
- `approve_vendors` - Vendor approve karne ki permission
- `reject_vendors` - Vendor reject karne ki permission
- `delete_vendors` - Vendor delete karne ki permission

### Venues Management
- `view_venues` - Venues list dekhne ki permission
- `create_venues` - Naya venue create karne ki permission
- `edit_venues` - Venue edit karne ki permission
- `approve_venues` - Venue approve karne ki permission
- `reject_venues` - Venue reject karne ki permission
- `delete_venues` - Venue delete karne ki permission

### Bookings Management
- `view_bookings` - Bookings list dekhne ki permission
- `edit_bookings` - Booking status update karne ki permission
- `approve_bookings` - Booking approve karne ki permission
- `reject_bookings` - Booking reject karne ki permission

### Leads Management
- `view_leads` - Leads list dekhne ki permission
- `edit_leads` - Lead status update karne ki permission
- `convert_leads` - Lead ko booking me convert karne ki permission

### Payouts Management
- `view_payouts` - Payouts list dekhne ki permission
- `edit_payouts` - Payout complete mark karne ki permission

### Analytics
- `view_analytics` - Analytics dashboard dekhne ki permission

### Settings
- `view_settings` - Settings dekhne ki permission
- `edit_settings` - Settings update karne ki permission (Payment, Google Maps, etc.)

### Banners Management
- `view_banners` - Banners list dekhne ki permission
- `create_banners` - Naya banner create karne ki permission
- `edit_banners` - Banner edit/toggle karne ki permission
- `delete_banners` - Banner delete karne ki permission

### Videos Management
- `view_videos` - Videos list dekhne ki permission
- `create_videos` - Naya video create karne ki permission
- `edit_videos` - Video edit/toggle karne ki permission
- `delete_videos` - Video delete karne ki permission

### Testimonials Management
- `view_testimonials` - Testimonials list dekhne ki permission
- `create_testimonials` - Naya testimonial create karne ki permission
- `edit_testimonials` - Testimonial edit/toggle karne ki permission
- `delete_testimonials` - Testimonial delete karne ki permission

### FAQs Management
- `view_faqs` - FAQs list dekhne ki permission
- `create_faqs` - Naya FAQ create karne ki permission
- `edit_faqs` - FAQ edit/toggle karne ki permission
- `delete_faqs` - FAQ delete karne ki permission

### Company Management
- `view_company` - Company info dekhne ki permission
- `edit_company` - Company info update karne ki permission

### Legal Pages Management
- `view_legal_pages` - Legal pages dekhne ki permission
- `edit_legal_pages` - Legal pages update karne ki permission

### Contact Submissions
- `view_contacts` - Contact submissions dekhne ki permission
- `edit_contacts` - Contact status update karne ki permission
- `delete_contacts` - Contact delete karne ki permission

### Reviews Management
- `view_reviews` - Reviews list dekhne ki permission
- `edit_reviews` - Review edit karne ki permission
- `delete_reviews` - Review delete karne ki permission
- `approve_reviews` - Review approve karne ki permission (future use)
- `reject_reviews` - Review reject karne ki permission (future use)

### Review Replies Management
- `view_review_replies` - Review replies dekhne ki permission
- `create_review_replies` - Review reply create karne ki permission
- `edit_review_replies` - Review reply edit karne ki permission
- `delete_review_replies` - Review reply delete karne ki permission

### Categories Management
- `view_categories` - Categories list dekhne ki permission
- `create_categories` - Naya category create karne ki permission
- `edit_categories` - Category edit karne ki permission
- `delete_categories` - Category delete karne ki permission

### Menus Management
- `view_menus` - Menus list dekhne ki permission
- `create_menus` - Naya menu create karne ki permission
- `edit_menus` - Menu edit karne ki permission
- `delete_menus` - Menu delete karne ki permission

### Roles Management
- `view_roles` - Roles list dekhne ki permission
- `create_roles` - Naya role create karne ki permission
- `edit_roles` - Role edit karne ki permission
- `delete_roles` - Role delete karne ki permission

### Staff Management
- `view_staff` - Staff list dekhne ki permission
- `create_staff` - Naya staff create karne ki permission
- `edit_staff` - Staff edit karne ki permission
- `delete_staff` - Staff delete karne ki permission

---

## Predefined Role Templates

### SUPER_ADMIN
Saare permissions - Complete access to everything.

### MANAGER
Most permissions except:
- Role management (view_roles, create_roles, edit_roles, delete_roles)
- Staff management (view_staff, create_staff, edit_staff, delete_staff)
- Settings (view_settings, edit_settings)

### SUPPORT
Limited permissions:
- Dashboard
- View users
- View bookings
- View leads
- Edit leads
- View contacts
- Edit contacts

### CONTENT_MANAGER
Content-related permissions:
- Dashboard
- Banners (all)
- Videos (all)
- Testimonials (all)
- FAQs (all)

### BOOKING_MANAGER
Booking-focused permissions:
- Dashboard
- Bookings (all)
- Leads (all)
- View venues
- View vendors

---

## Usage Example

### Creating a Role with Permissions

```javascript
POST /api/admin/roles
{
  "name": "Manager",
  "permissions": [
    "view_dashboard",
    "view_users",
    "edit_users",
    "view_vendors",
    "edit_vendors",
    "view_venues",
    "edit_venues",
    "view_bookings",
    "edit_bookings",
    "approve_bookings",
    "reject_bookings"
  ],
  "description": "Manager role with booking and user management"
}
```

### Using Role Templates

Frontend me aap directly `ROLE_TEMPLATES.MANAGER` use kar sakte ho:

```javascript
// Get available permissions
const response = await fetch('/api/admin/roles/permissions/available');
const { roleTemplates } = await response.json();

// Use template
const managerRole = {
  name: "Manager",
  permissions: roleTemplates.MANAGER
};
```

---

## Notes

1. **Admin Role**: Admin automatically has ALL permissions - no need to check permissions for admin.
2. **Staff Role**: Staff ke permissions unke assigned role se aate hain.
3. **Permission Check**: Har protected route pe `requirePermission()` middleware use hota hai.
4. **JWT Token**: Staff login karte waqt unke permissions JWT token me include hote hain.

---

## Total Permissions Count
**88 permissions** total available hain admin panel me.

### New Permissions Added:

**Approval Permissions:**
- `approve_vendors` - Vendor approve karne ke liye separate permission
- `reject_vendors` - Vendor reject karne ke liye separate permission
- `approve_venues` - Venue approve karne ke liye separate permission
- `reject_venues` - Venue reject karne ke liye separate permission

**Review Management Permissions:**
- `view_reviews` - Reviews list dekhne ki permission
- `edit_reviews` - Review edit karne ki permission
- `delete_reviews` - Review delete karne ki permission
- `approve_reviews` - Review approve karne ki permission (future use)
- `reject_reviews` - Review reject karne ki permission (future use)

**Review Reply Permissions:**
- `view_review_replies` - Review replies dekhne ki permission
- `create_review_replies` - Review reply create karne ki permission
- `edit_review_replies` - Review reply edit karne ki permission
- `delete_review_replies` - Review reply delete karne ki permission

**Category Management Permissions:**
- `view_categories` - Categories list dekhne ki permission
- `create_categories` - Category create karne ki permission
- `edit_categories` - Category edit karne ki permission
- `delete_categories` - Category delete karne ki permission

**Menu Management Permissions:**
- `view_menus` - Menus list dekhne ki permission
- `create_menus` - Menu create karne ki permission
- `edit_menus` - Menu edit karne ki permission
- `delete_menus` - Menu delete karne ki permission

Ab aap vendors, venues, bookings, reviews, review replies, categories, aur menus ko alag-alag permissions se control kar sakte ho!


# Wedding Venue - Unified Frontend

यह एक unified React application है जो तीनों sections को एक साथ handle करता है:
- **Customer/Venue Book** - Root routes (`/`)
- **Admin** - `/admin/*` routes
- **Vendor** - `/vendor/*` routes

## Structure

```
src/
├── components/
│   ├── admin/        # Admin components
│   ├── customer/     # Customer/Venue Book components
│   └── vendor/       # Vendor components
├── pages/
│   ├── admin/        # Admin pages
│   ├── customer/     # Customer pages
│   └── vendor/       # Vendor pages
├── services/
│   ├── admin/        # Admin API services
│   ├── customer/    # Customer API services
│   └── vendor/       # Vendor API services
├── utils/            # Shared utilities
├── contexts/         # React contexts (vendor)
├── hooks/            # Custom hooks (vendor)
├── layouts/         # Layout components (admin)
└── config/          # Configuration files (Firebase)
```

## Routes

### Customer Routes (Root)
- `/` - Home
- `/venue/:slug` - Venue Detail
- `/venues` - Venue Listing
- `/profile` - User Profile
- `/booking` - Booking Page
- `/booking-history` - Booking History
- `/about-us` - About Us
- `/how-it-works` - How It Works
- `/blog` - Blog
- `/privacy-policy` - Privacy Policy
- `/terms-of-service` - Terms of Service
- `/cookie-policy` - Cookie Policy
- `/contact-us` - Contact Us

### Admin Routes (`/admin/*`)
- `/admin/login` - Admin Login
- `/admin/dashboard` - Admin Dashboard
- `/admin/users` - Users Management
- `/admin/vendors` - Vendors Management
- `/admin/venues` - Venues Management
- `/admin/bookings` - Bookings Management
- `/admin/leads` - Leads Management
- `/admin/payouts` - Payouts Management
- `/admin/analytics` - Analytics
- `/admin/settings` - Settings
- `/admin/categories` - Categories
- `/admin/menus` - Menus
- `/admin/videos` - Videos
- `/admin/testimonials` - Testimonials
- `/admin/faqs` - FAQs
- `/admin/company` - Company Info
- `/admin/contacts` - Contacts
- `/admin/banners` - Banners

### Vendor Routes (`/vendor/*`)
- `/vendor/login` - Vendor Login
- `/vendor/register` - Vendor Registration
- `/vendor/` - Vendor Dashboard
- `/vendor/venues` - Vendor Venues
- `/vendor/bookings` - Vendor Bookings
- `/vendor/payouts` - Vendor Payouts
- `/vendor/calendar` - Calendar
- `/vendor/ledger` - Ledger
- `/vendor/reviews` - Reviews
- `/vendor/settings` - Settings

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Features

- ✅ Three-in-one unified React application
- ✅ Separate route prefixes for each section
- ✅ Shared components and utilities
- ✅ Firebase integration for vendor and customer
- ✅ Admin authentication with token
- ✅ Vendor authentication with Firebase
- ✅ Customer booking system
- ✅ Responsive design with Tailwind CSS


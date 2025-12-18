### API Catalog (v1) — Wedding Venue Backend

- Base URL: `/api`

- Health
  - GET `/api/health`: Service health check.

- Auth
  - POST `/api/auth/register`: Create user account (customer/vendor/affiliate).
  - POST `/api/auth/login`: Login, returns JWT.
  - GET `/api/auth/profile`: Get authenticated user profile.

- Vendor • Venues
  - POST `/api/vendor/venues`: Create venue (vendor).
  - GET `/api/vendor/venues`: List vendor venues (own).
  - GET `/api/vendor/venues/:id`: Get venue by id (own).
  - PUT `/api/vendor/venues/:id`: Update venue (vendor).
  - DELETE `/api/vendor/venues/:id`: Delete venue (vendor).

- Bookings
  - POST `/api/bookings`: Create booking (customer) — checks availability.
  - GET `/api/bookings`: List bookings (role-aware).
  - GET `/api/bookings/:id`: Get booking details.
  - PUT `/api/bookings/:id/status`: Update booking status (confirm/cancel).

- Affiliate
  - POST `/api/affiliate/customers`: Add customer on behalf (affiliate).
  - GET `/api/affiliate/bookings`: Affiliate bookings view.
  - GET `/api/affiliate/earnings`: Affiliate earnings summary.

- Admin
  - GET `/api/admin/dashboard`: KPIs overview.
  - GET `/api/admin/users`: Manage users.
  - GET `/api/admin/vendors`: Manage vendors.
  - POST `/api/admin/vendors`: Create vendor (admin).
  - GET `/api/admin/venues/:id`: Get venue detail (admin).
  - PUT `/api/admin/venues/:id`: Update venue (admin).
  - DELETE `/api/admin/venues/:id`: Delete venue (admin).
  - PUT `/api/admin/venues/approve/:id`: Approve/Reject venue.
  - POST `/api/admin/venues`: Create venue (admin, assign to vendor via `vendorId`).
  - GET `/api/admin/payouts`: View payouts.

- Payments (Razorpay)
  - POST `/api/payment/create-order`: Create Razorpay order.
  - POST `/api/payment/verify`: Verify payment signature and update booking.

- AI Gateway
  - POST `/api/ai/recommend`: Venue recommendations.
  - POST `/api/ai/pricing`: Dynamic pricing suggestion.
  - POST `/api/ai/leadscore`: Lead scoring.
  - POST `/api/ai/review-sentiment`: Review sentiment.
  - POST `/api/ai/visual-search`: Visual search by image.
  - POST `/api/ai/autocontent`: Auto-generate content/snippets.

Notes:
- Many routes are scaffolded and return 501 until implemented.
- Auth-protected routes will require `Authorization: Bearer <token>` once enabled.



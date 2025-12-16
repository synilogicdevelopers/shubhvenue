# 📋 Wedding Venue Backend - सभी APIs का Consolidated Document

**Base URL:** `http://192.168.29.20:4000/api` (या आपका server URL)

**Authentication:** ज्यादातर APIs के लिए JWT token required है। Header में `Authorization: Bearer <token>` भेजें।

---

## 📑 Table of Contents
1. [Health Check](#1-health-check)
2. [Authentication APIs](#2-authentication-apis)
3. [Venue APIs](#3-venue-apis)
4. [Booking APIs](#4-booking-apis)
5. [Payment APIs](#5-payment-apis)
6. [Vendor APIs](#6-vendor-apis)
7. [Admin APIs](#7-admin-apis)
8. [Category APIs](#8-category-apis)
9. [Banner APIs](#9-banner-apis)
10. [Video APIs](#10-video-apis)
11. [Testimonial APIs](#11-testimonial-apis)
12. [FAQ APIs](#12-faq-apis)
13. [Company APIs](#13-company-apis)
14. [Legal Pages APIs](#14-legal-pages-apis)
15. [Contact APIs](#15-contact-apis)
16. [Google Maps APIs](#16-google-maps-apis)
17. [Review APIs](#17-review-apis)
18. [Affiliate APIs](#18-affiliate-apis)
19. [AI Gateway APIs](#19-ai-gateway-apis)

---

## 1. Health Check

### GET /api/health
**Auth:** ❌ Not Required  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "status": "ok",
  "service": "wedding-venue-backend",
  "uptime": 3600.5
}
```

---

## 2. Authentication APIs

### POST /api/auth/register
**Auth:** ❌ Not Required  
**Status:** ✅ Implemented

**Input:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "1234567890",
  "role": "customer"  // options: customer, vendor, affiliate, admin
}
```

**Output (201):**
```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6912ed3ee9dd92f55ddff763",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "role": "customer",
    "verified": false
  }
}
```

**Errors:** 400 (Validation), 409 (User exists), 503 (DB unavailable)

---

### POST /api/auth/login
**Auth:** ❌ Not Required  
**Status:** ✅ Implemented

**Input:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Output (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6912ed3ee9dd92f55ddff763",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "role": "customer",
    "verified": false
  }
}
```

**Errors:** 400 (Missing fields), 401 (Invalid credentials), 503 (DB unavailable)

---

### POST /api/auth/google-login
**Auth:** ❌ Not Required  
**Status:** ✅ Implemented

**Input:**
```json
{
  "idToken": "google_id_token_here"
}
```

**Output (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6912ed3ee9dd92f55ddff763",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

**Errors:** 400 (Invalid token), 401 (Invalid credentials)

---

### GET /api/auth/profile
**Auth:** ✅ Required  
**Status:** ✅ Implemented

**Input:** None (token in header)

**Output (200):**
```json
{
  "user": {
    "id": "6912ed3ee9dd92f55ddff763",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "role": "customer",
    "verified": false
  }
}
```

**Errors:** 401 (Unauthorized)

---

### PUT /api/auth/profile
**Auth:** ✅ Required  
**Status:** ✅ Implemented

**Input:**
```json
{
  "name": "John Updated",
  "phone": "9876543210"
}
```

**Output (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "6912ed3ee9dd92f55ddff763",
    "name": "John Updated",
    "email": "john@example.com",
    "phone": "9876543210",
    "role": "customer"
  }
}
```

**Errors:** 400 (Validation), 401 (Unauthorized)

---

### PUT /api/auth/change-password
**Auth:** ✅ Required  
**Status:** ✅ Implemented

**Input:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Output (200):**
```json
{
  "message": "Password changed successfully"
}
```

**Errors:** 400 (Validation), 401 (Unauthorized/Invalid password)

---

## 3. Venue APIs

### GET /api/vendor/venues
**Auth:** ⚠️ Optional  
**Status:** ✅ Implemented

**Query Params:**
- `state` (optional) - Filter by state
- `city` (optional) - Filter by city
- `category` (optional) - Filter by category
- `minPrice` (optional) - Minimum price
- `maxPrice` (optional) - Maximum price
- `guests` (optional) - Minimum guest capacity
- `page` (optional) - Page number
- `limit` (optional) - Items per page

**Input:** None (query params in URL)

**Output (200):**
```json
{
  "success": true,
  "count": 10,
  "venues": [
    {
      "_id": "6912ed3ee9dd92f55ddff764",
      "name": "Grand Wedding Hall",
      "description": "Beautiful venue",
      "state": "Maharashtra",
      "city": "Mumbai",
      "price": 50000,
      "capacity": 500,
      "images": ["/uploads/venues/image1.jpg"],
      "videos": ["/uploads/venues/video1.mp4"],
      "status": "approved",
      "vendorId": "6912ed3ee9dd92f55ddff763"
    }
  ]
}
```

---

### GET /api/vendor/venues/:id
**Auth:** ⚠️ Optional  
**Status:** ✅ Implemented

**Input:** None (ID in URL)

**Output (200):**
```json
{
  "success": true,
  "venue": {
    "_id": "6912ed3ee9dd92f55ddff764",
    "name": "Grand Wedding Hall",
    "description": "Beautiful venue",
    "state": "Maharashtra",
    "city": "Mumbai",
    "price": 50000,
    "capacity": 500,
    "images": ["/uploads/venues/image1.jpg"],
    "videos": ["/uploads/venues/video1.mp4"],
    "status": "approved"
  }
}
```

**Errors:** 404 (Venue not found)

---

### POST /api/vendor/venues
**Auth:** ✅ Required (Vendor)  
**Status:** ✅ Implemented

**Input (multipart/form-data):**
```json
{
  "name": "Grand Wedding Hall",
  "description": "Beautiful venue",
  "state": "Maharashtra",
  "city": "Mumbai",
  "address": "123 Main St",
  "price": 50000,
  "capacity": 500,
  "category": "6912ed3ee9dd92f55ddff769",
  "amenities": ["AC", "Parking", "DJ"],
  "images": [File, File],  // multipart files
  "videos": [File]  // multipart files
}
```

**Output (201):**
```json
{
  "success": true,
  "message": "Venue created successfully",
  "venue": {
    "_id": "6912ed3ee9dd92f55ddff764",
    "name": "Grand Wedding Hall",
    "status": "pending"
  }
}
```

**Errors:** 400 (Validation), 401 (Unauthorized), 403 (Not vendor)

---

### PUT /api/vendor/venues/:id
**Auth:** ✅ Required (Vendor, Own Venue)  
**Status:** ✅ Implemented

**Input (multipart/form-data):** Same as POST

**Output (200):**
```json
{
  "success": true,
  "message": "Venue updated successfully",
  "venue": { ... }
}
```

**Errors:** 400 (Validation), 401 (Unauthorized), 403 (Not owner), 404 (Not found)

---

### PATCH /api/vendor/venues/:id/toggle-status
**Auth:** ✅ Required (Vendor, Own Venue)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "message": "Venue status toggled",
  "venue": { ... }
}
```

---

### DELETE /api/vendor/venues/:id
**Auth:** ✅ Required (Vendor, Own Venue)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "message": "Venue deleted successfully"
}
```

---

### GET /api/vendor/venues/states
**Auth:** ❌ Not Required  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "states": ["Maharashtra", "Delhi", "Karnataka", ...]
}
```

---

### GET /api/vendor/venues/cities
**Auth:** ❌ Not Required  
**Status:** ✅ Implemented

**Query Params:** `state` (required)

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "cities": ["Mumbai", "Pune", "Nagpur", ...]
}
```

---

### GET /api/vendor/venues/search
**Auth:** ❌ Not Required  
**Status:** ✅ Implemented

**Query Params:**
- `q` (optional) - Search query
- `state` (optional)
- `city` (optional)
- `category` (optional)
- `minPrice` (optional)
- `maxPrice` (optional)
- `guests` (optional)

**Input:** None

**Output (200):** Same as GET /api/vendor/venues

---

### GET /api/vendor/venues/search/suggestions
**Auth:** ❌ Not Required  
**Status:** ✅ Implemented

**Query Params:** `q` (required)

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "suggestions": ["Mumbai", "Grand Wedding Hall", "Maharashtra"]
}
```

---

## 4. Booking APIs

### POST /api/bookings
**Auth:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Input:**
```json
{
  "venueId": "6912ed3ee9dd92f55ddff764",
  "date": "2025-12-25",
  "dateFrom": "2025-12-25",
  "dateTo": "2025-12-26",
  "name": "Customer Name",
  "phone": "9876543210",
  "marriageFor": "boy",
  "personName": "Person Name",
  "eventType": "wedding",
  "guests": 300,
  "rooms": 10,
  "foodPreference": "both",
  "totalAmount": 50000,
  "paymentId": "pay_123",  // Optional - if provided creates Booking, else creates Lead
  "deviceId": "device_unique_id"
}
```

**Output (201):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "booking": {
    "_id": "6912ed3ee9dd92f55ddff765",
    "venueId": "6912ed3ee9dd92f55ddff764",
    "date": "2025-12-25T00:00:00.000Z",
    "guests": 300,
    "totalAmount": 50000,
    "status": "pending",
    "paymentStatus": "paid"
  }
}
```

**Errors:** 400 (Validation), 409 (Venue already booked)

---

### GET /api/bookings
**Auth:** ⚠️ Optional (Role-aware)  
**Status:** ✅ Implemented

**Query Params:**
- `status` (optional) - Filter by status
- `page` (optional)
- `limit` (optional)

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "count": 10,
  "bookings": [
    {
      "_id": "6912ed3ee9dd92f55ddff765",
      "venueId": { ... },
      "customerId": { ... },
      "date": "2025-12-25T00:00:00.000Z",
      "guests": 300,
      "totalAmount": 50000,
      "status": "pending"
    }
  ]
}
```

---

### GET /api/bookings/:id
**Auth:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "booking": {
    "_id": "6912ed3ee9dd92f55ddff765",
    "venueId": { ... },
    "customerId": { ... },
    "date": "2025-12-25T00:00:00.000Z",
    "guests": 300,
    "totalAmount": 50000,
    "status": "pending"
  }
}
```

**Errors:** 404 (Not found)

---

### PUT /api/bookings/:id/status
**Auth:** ✅ Required  
**Status:** ✅ Implemented

**Input:**
```json
{
  "status": "confirmed"  // or "cancelled"
}
```

**Output (200):**
```json
{
  "success": true,
  "message": "Booking status updated",
  "booking": { ... }
}
```

**Errors:** 400 (Invalid status), 401 (Unauthorized), 404 (Not found)

---

### GET /api/bookings/count/device/:deviceId
**Auth:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "count": 5
}
```

---

### POST /api/bookings/convert-lead
**Auth:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Input:**
```json
{
  "leadId": "6912ed3ee9dd92f55ddff766",
  "razorpay_order_id": "order_123",
  "razorpay_payment_id": "pay_123",
  "razorpay_signature": "signature_123"
}
```

**Output (200):**
```json
{
  "success": true,
  "message": "Lead converted to booking",
  "booking": { ... }
}
```

---

## 5. Payment APIs

### GET /api/payment/config
**Auth:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "razorpayKeyId": "rzp_test_1234567890"
}
```

---

### POST /api/payment/create-order
**Auth:** ⚠️ Optional  
**Status:** ✅ Implemented

**Input:**
```json
{
  "amount": 50000,
  "currency": "INR",
  "receipt": "receipt_123"
}
```

**Output (200):**
```json
{
  "success": true,
  "order": {
    "id": "order_123",
    "amount": 50000,
    "currency": "INR",
    "receipt": "receipt_123",
    "status": "created"
  }
}
```

**Errors:** 400 (Validation), 500 (Razorpay error)

---

### POST /api/payment/verify
**Auth:** ⚠️ Optional  
**Status:** ✅ Implemented

**Input:**
```json
{
  "razorpay_order_id": "order_123",
  "razorpay_payment_id": "pay_123",
  "razorpay_signature": "signature_123",
  "bookingData": {
    "venueId": "6912ed3ee9dd92f55ddff764",
    "date": "2025-12-25",
    "guests": 300,
    "totalAmount": 50000,
    "name": "Customer Name",
    "phone": "9876543210",
    "marriageFor": "boy",
    "eventType": "wedding",
    "foodPreference": "both"
  }
}
```

**Output (200):**
```json
{
  "success": true,
  "message": "Payment verified and booking created",
  "booking": { ... }
}
```

**Errors:** 400 (Verification failed), 409 (Venue booked)

---

### POST /api/payment/verify-lead
**Auth:** ⚠️ Optional  
**Status:** ✅ Implemented

**Input:**
```json
{
  "leadId": "6912ed3ee9dd92f55ddff766",
  "razorpay_order_id": "order_123",
  "razorpay_payment_id": "pay_123",
  "razorpay_signature": "signature_123",
  "customerId": "6912ed3ee9dd92f55ddff763"
}
```

**Output (200):**
```json
{
  "success": true,
  "message": "Payment verified and lead converted",
  "booking": { ... }
}
```

---

## 6. Vendor APIs

### GET /api/vendor/dashboard
**Auth:** ✅ Required (Vendor)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "totalVenues": 5,
  "totalBookings": 25,
  "monthlyRevenue": 500000,
  "commissionPaid": 50000
}
```

---

### GET /api/vendor/bookings
**Auth:** ✅ Required (Vendor)  
**Status:** ✅ Implemented

**Query Params:** `status` (optional)

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "count": 10,
  "bookings": [ ... ]
}
```

---

### POST /api/vendor/bookings
**Auth:** ✅ Required (Vendor)  
**Status:** ✅ Implemented

**Input:**
```json
{
  "venueId": "6912ed3ee9dd92f55ddff764",
  "date": "2025-12-25",
  "name": "Customer Name",
  "phone": "9876543210",
  "guests": 300,
  "totalAmount": 50000
}
```

**Output (201):**
```json
{
  "success": true,
  "message": "Booking created",
  "booking": { ... }
}
```

---

### GET /api/vendor/payouts
**Auth:** ✅ Required (Vendor)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "count": 5,
  "payouts": [
    {
      "_id": "6912ed3ee9dd92f55ddff767",
      "amount": 45000,
      "commission": 5000,
      "payment_status": "paid"
    }
  ]
}
```

---

### GET /api/vendor/ledger
**Auth:** ✅ Required (Vendor)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "ledger": [ ... ]
}
```

---

### POST /api/vendor/ledger
**Auth:** ✅ Required (Vendor)  
**Status:** ✅ Implemented

**Input:**
```json
{
  "type": "income",
  "amount": 5000,
  "description": "Payment received",
  "date": "2025-12-25"
}
```

**Output (201):**
```json
{
  "success": true,
  "message": "Ledger entry added",
  "entry": { ... }
}
```

---

### PUT /api/vendor/ledger/:id
**Auth:** ✅ Required (Vendor)  
**Status:** ✅ Implemented

**Input:**
```json
{
  "type": "expense",
  "amount": 2000,
  "description": "Updated description"
}
```

**Output (200):**
```json
{
  "success": true,
  "message": "Ledger entry updated",
  "entry": { ... }
}
```

---

### DELETE /api/vendor/ledger/:id
**Auth:** ✅ Required (Vendor)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "message": "Ledger entry deleted"
}
```

---

### GET /api/vendor/blocked-dates
**Auth:** ✅ Required (Vendor)  
**Status:** ✅ Implemented

**Query Params:** `venueId` (optional)

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "blockedDates": ["2025-12-25", "2025-12-26"]
}
```

---

### POST /api/vendor/blocked-dates
**Auth:** ✅ Required (Vendor)  
**Status:** ✅ Implemented

**Input:**
```json
{
  "venueId": "6912ed3ee9dd92f55ddff764",
  "dates": ["2025-12-25", "2025-12-26"]
}
```

**Output (200):**
```json
{
  "success": true,
  "message": "Dates blocked",
  "blockedDates": [ ... ]
}
```

---

### DELETE /api/vendor/blocked-dates
**Auth:** ✅ Required (Vendor)  
**Status:** ✅ Implemented

**Input:**
```json
{
  "venueId": "6912ed3ee9dd92f55ddff764",
  "dates": ["2025-12-25"]
}
```

**Output (200):**
```json
{
  "success": true,
  "message": "Dates unblocked"
}
```

---

## 7. Admin APIs

### POST /api/admin/login
**Auth:** ❌ Not Required  
**Status:** ✅ Implemented

**Input:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Output (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6912ed3ee9dd92f55ddff763",
    "name": "Admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

---

### GET /api/admin/dashboard
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 100,
    "totalVendors": 20,
    "totalVenues": 50,
    "totalBookings": 200,
    "totalRevenue": 1000000,
    "pendingVenues": 5,
    "pendingBookings": 10
  }
}
```

---

### GET /api/admin/users
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Query Params:** `role` (optional), `page`, `limit`

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "count": 100,
  "users": [ ... ]
}
```

---

### GET /api/admin/vendors
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "count": 20,
  "vendors": [ ... ]
}
```

---

### GET /api/admin/venues
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Query Params:** `status` (optional)

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "count": 50,
  "venues": [ ... ]
}
```

---

### PUT /api/admin/venues/approve/:id
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "message": "Venue approved",
  "venue": { ... }
}
```

---

### PUT /api/admin/venues/reject/:id
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:**
```json
{
  "reason": "Rejection reason"
}
```

**Output (200):**
```json
{
  "success": true,
  "message": "Venue rejected",
  "venue": { ... }
}
```

---

### GET /api/admin/bookings
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Query Params:** `status` (optional)

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "count": 200,
  "bookings": [ ... ]
}
```

---

### PUT /api/admin/bookings/:id/status
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:**
```json
{
  "status": "confirmed"
}
```

**Output (200):**
```json
{
  "success": true,
  "message": "Booking status updated",
  "booking": { ... }
}
```

---

### PUT /api/admin/bookings/:id/approve
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "message": "Booking approved",
  "booking": { ... }
}
```

---

### PUT /api/admin/bookings/:id/reject
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:**
```json
{
  "reason": "Rejection reason"
}
```

**Output (200):**
```json
{
  "success": true,
  "message": "Booking rejected",
  "booking": { ... }
}
```

---

### GET /api/admin/leads
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Query Params:** `status` (optional)

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "count": 50,
  "leads": [ ... ]
}
```

---

### GET /api/admin/leads/:id
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "lead": { ... }
}
```

---

### PUT /api/admin/leads/:id/status
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:**
```json
{
  "status": "contacted"
}
```

**Output (200):**
```json
{
  "success": true,
  "message": "Lead status updated",
  "lead": { ... }
}
```

---

### POST /api/admin/leads/:id/convert-to-booking
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "message": "Lead converted to booking",
  "booking": { ... }
}
```

---

### GET /api/admin/payouts
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "count": 30,
  "payouts": [ ... ]
}
```

---

### PUT /api/admin/payouts/:id/complete
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "message": "Payout marked as completed",
  "payout": { ... }
}
```

---

### GET /api/admin/analytics
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "analytics": {
    "revenueByMonth": [ ... ],
    "bookingsByStatus": [ ... ],
    "topVenues": [ ... ]
  }
}
```

---

### GET /api/admin/profile
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "user": { ... }
}
```

---

### PUT /api/admin/profile
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:**
```json
{
  "name": "Admin Updated"
}
```

**Output (200):**
```json
{
  "success": true,
  "message": "Profile updated",
  "user": { ... }
}
```

---

### PUT /api/admin/change-password
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

**Output (200):**
```json
{
  "success": true,
  "message": "Password changed"
}
```

---

### GET /api/admin/payment-config
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "config": {
    "razorpayKeyId": "rzp_test_123",
    "razorpayKeySecret": "secret_123"
  }
}
```

---

### PUT /api/admin/payment-config
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:**
```json
{
  "razorpayKeyId": "rzp_test_123",
  "razorpayKeySecret": "secret_123"
}
```

**Output (200):**
```json
{
  "success": true,
  "message": "Payment config updated",
  "config": { ... }
}
```

---

### GET /api/admin/google-maps-config
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "config": {
    "apiKey": "AIzaSy..."
  }
}
```

---

### PUT /api/admin/google-maps-config
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:**
```json
{
  "apiKey": "AIzaSy..."
}
```

**Output (200):**
```json
{
  "success": true,
  "message": "Google Maps config updated",
  "config": { ... }
}
```

---

### GET /api/admin/banners
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "count": 5,
  "banners": [ ... ]
}
```

---

### GET /api/admin/banners/:id
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "banner": { ... }
}
```

---

### POST /api/admin/banners
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input (multipart/form-data):**
```json
{
  "title": "Summer Special",
  "image": File,
  "link": "/venue/123",
  "order": 1,
  "isActive": true
}
```

**Output (201):**
```json
{
  "success": true,
  "message": "Banner created",
  "banner": { ... }
}
```

---

### PUT /api/admin/banners/:id
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input (multipart/form-data):** Same as POST

**Output (200):**
```json
{
  "success": true,
  "message": "Banner updated",
  "banner": { ... }
}
```

---

### DELETE /api/admin/banners/:id
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "message": "Banner deleted"
}
```

---

### PUT /api/admin/banners/:id/toggle-active
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "message": "Banner status toggled",
  "banner": { ... }
}
```

---

### GET /api/admin/videos
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "count": 10,
  "videos": [ ... ]
}
```

---

### GET /api/admin/videos/:id
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "video": { ... }
}
```

---

### POST /api/admin/videos
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input (multipart/form-data):**
```json
{
  "title": "Wedding Video",
  "video": File,
  "description": "Description",
  "isActive": true
}
```

**Output (201):**
```json
{
  "success": true,
  "message": "Video created",
  "video": { ... }
}
```

---

### PUT /api/admin/videos/:id
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input (multipart/form-data):** Same as POST

**Output (200):**
```json
{
  "success": true,
  "message": "Video updated",
  "video": { ... }
}
```

---

### DELETE /api/admin/videos/:id
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "message": "Video deleted"
}
```

---

### PUT /api/admin/videos/:id/toggle-active
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "message": "Video status toggled",
  "video": { ... }
}
```

---

### GET /api/admin/testimonials
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "count": 15,
  "testimonials": [ ... ]
}
```

---

### GET /api/admin/testimonials/:id
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "testimonial": { ... }
}
```

---

### POST /api/admin/testimonials
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:**
```json
{
  "name": "John Doe",
  "rating": 5,
  "comment": "Great venue!",
  "isActive": true
}
```

**Output (201):**
```json
{
  "success": true,
  "message": "Testimonial created",
  "testimonial": { ... }
}
```

---

### PUT /api/admin/testimonials/:id
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** Same as POST

**Output (200):**
```json
{
  "success": true,
  "message": "Testimonial updated",
  "testimonial": { ... }
}
```

---

### DELETE /api/admin/testimonials/:id
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "message": "Testimonial deleted"
}
```

---

### PUT /api/admin/testimonials/:id/toggle-active
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "message": "Testimonial status toggled",
  "testimonial": { ... }
}
```

---

### GET /api/admin/faqs
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "count": 20,
  "faqs": [ ... ]
}
```

---

### GET /api/admin/faqs/:id
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "faq": { ... }
}
```

---

### POST /api/admin/faqs
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:**
```json
{
  "question": "What is the cancellation policy?",
  "answer": "Cancellation allowed 7 days before...",
  "isActive": true
}
```

**Output (201):**
```json
{
  "success": true,
  "message": "FAQ created",
  "faq": { ... }
}
```

---

### PUT /api/admin/faqs/:id
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** Same as POST

**Output (200):**
```json
{
  "success": true,
  "message": "FAQ updated",
  "faq": { ... }
}
```

---

### DELETE /api/admin/faqs/:id
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "message": "FAQ deleted"
}
```

---

### PUT /api/admin/faqs/:id/toggle-active
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "message": "FAQ status toggled",
  "faq": { ... }
}
```

---

### GET /api/admin/company
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "company": {
    "name": "Wedding Venue",
    "email": "info@weddingvenue.com",
    "phone": "1234567890",
    "address": "123 Main St",
    "logo": "/uploads/logo.png"
  }
}
```

---

### PUT /api/admin/company
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:**
```json
{
  "name": "Wedding Venue Updated",
  "email": "info@weddingvenue.com",
  "phone": "1234567890",
  "address": "123 Main St"
}
```

**Output (200):**
```json
{
  "success": true,
  "message": "Company info updated",
  "company": { ... }
}
```

---

### GET /api/admin/legal-pages
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "legalPages": [
    {
      "type": "privacy",
      "title": "Privacy Policy",
      "content": "..."
    }
  ]
}
```

---

### GET /api/admin/legal-pages/:type
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "legalPage": {
    "type": "privacy",
    "title": "Privacy Policy",
    "content": "..."
  }
}
```

---

### PUT /api/admin/legal-pages/:type
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:**
```json
{
  "title": "Privacy Policy Updated",
  "content": "Updated content..."
}
```

**Output (200):**
```json
{
  "success": true,
  "message": "Legal page updated",
  "legalPage": { ... }
}
```

---

### GET /api/admin/contacts
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Query Params:** `status` (optional)

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "count": 50,
  "contacts": [ ... ]
}
```

---

### GET /api/admin/contacts/:id
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "contact": { ... }
}
```

---

### PUT /api/admin/contacts/:id/status
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:**
```json
{
  "status": "contacted"  // or "resolved"
}
```

**Output (200):**
```json
{
  "success": true,
  "message": "Contact status updated",
  "contact": { ... }
}
```

---

### DELETE /api/admin/contacts/:id
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "message": "Contact deleted"
}
```

---

## 8. Category APIs

### GET /api/categories
**Auth:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "count": 10,
  "categories": [
    {
      "_id": "6912ed3ee9dd92f55ddff769",
      "name": "Banquet Hall",
      "description": "Description",
      "image": "/uploads/categories/category1.jpg"
    }
  ]
}
```

---

### GET /api/categories/:id
**Auth:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "category": { ... }
}
```

---

### POST /api/categories
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input (multipart/form-data):**
```json
{
  "name": "Banquet Hall",
  "description": "Description",
  "image": File
}
```

**Output (201):**
```json
{
  "success": true,
  "message": "Category created",
  "category": { ... }
}
```

---

### PUT /api/categories/:id
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input (multipart/form-data):** Same as POST

**Output (200):**
```json
{
  "success": true,
  "message": "Category updated",
  "category": { ... }
}
```

---

### DELETE /api/categories/:id
**Auth:** ✅ Required (Admin)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "message": "Category deleted"
}
```

---

## 9. Banner APIs

### GET /api/banners
**Auth:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "banners": [
    {
      "_id": "6912ed3ee9dd92f55ddff768",
      "title": "Summer Wedding Special",
      "image": "/uploads/banners/banner1.jpg",
      "link": "/venue/6912ed3ee9dd92f55ddff764",
      "isActive": true,
      "order": 1
    }
  ]
}
```

---

### GET /api/banners/:id
**Auth:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "banner": { ... }
}
```

---

## 10. Video APIs

### GET /api/videos
**Auth:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "videos": [
    {
      "_id": "6912ed3ee9dd92f55ddff770",
      "title": "Wedding Video",
      "video": "/uploads/videos/video1.mp4",
      "description": "Description",
      "isActive": true
    }
  ]
}
```

---

### GET /api/videos/:id
**Auth:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "video": { ... }
}
```

---

## 11. Testimonial APIs

### GET /api/testimonials
**Auth:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "testimonials": [
    {
      "_id": "6912ed3ee9dd92f55ddff771",
      "name": "John Doe",
      "rating": 5,
      "comment": "Great venue!",
      "isActive": true
    }
  ]
}
```

---

### GET /api/testimonials/:id
**Auth:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "testimonial": { ... }
}
```

---

## 12. FAQ APIs

### GET /api/faqs
**Auth:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "faqs": [
    {
      "_id": "6912ed3ee9dd92f55ddff772",
      "question": "What is the cancellation policy?",
      "answer": "Cancellation allowed 7 days before...",
      "isActive": true
    }
  ]
}
```

---

### GET /api/faqs/:id
**Auth:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "faq": { ... }
}
```

---

## 13. Company APIs

### GET /api/company
**Auth:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "company": {
    "name": "Wedding Venue",
    "email": "info@weddingvenue.com",
    "phone": "1234567890",
    "address": "123 Main St",
    "logo": "/uploads/logo.png"
  }
}
```

---

## 14. Legal Pages APIs

### GET /api/legal-pages/:type
**Auth:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**URL Params:** `type` (privacy, terms, refund, etc.)

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "legalPage": {
    "type": "privacy",
    "title": "Privacy Policy",
    "content": "..."
  }
}
```

---

## 15. Contact APIs

### POST /api/contact
**Auth:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Input:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "subject": "Inquiry",
  "message": "I want to know about..."
}
```

**Output (201):**
```json
{
  "success": true,
  "message": "Thank you for contacting us! We will get back to you soon.",
  "contact": {
    "id": "6912ed3ee9dd92f55ddff773",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

### GET /api/contact/:id
**Auth:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "contact": { ... }
}
```

---

### GET /api/contact/by-email
**Auth:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Query Params:** `email` (required)

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "contacts": [ ... ]
}
```

---

## 16. Google Maps APIs

### GET /api/maps/suggestions
**Auth:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Query Params:** `input` (required) - Search query

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "suggestions": [
    {
      "place_id": "ChIJ...",
      "description": "Mumbai, Maharashtra, India"
    }
  ]
}
```

---

### GET /api/maps/details
**Auth:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Query Params:** `placeId` (required)

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "details": {
    "formatted_address": "Mumbai, Maharashtra, India",
    "geometry": {
      "location": {
        "lat": 19.0760,
        "lng": 72.8777
      }
    }
  }
}
```

---

### GET /api/maps/api-key
**Auth:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "apiKey": "AIzaSy..."
}
```

---

## 17. Review APIs

### GET /api/reviews
**Auth:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Query Params:** `venueId` (optional)

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "count": 20,
  "reviews": [
    {
      "_id": "6912ed3ee9dd92f55ddff774",
      "venueId": "6912ed3ee9dd92f55ddff764",
      "userId": "6912ed3ee9dd92f55ddff763",
      "rating": 5,
      "comment": "Great venue!",
      "replies": []
    }
  ]
}
```

---

### GET /api/reviews/:id
**Auth:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "review": { ... }
}
```

---

### GET /api/reviews/venue/:venueId
**Auth:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "count": 10,
  "reviews": [ ... ]
}
```

---

### POST /api/reviews
**Auth:** ✅ Required  
**Status:** ✅ Implemented

**Input:**
```json
{
  "venueId": "6912ed3ee9dd92f55ddff764",
  "rating": 5,
  "comment": "Great venue!"
}
```

**Output (201):**
```json
{
  "success": true,
  "message": "Review created",
  "review": { ... }
}
```

---

### GET /api/reviews/user/:userId
**Auth:** ✅ Required  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "count": 5,
  "reviews": [ ... ]
}
```

---

### GET /api/reviews/vendor/all
**Auth:** ✅ Required (Vendor)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "count": 15,
  "reviews": [ ... ]
}
```

---

### PUT /api/reviews/:id
**Auth:** ✅ Required (Owner)  
**Status:** ✅ Implemented

**Input:**
```json
{
  "rating": 4,
  "comment": "Updated comment"
}
```

**Output (200):**
```json
{
  "success": true,
  "message": "Review updated",
  "review": { ... }
}
```

---

### DELETE /api/reviews/:id
**Auth:** ✅ Required (Owner)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "message": "Review deleted"
}
```

---

### POST /api/reviews/:id/reply
**Auth:** ✅ Required (Vendor)  
**Status:** ✅ Implemented

**Input:**
```json
{
  "reply": "Thank you for your feedback!"
}
```

**Output (200):**
```json
{
  "success": true,
  "message": "Reply added",
  "review": { ... }
}
```

---

### PUT /api/reviews/:id/reply
**Auth:** ✅ Required (Vendor)  
**Status:** ✅ Implemented

**Input:**
```json
{
  "reply": "Updated reply"
}
```

**Output (200):**
```json
{
  "success": true,
  "message": "Reply updated",
  "review": { ... }
}
```

---

### DELETE /api/reviews/:id/reply
**Auth:** ✅ Required (Vendor)  
**Status:** ✅ Implemented

**Input:** None

**Output (200):**
```json
{
  "success": true,
  "message": "Reply deleted",
  "review": { ... }
}
```

---

## 18. Affiliate APIs

### POST /api/affiliate/customers
**Auth:** ✅ Required (Affiliate)  
**Status:** ❌ Not Implemented (501)

**Output (501):**
```json
{
  "error": "Not implemented"
}
```

---

### GET /api/affiliate/bookings
**Auth:** ✅ Required (Affiliate)  
**Status:** ❌ Not Implemented (501)

**Output (501):**
```json
{
  "error": "Not implemented"
}
```

---

### GET /api/affiliate/earnings
**Auth:** ✅ Required (Affiliate)  
**Status:** ❌ Not Implemented (501)

**Output (501):**
```json
{
  "error": "Not implemented"
}
```

---

## 19. AI Gateway APIs

### POST /api/ai/recommend
**Auth:** ✅ Required  
**Status:** ❌ Not Implemented (501)

**Expected Input:**
```json
{
  "budget": 50000,
  "guests": 300,
  "location": "Mumbai",
  "preferences": ["AC", "Parking"]
}
```

**Output (501):**
```json
{
  "error": "Not implemented"
}
```

---

### POST /api/ai/pricing
**Auth:** ✅ Required  
**Status:** ❌ Not Implemented (501)

**Output (501):**
```json
{
  "error": "Not implemented"
}
```

---

### POST /api/ai/leadscore
**Auth:** ✅ Required  
**Status:** ❌ Not Implemented (501)

**Output (501):**
```json
{
  "error": "Not implemented"
}
```

---

### POST /api/ai/review-sentiment
**Auth:** ✅ Required  
**Status:** ❌ Not Implemented (501)

**Output (501):**
```json
{
  "error": "Not implemented"
}
```

---

### POST /api/ai/visual-search
**Auth:** ✅ Required  
**Status:** ❌ Not Implemented (501)

**Output (501):**
```json
{
  "error": "Not implemented"
}
```

---

### POST /api/ai/autocontent
**Auth:** ✅ Required  
**Status:** ❌ Not Implemented (501)

**Output (501):**
```json
{
  "error": "Not implemented"
}
```

---

## 📝 Common Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized" // or "Invalid credentials" or "Invalid token"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied" // or "Only vendors can create venues"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 409 Conflict
```json
{
  "error": "User with this email already exists" // or "Venue is already booked for this date"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

### 501 Not Implemented
```json
{
  "error": "Not implemented"
}
```

### 503 Service Unavailable
```json
{
  "error": "Database connection unavailable"
}
```

---

## 🔑 Authentication

ज्यादातर APIs के लिए JWT token required है। Header में भेजें:

```
Authorization: Bearer <your_token_here>
```

**Token कैसे मिलेगा:**
- Register करने पर: `POST /api/auth/register` response में `token` मिलेगा
- Login करने पर: `POST /api/auth/login` response में `token` मिलेगा
- Google Login करने पर: `POST /api/auth/google-login` response में `token` मिलेगा

---

## 📊 API Summary

- **Total APIs:** 100+
- **Public APIs:** ~30
- **Protected APIs:** ~70
- **Implemented:** ~90
- **Not Implemented:** ~10 (AI Gateway, Affiliate)

---

**Last Updated:** 2025-01-11


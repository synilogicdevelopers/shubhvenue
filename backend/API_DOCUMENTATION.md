# 📚 Wedding Venue Backend - Complete API Documentation

**Base URL:** `http://192.168.29.20:4000/api` (या आपका server URL)

**Authentication:** ज्यादातर APIs के लिए JWT token required है। Header में `Authorization: Bearer <token>` भेजें。

---

## 🏪 Vendor Login Guide (Vendor कैसे Login करे)

### Step 1: Vendor Registration (पहली बार)
अगर vendor का account नहीं है, तो पहले register करें:

**Endpoint:** `POST /api/auth/register`

**Request:**
```json
{
  "name": "Venue Owner Name",
  "email": "vendor@example.com",
  "password": "vendor123",
  "phone": "9876543210",
  "role": "vendor"  // ⚠️ Important: role "vendor" होना चाहिए
}
```

**Response:**
```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6912ed3ee9dd92f55ddff763",
    "name": "Venue Owner Name",
    "email": "vendor@example.com",
    "phone": "9876543210",
    "role": "vendor",
    "verified": false
  }
}
```

### Step 2: Vendor Login (हर बार)
Vendor login करने के लिए **same endpoint** use करें जो customer use करता है:

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "vendor@example.com",
  "password": "vendor123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6912ed3ee9dd92f55ddff763",
    "name": "Venue Owner Name",
    "email": "vendor@example.com",
    "phone": "9876543210",
    "role": "vendor",  // ✅ Response में role "vendor" दिखेगा
    "verified": false
  }
}
```

### Step 3: Vendor APIs Use करें
Login के बाद मिले token को header में भेजकर vendor APIs use करें:

**Example - Get Vendor's Venues:**
```javascript
fetch('http://192.168.29.20:4000/api/vendor/venues', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

**Note:** 
- ✅ Vendor और Customer दोनों **same login endpoint** (`/api/auth/login`) use करते हैं
- ✅ Login response में `role: "vendor"` check करके vendor identify करें
- ✅ Admin के लिए अलग endpoint है: `/api/admin/login`

---

## 🔐 1. Authentication APIs

### 1.1 Register User
**Endpoint:** `POST /api/auth/register`  
**Authentication:** ❌ Not Required  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "1234567890",
  "role": "customer"  // options: customer, vendor, affiliate, admin
}
```

**Response (201):**
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

**Errors:**
- `400` - Validation error (missing fields, invalid email, password < 6 chars)
- `409` - User already exists
- `503` - Database connection unavailable

---

### 1.2 Login User
**Endpoint:** `POST /api/auth/login`  
**Authentication:** ❌ Not Required  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
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

**Errors:**
- `400` - Email and password required
- `401` - Invalid credentials
- `503` - Database connection unavailable

---

### 1.2.1 Google Login
**Endpoint:** `POST /api/auth/google-login`  
**Authentication:** ❌ Not Required  
**Status:** ✅ Implemented

**Prerequisites:**
- Google OAuth Client ID must be configured in `.env` file as `GOOGLE_CLIENT_ID`
- Frontend must obtain Google ID token using Google Sign-In SDK

**Request Body:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...",
  "role": "customer",  // optional, default: "customer"
  "fcmToken": "fK8xYz9mNpQrStUvWxYz..."  // optional, for push notifications
}
```

**Response (200):**
```json
{
  "message": "Google login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6912ed3ee9dd92f55ddff763",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": null,
    "role": "customer",
    "verified": true,
    "picture": "https://lh3.googleusercontent.com/..."
  }
}
```

**Features:**
- ✅ **Auto-registration:** Automatically creates new user if doesn't exist (same flow as `POST /api/auth/register`)
- ✅ Links Google account to existing email/password account
- ✅ Google emails are automatically verified
- ✅ Returns user profile picture from Google
- ✅ **FCM Token Auto-Save:** FCM token automatically saved/updated if provided in request (no separate FCM API needed)

**Errors:**
- `400` - Google ID token required or invalid role
- `401` - Invalid Google token
- `409` - User with this Google account already exists
- `503` - Database connection unavailable

**Environment Variable Required:**
```
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

**How to Get Google Client ID:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Configure OAuth consent screen
6. Create OAuth 2.0 Client ID for Web application
7. Copy the Client ID to `.env` file

---

### 1.3 Get User Profile
**Endpoint:** `GET /api/auth/profile`  
**Authentication:** ✅ Required (Bearer Token)  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "user": {
    "id": "6912ed3ee9dd92f55ddff763",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "role": "customer",
    "verified": false,
    "createdAt": "2025-11-11T08:00:00.000Z",
    "updatedAt": "2025-11-11T08:00:00.000Z"
  }
}
```

**Errors:**
- `401` - Unauthorized (no token or invalid token)
- `404` - User not found
- `503` - Database connection unavailable

---

### 1.4 Update User Profile
**Endpoint:** `PUT /api/auth/profile`  
**Authentication:** ✅ Required (Bearer Token)  
**Status:** ✅ Implemented

**Request Body (all fields optional):**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "phone": "9876543210"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "6912ed3ee9dd92f55ddff763",
    "name": "Updated Name",
    "email": "updated@example.com",
    "phone": "9876543210",
    "role": "customer",
    "verified": false,
    "createdAt": "2025-11-11T08:00:00.000Z",
    "updatedAt": "2025-11-11T09:00:00.000Z"
  }
}
```

**Validation:**
- ✅ Email format validation (if email is provided)
- ✅ Email uniqueness check (cannot use email that belongs to another user)
- ✅ All fields are optional - only provided fields will be updated

**Errors:**
- `400` - Invalid email format
- `401` - Unauthorized (no token or invalid token)
- `404` - User not found
- `409` - Email already exists
- `503` - Database connection unavailable

---

## 🏢 2. Vendor Venues APIs

### 2.1 Get Venues (List)
**Endpoint:** `GET /api/vendor/venues`  
**Authentication:** ✅ Required (Bearer Token)  
**Status:** ✅ Implemented

**Query Parameters:**
- `location` (optional) - Filter by location string or address (case-insensitive search)
- `city` (optional) - Filter by city name
- `state` (optional) - Filter by state name
- `minPrice` (optional) - Minimum price filter (legacy field)
- `maxPrice` (optional) - Maximum price filter (legacy field)
- `minPricePerPlateVeg` (optional) - Minimum veg price per plate
- `maxPricePerPlateVeg` (optional) - Maximum veg price per plate
- `minPricePerPlateNonVeg` (optional) - Minimum non-veg price per plate
- `maxPricePerPlateNonVeg` (optional) - Maximum non-veg price per plate
- `minCapacity` (optional) - Minimum capacity filter
- `maxCapacity` (optional) - Maximum capacity filter
- `status` (optional) - Filter by status (vendors only: pending/approved/rejected/active)
- `venueType` (optional) - Filter by venue type (e.g., "Banquet Hall", "Garden")
- `tags` (optional) - Filter by tags (can be array or comma-separated)
- `isFeatured` (optional) - Filter featured venues (true/false)
- `minRating` (optional) - Minimum rating (0-5)
- `search` (optional) - General search in name, description, slug
- `page` (optional) - Page number for pagination (default: 1)
- `limit` (optional) - Items per page (default: 50)
- `sortBy` (optional) - Field to sort by (e.g., "name", "rating", "capacity", "createdAt")
- `sortOrder` (optional) - Sort order: "asc" or "desc" (default: "desc")

**Role-based Behavior:**
- **Vendors:** See their own venues (all statuses)
- **Customers/Others:** See only approved or active venues

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "totalCount": 25,
  "page": 1,
  "totalPages": 5,
  "venues": [
    {
      "_id": "6912ed3ee9dd92f55ddff764",
      "vendorId": {
        "_id": "6912ed3ee9dd92f55ddff763",
        "name": "Venue Owner",
        "email": "owner@example.com",
        "phone": "1234567890"
      },
      "name": "The Royal Palace Banquet Hall",
      "slug": "royal-palace-banquet-hall",
      "description": "A luxury wedding venue with indoor and outdoor spaces for grand celebrations.",
      "price": 50000,
      "pricePerPlate": {
        "veg": 1200,
        "nonVeg": 1500
      },
      "venueType": "Banquet Hall",
      "capacity": 500,
      "location": {
        "address": "Near Airport Road, Jaipur, Rajasthan",
        "city": "Jaipur",
        "state": "Rajasthan",
        "country": "India",
        "pincode": "302017",
        "latitude": 26.9124,
        "longitude": 75.7873
      },
      "facilities": ["Parking", "WiFi", "AC Hall", "Bridal Room", "DJ", "Catering"],
      "amenities": ["Valet Parking", "Power Backup", "Changing Rooms", "Security Staff"],
      "images": ["https://example.com/uploads/royal1.jpg", "https://example.com/uploads/royal2.jpg"],
      "gallery": ["https://example.com/uploads/royal1.jpg", "https://example.com/uploads/royal2.jpg"],
      "videos": ["https://example.com/uploads/royal-tour.mp4"],
      "contact": {
        "name": "Rajesh Kumar",
        "phone": "+91 9876543210",
        "email": "rajesh@royalpalace.com"
      },
      "availability": {
        "openDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "openTime": "09:00",
        "closeTime": "23:00"
      },
      "bookingPolicy": {
        "advancePercentage": 30,
        "cancellationPolicy": "Full refund if cancelled 7 days before event"
      },
      "tags": ["luxury", "wedding", "banquet", "5-star"],
      "rating": 4.8,
      "isFeatured": true,
      "status": "active",
      "createdAt": "2025-11-11T08:00:00.000Z",
      "updatedAt": "2025-11-11T08:00:00.000Z"
    }
  ]
}
```

**Example Requests:**
```
GET /api/vendor/venues?city=Jaipur&minCapacity=200&venueType=Banquet Hall
GET /api/vendor/venues?minPricePerPlateVeg=1000&maxPricePerPlateVeg=1500&isFeatured=true
GET /api/vendor/venues?search=royal&page=1&limit=10&sortBy=rating&sortOrder=desc
GET /api/vendor/venues?tags=luxury,wedding&minRating=4.0
```

---

### 2.2 Search Venues (Dedicated Search API)
**Endpoint:** `GET /api/vendor/venues/search`  
**Authentication:** ❌ Not Required (Public API)  
**Status:** ✅ Implemented

**Description:**  
Dedicated search API for venues. Automatically excludes deleted/rejected venues and only shows approved/active venues. Supports text search across multiple fields and location-based filtering.

**Query Parameters:**
- `q` (optional) - Search query text (searches in name, description, about, slug, location, venueType, tags)
- `city` (optional) - Filter by city name (case-insensitive)
- `state` (optional) - Filter by state name (case-insensitive)
- `location` (optional) - General location search (searches in address, city, state, pincode)
- `page` (optional) - Page number for pagination (default: 1)
- `limit` (optional) - Items per page (default: 20)
- `sortBy` (optional) - Field to sort by (e.g., "name", "rating", "createdAt") (default: "createdAt")
- `sortOrder` (optional) - Sort order: "asc" or "desc" (default: "desc")

**Features:**
- ✅ Automatically excludes rejected/deleted venues
- ✅ Only shows approved/active venues
- ✅ Searches across multiple fields (name, description, location, tags, etc.)
- ✅ Location-based filtering (city, state)
- ✅ Pagination support
- ✅ Sorting support

**Response (200):**
```json
{
  "success": true,
  "query": "royal",
  "filters": {
    "city": "Jaipur",
    "state": "Rajasthan",
    "location": null
  },
  "count": 5,
  "totalCount": 15,
  "page": 1,
  "totalPages": 1,
  "limit": 20,
  "venues": [
    {
      "_id": "6912ed3ee9dd92f55ddff764",
      "name": "Royal Wedding Hall",
      "description": "A luxury wedding venue...",
      "location": {
        "address": "123 Main Street",
        "city": "Jaipur",
        "state": "Rajasthan",
        "pincode": "302001"
      },
      "capacity": {
        "minGuests": 100,
        "maxGuests": 500
      },
      "status": "approved",
      "createdAt": "2025-11-11T08:00:00.000Z"
    }
  ]
}
```

**Example Requests:**
```
GET /api/vendor/venues/search?q=royal
GET /api/vendor/venues/search?q=wedding&city=Jaipur
GET /api/vendor/venues/search?city=Mumbai&state=Maharashtra
GET /api/vendor/venues/search?q=banquet&location=Delhi&page=1&limit=10
GET /api/vendor/venues/search?q=garden&sortBy=rating&sortOrder=desc
```

**Errors:**
- `503` - Database connection unavailable
- `504` - Request timeout
- `500` - Internal server error

**Note:**  
- This API automatically filters out venues with status "rejected" or "deleted"
- Only venues with status "approved" or "active" are returned
- Search is case-insensitive
- Multiple filters can be combined (e.g., search query + city + state)

---

### 2.3 Get Single Venue
**Endpoint:** `GET /api/vendor/venues/:id`  
**Authentication:** ✅ Required (Bearer Token)  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "success": true,
  "venue": {
    "_id": "6912ed3ee9dd92f55ddff764",
    "vendorId": {
      "_id": "6912ed3ee9dd92f55ddff763",
      "name": "Venue Owner",
      "email": "owner@example.com",
      "phone": "1234567890"
    },
    "name": "Grand Wedding Hall",
    "price": 50000,
    "location": "Mumbai",
    "capacity": 500,
    "amenities": ["AC", "Parking", "Catering"],
    "gallery": ["image1.jpg", "image2.jpg"],
    "status": "approved",
    "createdAt": "2025-11-11T08:00:00.000Z",
    "updatedAt": "2025-11-11T08:00:00.000Z"
  }
}
```

**Errors:**
- `400` - Invalid venue ID
- `403` - Venue not available (customers can't see non-approved venues)
- `404` - Venue not found

---

### 2.4 Create Venue
**Endpoint:** `POST /api/vendor/venues`  
**Authentication:** ✅ Required (Bearer Token)  
**Role:** ✅ Vendor Only  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "name": "Grand Wedding Hall",
  "price": 50000,
  "location": "Mumbai",
  "capacity": 500,
  "amenities": ["AC", "Parking", "Catering"],
  "gallery": ["image1.jpg", "image2.jpg"]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Venue created successfully. Awaiting admin approval.",
  "venue": {
    "_id": "6912ed3ee9dd92f55ddff764",
    "vendorId": "6912ed3ee9dd92f55ddff763",
    "name": "Grand Wedding Hall",
    "price": 50000,
    "location": "Mumbai",
    "capacity": 500,
    "amenities": ["AC", "Parking", "Catering"],
    "gallery": ["image1.jpg", "image2.jpg"],
    "status": "pending",
    "createdAt": "2025-11-11T08:00:00.000Z"
  }
}
```

**Errors:**
- `400` - Validation error (missing fields, invalid price/capacity)
- `403` - Only vendors can create venues
- `503` - Database connection unavailable

---

### 2.5 Update Venue
**Endpoint:** `PUT /api/vendor/venues/:id`  
**Authentication:** ✅ Required (Bearer Token)  
**Role:** ✅ Vendor Only (own venues)  
**Status:** ✅ Implemented

**Request Body (all fields optional):**
```json
{
  "name": "Updated Venue Name",
  "price": 60000,
  "location": "Delhi",
  "capacity": 600,
  "amenities": ["AC", "Parking", "Catering", "DJ"],
  "gallery": ["image1.jpg", "image2.jpg", "image3.jpg"]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Venue updated successfully",
  "venue": { ... }
}
```

**Errors:**
- `400` - Invalid venue ID or validation error
- `403` - You can only update your own venues
- `404` - Venue not found

---

### 2.6 Delete Venue
**Endpoint:** `DELETE /api/vendor/venues/:id`  
**Authentication:** ✅ Required (Bearer Token)  
**Role:** ✅ Vendor Only (own venues)  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "success": true,
  "message": "Venue deleted successfully"
}
```

**Errors:**
- `400` - Invalid venue ID
- `403` - You can only delete your own venues
- `404` - Venue not found

---

## 📅 3. Bookings APIs

### 3.1 Get Bookings (List)
**Endpoint:** `GET /api/bookings`  
**Authentication:** ✅ Required (Bearer Token)  
**Status:** ✅ Implemented

**Query Parameters:**
- `status` (optional) - Filter by status (pending/confirmed/cancelled/failed)
- `venueId` (optional) - Filter by venue ID
- `dateFrom` (optional) - Filter bookings from date (ISO format)
- `dateTo` (optional) - Filter bookings to date (ISO format)

**Role-based Behavior:**
- **Customers:** See only their own bookings
- **Vendors:** See bookings for their venues
- **Admins:** See all bookings

**Response (200):**
```json
{
  "success": true,
  "count": 3,
  "bookings": [
    {
      "_id": "6912ed3ee9dd92f55ddff765",
      "customerId": {
        "_id": "6912ed3ee9dd92f55ddff763",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "1234567890"
      },
      "venueId": {
        "_id": "6912ed3ee9dd92f55ddff764",
        "name": "Grand Wedding Hall",
        "location": "Mumbai",
        "price": 50000,
        "capacity": 500
      },
      "date": "2025-12-25T00:00:00.000Z",
      "guests": 300,
      "totalAmount": 50000,
      "paymentId": "pay_123456",
      "status": "confirmed",
      "paymentStatus": "paid",
      "createdAt": "2025-11-11T08:00:00.000Z"
    }
  ]
}
```

---

### 3.2 Get Single Booking
**Endpoint:** `GET /api/bookings/:id`  
**Authentication:** ✅ Required (Bearer Token)  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "success": true,
  "booking": {
    "_id": "6912ed3ee9dd92f55ddff765",
    "customerId": {
      "_id": "6912ed3ee9dd92f55ddff763",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890"
    },
    "venueId": {
      "_id": "6912ed3ee9dd92f55ddff764",
      "name": "Grand Wedding Hall",
      "location": "Mumbai",
      "price": 50000,
      "capacity": 500,
      "amenities": ["AC", "Parking"]
    },
    "date": "2025-12-25T00:00:00.000Z",
    "guests": 300,
    "totalAmount": 50000,
    "paymentId": "pay_123456",
    "status": "confirmed",
    "paymentStatus": "paid",
    "createdAt": "2025-11-11T08:00:00.000Z"
  }
}
```

**Errors:**
- `400` - Invalid booking ID
- `403` - Access denied
- `404` - Booking not found

---

### 3.3 Create Booking
**Endpoint:** `POST /api/bookings`  
**Authentication:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "venueId": "6912ed3ee9dd92f55ddff764",
  "date": "2025-12-25",
  "marriageFor": "boy",
  "personName": "Rajesh Kumar",
  "eventType": "wedding",
  "guests": 300,
  "totalAmount": 50000,
  "name": "Customer Name",
  "phone": "9876543210",
  "foodPreference": "both",
  "paymentId": "pay_123456",
  "deviceId": "device_unique_id"
}
```

**Required Fields:**
- `venueId` (required) - Venue ID
- `date` (required) - Booking date in YYYY-MM-DD format
- `marriageFor` (required) - Must be either "boy" or "girl"
- `guests` (required) - Number of guests
- `totalAmount` (required) - Total booking amount

**Optional Fields:**
- `personName` (optional) - Name of the person (boy or girl)
- `eventType` (optional) - Event type: "wedding", "party", "birthday party", "anniversary", "engagement", "reception", "other" (default: "wedding")
- `name` (optional) - Customer name (required if not logged in)
- `phone` (optional) - Customer phone (required if not logged in)
- `email` (optional) - Customer email
- `foodPreference` (optional) - "veg", "non-veg", or "both" (default: "both")
- `dateFrom` (optional) - Event start date
- `dateTo` (optional) - Event end date
- `paymentId` (optional) - Payment ID from Razorpay. If provided, creates Booking; if not, creates Lead only
- `deviceId` (optional) - Device ID for tracking

**Validation:**
- ✅ Checks if venue exists and is approved
- ✅ Checks capacity (guests <= venue capacity)
- ✅ Checks availability (no double booking on same date - checks all pending and confirmed bookings)
- ✅ Prevents past dates
- ✅ Validates marriageFor must be "boy" or "girl" (required)
- ✅ Validates eventType is one of the allowed values

**Event Types:**
- `wedding` - Wedding ceremony (default)
- `party` - General party
- `birthday party` - Birthday celebration
- `anniversary` - Anniversary celebration
- `engagement` - Engagement ceremony
- `reception` - Reception event
- `other` - Other event types

**Response (201) - With Payment:**
```json
{
  "success": true,
  "message": "Booking created successfully. Waiting for admin approval.",
  "type": "booking",
  "booking": {
    "_id": "6912ed3ee9dd92f55ddff765",
    "customerId": "6912ed3ee9dd92f55ddff763",
    "venueId": "6912ed3ee9dd92f55ddff764",
    "date": "2025-12-25T00:00:00.000Z",
    "marriageFor": "boy",
    "personName": "Rajesh Kumar",
    "eventType": "wedding",
    "guests": 300,
    "totalAmount": 50000,
    "status": "pending",
    "paymentStatus": "paid",
    "createdAt": "2025-11-11T08:00:00.000Z"
  }
}
```

**Response (201) - Without Payment (Lead):**
```json
{
  "success": true,
  "message": "Inquiry submitted successfully. Please complete payment to confirm booking.",
  "type": "lead",
  "lead": {
    "_id": "6912ed3ee9dd92f55ddff766",
    "venueId": "6912ed3ee9dd92f55ddff764",
    "date": "2025-12-25T00:00:00.000Z",
    "marriageFor": "boy",
    "personName": "Rajesh Kumar",
    "eventType": "wedding",
    "guests": 300,
    "totalAmount": 50000,
    "status": "new"
  }
}
```

**Errors:**
- `400` - Validation error (missing required fields: marriageFor, venueId, date, guests, totalAmount; invalid date, past date, capacity exceeded, invalid eventType)
- `404` - Venue not found
- `409` - Venue already booked for this date (prevents double booking)
- `503` - Database connection unavailable

---

### 3.4 Update Booking Status
**Endpoint:** `PUT /api/bookings/:id/status`  
**Authentication:** ✅ Required (Bearer Token)  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "status": "confirmed"  // options: pending, confirmed, cancelled, failed
}
```

**Role-based Permissions:**
- **Customers:** Can only cancel their own bookings
- **Vendors:** Can confirm/cancel bookings for their venues
- **Admins:** Can update to any status

**Response (200):**
```json
{
  "success": true,
  "message": "Booking confirmed successfully",
  "booking": { ... }
}
```

**Errors:**
- `400` - Invalid status or booking ID
- `403` - Access denied or insufficient permissions
- `404` - Booking not found

---

### 3.5 Get Booking Count by Device ID
**Endpoint:** `GET /api/bookings/count/device/:deviceId`  
**Authentication:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Description:**  
Get the count of bookings created by a specific device ID. Useful for tracking bookings from mobile apps without requiring user authentication.

**Response (200):**
```json
{
  "success": true,
  "deviceId": "device_unique_id",
  "count": 5
}
```

**Errors:**
- `400` - Invalid device ID
- `500` - Internal server error

---

### 3.6 Convert Lead to Booking with Payment
**Endpoint:** `POST /api/bookings/convert-lead`  
**Authentication:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Description:**  
Convert a lead (inquiry) to a confirmed booking after payment verification. This is typically called after Razorpay payment is completed.

**Request Body:**
```json
{
  "leadId": "6912ed3ee9dd92f55ddff766",
  "razorpay_order_id": "order_123",
  "razorpay_payment_id": "pay_123",
  "razorpay_signature": "signature_123",
  "customerId": "6912ed3ee9dd92f55ddff763",
  "name": "Customer Name",
  "phone": "9876543210",
  "email": "customer@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Lead converted to booking successfully",
  "booking": {
    "_id": "6912ed3ee9dd92f55ddff765",
    "status": "pending",
    "paymentStatus": "paid",
    ...
  }
}
```

**Errors:**
- `400` - Invalid lead ID or payment verification failed
- `404` - Lead not found
- `409` - Venue already booked for this date
- `500` - Internal server error

---

## 📂 4. Category APIs

### 4.1 Get All Categories
**Endpoint:** `GET /api/categories`  
**Authentication:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Query Parameters:**
- `active` (optional) - Filter by active status (true/false). Default: true (shows only active categories)

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "categories": [
    {
      "_id": "6912ed3ee9dd92f55ddff767",
      "name": "Wedding Hall",
      "description": "Indoor wedding halls and banquet halls",
      "icon": "hall-icon",
      "image": "https://example.com/hall.jpg",
      "isActive": true,
      "sortOrder": 1,
      "venueCount": 25,
      "createdAt": "2025-11-11T08:00:00.000Z",
      "updatedAt": "2025-11-11T08:00:00.000Z"
    },
    {
      "_id": "6912ed3ee9dd92f55ddff768",
      "name": "Garden Venue",
      "description": "Outdoor garden and lawn venues",
      "icon": "garden-icon",
      "image": "https://example.com/garden.jpg",
      "isActive": true,
      "sortOrder": 2,
      "venueCount": 15,
      "createdAt": "2025-11-11T08:00:00.000Z",
      "updatedAt": "2025-11-11T08:00:00.000Z"
    }
  ]
}
```

**Note:** Response में हर category के साथ `venueCount` भी आता है (approved venues की count)।

---

### 4.2 Get Single Category
**Endpoint:** `GET /api/categories/:id`  
**Authentication:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "success": true,
  "category": {
    "_id": "6912ed3ee9dd92f55ddff767",
    "name": "Wedding Hall",
    "description": "Indoor wedding halls and banquet halls",
    "icon": "hall-icon",
    "image": "https://example.com/hall.jpg",
    "isActive": true,
    "sortOrder": 1,
    "venueCount": 25,
    "createdAt": "2025-11-11T08:00:00.000Z",
    "updatedAt": "2025-11-11T08:00:00.000Z"
  }
}
```

**Errors:**
- `400` - Invalid category ID
- `404` - Category not found

---

### 4.3 Create Category
**Endpoint:** `POST /api/categories`  
**Authentication:** ✅ Required (Bearer Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "name": "Beach Venue",
  "description": "Beachside wedding venues",
  "icon": "beach-icon",
  "image": "https://example.com/beach.jpg",
  "isActive": true,
  "sortOrder": 3
}
```

**Required Fields:**
- `name` (required) - Category name

**Optional Fields:**
- `description` - Category description
- `icon` - Icon name or URL
- `image` - Category image URL
- `isActive` - Active status (default: true)
- `sortOrder` - Order for sorting (default: 0)

**Response (201):**
```json
{
  "success": true,
  "message": "Category created successfully",
  "category": {
    "_id": "6912ed3ee9dd92f55ddff769",
    "name": "Beach Venue",
    "description": "Beachside wedding venues",
    "icon": "beach-icon",
    "image": "https://example.com/beach.jpg",
    "isActive": true,
    "sortOrder": 3,
    "createdAt": "2025-11-11T08:00:00.000Z",
    "updatedAt": "2025-11-11T08:00:00.000Z"
  }
}
```

**Errors:**
- `400` - Validation error (name required)
- `403` - Only admins can create categories
- `409` - Category with this name already exists
- `503` - Database connection unavailable

---

### 4.4 Update Category
**Endpoint:** `PUT /api/categories/:id`  
**Authentication:** ✅ Required (Bearer Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

**Request Body (all fields optional):**
```json
{
  "name": "Updated Category Name",
  "description": "Updated description",
  "icon": "updated-icon",
  "image": "https://example.com/updated.jpg",
  "isActive": false,
  "sortOrder": 5
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Category updated successfully",
  "category": {
    "_id": "6912ed3ee9dd92f55ddff767",
    "name": "Updated Category Name",
    "description": "Updated description",
    "icon": "updated-icon",
    "image": "https://example.com/updated.jpg",
    "isActive": false,
    "sortOrder": 5,
    "updatedAt": "2025-11-11T09:00:00.000Z"
  }
}
```

**Errors:**
- `400` - Invalid category ID or validation error
- `403` - Only admins can update categories
- `404` - Category not found
- `409` - Category with this name already exists

---

### 4.5 Delete Category
**Endpoint:** `DELETE /api/categories/:id`  
**Authentication:** ✅ Required (Bearer Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

**Errors:**
- `400` - Invalid category ID or category is being used by venues
- `403` - Only admins can delete categories
- `404` - Category not found

**Note:** Category को delete करने से पहले check होता है कि क्या कोई venue इस category को use कर रहा है। अगर use कर रहा है तो delete नहीं होगा।

---

## 👨‍💼 5. Admin APIs

### 5.1 Admin Login
**Endpoint:** `POST /api/admin/login`  
**Authentication:** ❌ Not Required  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response (200):**
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

### 5.2 Get Dashboard
**Endpoint:** `GET /api/admin/dashboard`  
**Authentication:** ✅ Required (Admin Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "totalUsers": 150,
  "totalVendors": 25,
  "totalVenues": 100,
  "totalBookings": 500,
  "pendingVenues": 10,
  "revenue": 5000000
}
```

---

### 5.3 Get Users
**Endpoint:** `GET /api/admin/users`  
**Authentication:** ✅ Required (Admin Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

**Query Parameters:**
- `role` (optional) - Filter by role (customer/vendor/affiliate/admin/all)

**Response (200):**
```json
[
  {
    "_id": "6912ed3ee9dd92f55ddff763",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "role": "customer",
    "verified": false,
    "createdAt": "2025-11-11T08:00:00.000Z"
  }
]
```

---

### 5.4 Get Vendors
**Endpoint:** `GET /api/admin/vendors`  
**Authentication:** ✅ Required (Admin Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

**Response (200):**
```json
[
  {
    "_id": "6912ed3ee9dd92f55ddff763",
    "name": "Venue Owner",
    "email": "owner@example.com",
    "phone": "1234567890",
    "role": "vendor",
    "totalRevenue": 500000,
    "createdAt": "2025-11-11T08:00:00.000Z"
  }
]
```

---

### 5.5 Get Venues (Admin)
**Endpoint:** `GET /api/admin/venues`  
**Authentication:** ✅ Required (Admin Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

**Query Parameters:**
- `status` (optional) - Filter by status (pending/approved/rejected/all)

**Response (200):**
```json
[
  {
    "_id": "6912ed3ee9dd92f55ddff764",
    "vendorId": {
      "_id": "6912ed3ee9dd92f55ddff763",
      "name": "Venue Owner",
      "email": "owner@example.com"
    },
    "name": "Grand Wedding Hall",
    "price": 50000,
    "location": "Mumbai",
    "capacity": 500,
    "status": "pending",
    "createdAt": "2025-11-11T08:00:00.000Z"
  }
]
```

---

### 5.6 Approve Venue
**Endpoint:** `PUT /api/admin/venues/approve/:id`  
**Authentication:** ✅ Required (Admin Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "message": "Venue approved successfully",
  "venue": { ... }
}
```

---

### 5.7 Reject Venue
**Endpoint:** `PUT /api/admin/venues/reject/:id`  
**Authentication:** ✅ Required (Admin Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "message": "Venue rejected successfully",
  "venue": { ... }
}
```

---

### 5.8 Get Bookings (Admin)
**Endpoint:** `GET /api/admin/bookings`  
**Authentication:** ✅ Required (Admin Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

**Response (200):**
```json
[
  {
    "_id": "6912ed3ee9dd92f55ddff765",
    "customerId": {
      "_id": "6912ed3ee9dd92f55ddff763",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890"
    },
    "venueId": {
      "_id": "6912ed3ee9dd92f55ddff764",
      "name": "Grand Wedding Hall",
      "location": "Mumbai"
    },
    "date": "2025-12-25T00:00:00.000Z",
    "guests": 300,
    "totalAmount": 50000,
    "paymentStatus": "paid",
    "status": "confirmed",
    "createdAt": "2025-11-11T08:00:00.000Z"
  }
]
```

---

### 5.9 Update Booking Status (Admin)
**Endpoint:** `PUT /api/admin/bookings/:id/status`  
**Authentication:** ✅ Required (Admin Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "status": "confirmed"
}
```

---

### 5.10 Get Payouts
**Endpoint:** `GET /api/admin/payouts`  
**Authentication:** ✅ Required (Admin Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

**Response (200):**
```json
[
  {
    "_id": "6912ed3ee9dd92f55ddff766",
    "vendorId": {
      "_id": "6912ed3ee9dd92f55ddff763",
      "name": "Venue Owner",
      "email": "owner@example.com"
    },
    "amount": 50000,
    "payment_status": "pending",
    "createdAt": "2025-11-11T08:00:00.000Z"
  }
]
```

---

### 5.11 Mark Payout Complete
**Endpoint:** `PUT /api/admin/payouts/:id/complete`  
**Authentication:** ✅ Required (Admin Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "message": "Payout marked as completed",
  "payout": { ... }
}
```

---

### 5.12 Get Analytics
**Endpoint:** `GET /api/admin/analytics`  
**Authentication:** ✅ Required (Admin Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "revenueByMonth": [...],
  "bookingsByStatus": {...},
  "topVenues": [...],
  "topVendors": [...]
}
```

---

### 5.13 Get Admin Profile
**Endpoint:** `GET /api/admin/profile`  
**Authentication:** ✅ Required (Admin Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

---

### 5.14 Update Admin Profile
**Endpoint:** `PUT /api/admin/profile`  
**Authentication:** ✅ Required (Admin Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

---

### 5.15 Change Admin Password
**Endpoint:** `PUT /api/admin/change-password`  
**Authentication:** ✅ Required (Admin Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "currentPassword": "oldpass123",
  "newPassword": "newpass123"
}
```

---

### 5.16 Get Leads (Admin)
**Endpoint:** `GET /api/admin/leads`  
**Authentication:** ✅ Required (Admin Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

**Description:**  
Get all leads (inquiries) that haven't been converted to bookings yet.

**Query Parameters:**
- `status` (optional) - Filter by status (new/contacted/converted/lost)

**Response (200):**
```json
{
  "success": true,
  "count": 10,
  "leads": [
    {
      "_id": "6912ed3ee9dd92f55ddff766",
      "venueId": {
        "_id": "6912ed3ee9dd92f55ddff764",
        "name": "Grand Wedding Hall"
      },
      "dateFrom": "2025-12-25T00:00:00.000Z",
      "dateTo": "2025-12-26T00:00:00.000Z",
      "guests": 300,
      "totalAmount": 50000,
      "status": "new",
      "name": "Customer Name",
      "phone": "9876543210",
      "email": "customer@example.com",
      "createdAt": "2025-11-11T08:00:00.000Z"
    }
  ]
}
```

**Errors:**
- `403` - Access denied (not an admin)
- `500` - Internal server error

---

### 5.17 Get Lead by ID (Admin)
**Endpoint:** `GET /api/admin/leads/:id`  
**Authentication:** ✅ Required (Admin Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "success": true,
  "lead": {
    "_id": "6912ed3ee9dd92f55ddff766",
    "venueId": { ... },
    "dateFrom": "2025-12-25T00:00:00.000Z",
    "dateTo": "2025-12-26T00:00:00.000Z",
    "guests": 300,
    "totalAmount": 50000,
    "status": "new",
    ...
  }
}
```

**Errors:**
- `404` - Lead not found
- `500` - Internal server error

---

### 5.18 Update Lead Status (Admin)
**Endpoint:** `PUT /api/admin/leads/:id/status`  
**Authentication:** ✅ Required (Admin Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "status": "contacted"  // options: new, contacted, converted, lost
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Lead status updated successfully",
  "lead": { ... }
}
```

**Errors:**
- `400` - Invalid status
- `404` - Lead not found
- `500` - Internal server error

---

### 5.19 Convert Lead to Booking (Admin)
**Endpoint:** `POST /api/admin/leads/:id/convert-to-booking`  
**Authentication:** ✅ Required (Admin Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

**Description:**  
Manually convert a lead to a booking without payment. This is useful when admin wants to create a booking from a lead.

**Request Body (optional):**
```json
{
  "customerId": "6912ed3ee9dd92f55ddff763",
  "paymentStatus": "pending"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Lead converted to booking successfully",
  "booking": { ... }
}
```

**Errors:**
- `404` - Lead not found
- `409` - Venue already booked for this date
- `500` - Internal server error

---

### 5.20 Get Payment Config (Admin)
**Endpoint:** `GET /api/admin/payment-config`  
**Authentication:** ✅ Required (Admin Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "success": true,
  "config": {
    "razorpayKeyId": "rzp_test_xxxxxxxxxxxxx",
    "razorpayKeySecret": "xxxxxxxxxxxxx",
    "isActive": true
  }
}
```

**Errors:**
- `403` - Access denied (not an admin)
- `500` - Internal server error

---

### 5.21 Update Payment Config (Admin)
**Endpoint:** `PUT /api/admin/payment-config`  
**Authentication:** ✅ Required (Admin Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "razorpayKeyId": "rzp_test_xxxxxxxxxxxxx",
  "razorpayKeySecret": "xxxxxxxxxxxxx",
  "isActive": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment config updated successfully",
  "config": { ... }
}
```

**Errors:**
- `400` - Invalid config data
- `403` - Access denied (not an admin)
- `500` - Internal server error

---

### 5.22 Get Google Maps Config (Admin)
**Endpoint:** `GET /api/admin/google-maps-config`  
**Authentication:** ✅ Required (Admin Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

**Description:**  
Get current Google Maps API key configuration. The API key is masked for security (only first 8 and last 4 characters shown).

**Response (200):**
```json
{
  "success": true,
  "config": {
    "_id": "6912ed3ee9dd92f55ddff770",
    "googleMapsApiKey": "AIzaSyC****xyz4",
    "hasApiKey": true,
    "isActive": true,
    "createdAt": "2025-11-11T08:00:00.000Z",
    "updatedAt": "2025-11-11T08:00:00.000Z"
  }
}
```

**Response (when no key configured):**
```json
{
  "success": true,
  "config": {
    "_id": "6912ed3ee9dd92f55ddff770",
    "googleMapsApiKey": "",
    "hasApiKey": false,
    "isActive": true,
    "createdAt": "2025-11-11T08:00:00.000Z",
    "updatedAt": "2025-11-11T08:00:00.000Z"
  }
}
```

**Errors:**
- `403` - Access denied (not an admin)
- `500` - Internal server error

---

### 5.23 Update Google Maps Config (Admin)
**Endpoint:** `PUT /api/admin/google-maps-config`  
**Authentication:** ✅ Required (Admin Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

**Description:**  
Update Google Maps API key. The key is stored in database and will be used for all Google Maps API calls. If database has a key, it takes priority over environment variable.

**Request Body:**
```json
{
  "googleMapsApiKey": "AIzaSyCUEfJCSWFJNz7tUZMR7G77avJoSnq-dRA"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Google Maps API key updated successfully",
  "config": {
    "_id": "6912ed3ee9dd92f55ddff770",
    "googleMapsApiKey": "AIzaSyC****xyz4",
    "hasApiKey": true,
    "isActive": true,
    "updatedAt": "2025-11-11T08:00:00.000Z"
  }
}
```

**Validation:**
- API key must start with "AIza"
- API key must be at least 30 characters long
- API key is required

**Errors:**
- `400` - Validation error (missing key, invalid format)
- `403` - Access denied (not an admin)
- `500` - Internal server error

**Note:**
- API key is stored securely in database
- Response shows masked key (first 8 + last 4 characters)
- Database key takes priority over environment variable
- Changes take effect immediately (no server restart needed)

---

### 5.24 Get Banners (Admin)
**Endpoint:** `GET /api/admin/banners`  
**Authentication:** ✅ Required (Admin Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

**Query Parameters:**
- `active` (optional) - Filter by active status (true/false/all). Default: all (shows all banners)

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "banners": [
    {
      "_id": "6912ed3ee9dd92f55ddff768",
      "title": "Summer Wedding Special",
      "description": "Special discount on summer wedding bookings",
      "image": "/uploads/banners/banner1.jpg",
      "link": "/venue/6912ed3ee9dd92f55ddff764",
      "isActive": true,
      "sortOrder": 1,
      "startDate": "2025-06-01T00:00:00.000Z",
      "endDate": "2025-08-31T23:59:59.000Z",
      "createdAt": "2025-11-11T08:00:00.000Z",
      "updatedAt": "2025-11-11T08:00:00.000Z"
    }
  ]
}
```

**Errors:**
- `403` - Access denied (not an admin)
- `500` - Internal server error

---

### 5.25 Get Banner by ID (Admin)
**Endpoint:** `GET /api/admin/banners/:id`  
**Authentication:** ✅ Required (Admin Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "success": true,
  "banner": {
    "_id": "6912ed3ee9dd92f55ddff768",
    "title": "Summer Wedding Special",
    "description": "Special discount on summer wedding bookings",
    "image": "/uploads/banners/banner1.jpg",
    "link": "/venue/6912ed3ee9dd92f55ddff764",
    "isActive": true,
    "sortOrder": 1,
    "startDate": "2025-06-01T00:00:00.000Z",
    "endDate": "2025-08-31T23:59:59.000Z",
    "createdAt": "2025-11-11T08:00:00.000Z",
    "updatedAt": "2025-11-11T08:00:00.000Z"
  }
}
```

**Errors:**
- `400` - Invalid banner ID
- `404` - Banner not found
- `500` - Internal server error

---

### 5.26 Create Banner (Admin)
**Endpoint:** `POST /api/admin/banners`  
**Authentication:** ✅ Required (Admin Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

**Request Body (multipart/form-data or JSON):**
- `title` (required) - Banner title
- `image` (required) - Banner image file (multipart) OR image URL (JSON)
- `description` (optional) - Banner description text
- `link` (optional) - Link URL when banner is clicked
- `isActive` (optional) - Active status (default: true)
- `sortOrder` (optional) - Display order for sorting (default: 0, lower numbers appear first)
- `startDate` (optional) - Start date when banner should begin showing (ISO date string)
- `endDate` (optional) - End date when banner should stop showing (ISO date string)

**Note:** 
- Image can be uploaded as file (multipart/form-data) or provided as URL (JSON)
- If `startDate` and `endDate` are provided, banner will only show between these dates
- Banners are sorted by `sortOrder` (ascending), then by `createdAt` (descending)

**Response (201):**
```json
{
  "success": true,
  "message": "Banner created successfully",
  "banner": {
    "_id": "6912ed3ee9dd92f55ddff768",
    "title": "Summer Wedding Special",
    "description": "Special discount on summer wedding bookings",
    "image": "/uploads/banners/banner1.jpg",
    "link": "/venue/6912ed3ee9dd92f55ddff764",
    "isActive": true,
    "sortOrder": 1,
    "startDate": "2025-06-01T00:00:00.000Z",
    "endDate": "2025-08-31T23:59:59.000Z",
    "createdAt": "2025-11-11T08:00:00.000Z",
    "updatedAt": "2025-11-11T08:00:00.000Z"
  }
}
```

**Errors:**
- `400` - Invalid data or missing required fields (title, image)
- `403` - Access denied (not an admin)
- `500` - Internal server error

---

### 5.27 Update Banner (Admin)
**Endpoint:** `PUT /api/admin/banners/:id`  
**Authentication:** ✅ Required (Admin Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

**Request Body (multipart/form-data):**
- `title` (optional) - Banner title
- `image` (optional) - Banner image file
- `link` (optional) - Link URL
- `isActive` (optional) - Active status
- `order` (optional) - Display order

**Response (200):**
```json
{
  "success": true,
  "message": "Banner updated successfully",
  "banner": { ... }
}
```

**Errors:**
- `404` - Banner not found
- `500` - Internal server error

---

### 5.28 Delete Banner (Admin)
**Endpoint:** `DELETE /api/admin/banners/:id`  
**Authentication:** ✅ Required (Admin Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "success": true,
  "message": "Banner deleted successfully"
}
```

**Errors:**
- `404` - Banner not found
- `500` - Internal server error

---

### 5.29 Toggle Banner Active Status (Admin)
**Endpoint:** `PUT /api/admin/banners/:id/toggle-active`  
**Authentication:** ✅ Required (Admin Token)  
**Role:** ✅ Admin Only  
**Status:** ✅ Implemented

**Description:**  
Toggle the active status of a banner (activate/deactivate).

**Response (200):**
```json
{
  "success": true,
  "message": "Banner status updated successfully",
  "banner": {
    "_id": "6912ed3ee9dd92f55ddff768",
    "isActive": false,
    ...
  }
}
```

**Errors:**
- `404` - Banner not found
- `500` - Internal server error

---

## 💰 6. Payment APIs (Razorpay)

### 6.1 Get Payment Config
**Endpoint:** `GET /api/payment/config`  
**Authentication:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Description:**  
Get Razorpay payment configuration including the Razorpay Key ID. This is needed to initialize Razorpay checkout in the frontend.

**Response (200):**
```json
{
  "success": true,
  "razorpayKeyId": "rzp_test_xxxxxxxxxxxxx",
  "isActive": true
}
```

**Errors:**
- `500` - Internal server error

---

### 6.2 Create Payment Order
**Endpoint:** `POST /api/payment/create-order`  
**Authentication:** ⚠️ Optional (Bearer Token)  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "amount": 50000,
  "currency": "INR",
  "bookingData": {
    "venueId": "6912ed3ee9dd92f55ddff764",
    "dateFrom": "2025-12-25",
    "dateTo": "2025-12-26",
    "guests": 300,
    "eventType": "wedding",
    "marriageFor": "boy",
    "name": "Customer Name",
    "phone": "9876543210",
    "email": "customer@example.com",
    "foodPreference": "both",
    "deviceId": "device_unique_id"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "order": {
    "id": "order_xxxxxxxxxxxxx",
    "amount": 50000,
    "currency": "INR",
    "status": "created"
  }
}
```

**Errors:**
- `400` - Invalid amount or booking data
- `500` - Internal server error

---

### 6.3 Verify Payment
**Endpoint:** `POST /api/payment/verify`  
**Authentication:** ⚠️ Optional (Bearer Token)  
**Status:** ✅ Implemented

**Request Body:**
```json
{
  "razorpay_order_id": "order_123",
  "razorpay_payment_id": "pay_123",
  "razorpay_signature": "signature_123",
  "bookingData": {
    "venueId": "6912ed3ee9dd92f55ddff764",
    "dateFrom": "2025-12-25",
    "dateTo": "2025-12-26",
    "guests": 300,
    "totalAmount": 50000,
    "eventType": "wedding",
    "marriageFor": "boy",
    "name": "Customer Name",
    "phone": "9876543210",
    "email": "customer@example.com",
    "foodPreference": "both",
    "deviceId": "device_unique_id"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment verified and booking created successfully",
  "booking": {
    "_id": "6912ed3ee9dd92f55ddff765",
    "status": "pending",
    "paymentStatus": "paid",
    ...
  }
}
```

**Errors:**
- `400` - Payment verification failed or invalid booking data
- `409` - Venue already booked for this date
- `500` - Internal server error

---

### 6.4 Verify Payment for Lead
**Endpoint:** `POST /api/payment/verify-lead`  
**Authentication:** ⚠️ Optional (Bearer Token)  
**Status:** ✅ Implemented

**Description:**  
Verify payment for an existing lead and convert it to a booking. This is used when a lead was created first and payment is done later.

**Request Body:**
```json
{
  "leadId": "6912ed3ee9dd92f55ddff766",
  "razorpay_order_id": "order_123",
  "razorpay_payment_id": "pay_123",
  "razorpay_signature": "signature_123",
  "customerId": "6912ed3ee9dd92f55ddff763"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment verified and lead converted to booking",
  "booking": {
    "_id": "6912ed3ee9dd92f55ddff765",
    "status": "pending",
    "paymentStatus": "paid",
    ...
  }
}
```

**Errors:**
- `400` - Payment verification failed or invalid lead ID
- `404` - Lead not found
- `409` - Venue already booked for this date
- `500` - Internal server error

---

## 🏪 7. Vendor APIs

### 7.1 Get Vendor Dashboard
**Endpoint:** `GET /api/vendor/dashboard`  
**Authentication:** ✅ Required (Bearer Token)  
**Role:** ✅ Vendor Only  
**Status:** ✅ Implemented

**Description:**  
Get vendor dashboard statistics including total venues, bookings, monthly revenue, and commission paid.

**Response (200):**
```json
{
  "success": true,
  "totalVenues": 5,
  "totalBookings": 25,
  "monthlyRevenue": 500000,
  "commissionPaid": 50000
}
```

**Errors:**
- `403` - Access denied (not a vendor)
- `503` - Database connection unavailable

---

### 7.2 Get Vendor Bookings
**Endpoint:** `GET /api/vendor/bookings`  
**Authentication:** ✅ Required (Bearer Token)  
**Role:** ✅ Vendor Only  
**Status:** ✅ Implemented

**Description:**  
Get all bookings for venues owned by the vendor.

**Query Parameters:**
- `status` (optional) - Filter by status (pending/confirmed/cancelled/failed)

**Response (200):**
```json
{
  "success": true,
  "count": 10,
  "bookings": [
    {
      "_id": "6912ed3ee9dd92f55ddff765",
      "customerId": {
        "_id": "6912ed3ee9dd92f55ddff763",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "venueId": {
        "_id": "6912ed3ee9dd92f55ddff764",
        "name": "Grand Wedding Hall"
      },
      "date": "2025-12-25T00:00:00.000Z",
      "guests": 300,
      "totalAmount": 50000,
      "status": "confirmed",
      "createdAt": "2025-11-11T08:00:00.000Z"
    }
  ]
}
```

**Errors:**
- `403` - Access denied (not a vendor)
- `503` - Database connection unavailable

---

### 7.3 Get Vendor Payouts
**Endpoint:** `GET /api/vendor/payouts`  
**Authentication:** ✅ Required (Bearer Token)  
**Role:** ✅ Vendor Only  
**Status:** ✅ Implemented

**Description:**  
Get all payouts for the vendor including pending and paid payouts.

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "payouts": [
    {
      "_id": "6912ed3ee9dd92f55ddff767",
      "vendorId": "6912ed3ee9dd92f55ddff763",
      "amount": 45000,
      "commission": 5000,
      "payment_status": "paid",
      "createdAt": "2025-11-11T08:00:00.000Z"
    }
  ]
}
```

**Errors:**
- `403` - Access denied (not a vendor)
- `503` - Database connection unavailable

---

## 🤝 8. Affiliate APIs

### 8.1 Add Customer (Affiliate)
**Endpoint:** `POST /api/affiliate/customers`  
**Authentication:** ✅ Required (Affiliate Token)  
**Role:** ✅ Affiliate Only  
**Status:** ❌ Not Implemented (501)

---

### 8.2 Get Affiliate Bookings
**Endpoint:** `GET /api/affiliate/bookings`  
**Authentication:** ✅ Required (Affiliate Token)  
**Role:** ✅ Affiliate Only  
**Status:** ❌ Not Implemented (501)

---

### 8.3 Get Affiliate Earnings
**Endpoint:** `GET /api/affiliate/earnings`  
**Authentication:** ✅ Required (Affiliate Token)  
**Role:** ✅ Affiliate Only  
**Status:** ❌ Not Implemented (501)

---

## 🖼️ 9. Banner APIs

### 9.1 Get All Banners (Public)
**Endpoint:** `GET /api/banners`  
**Authentication:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Description:**  
Get all active banners for display on the customer web app homepage.

**Response (200):**
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
      "order": 1,
      "createdAt": "2025-11-11T08:00:00.000Z"
    }
  ]
}
```

**Errors:**
- `500` - Internal server error

---

### 9.2 Get Single Banner (Public)
**Endpoint:** `GET /api/banners/:id`  
**Authentication:** ❌ Not Required (Public)  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "success": true,
  "banner": {
    "_id": "6912ed3ee9dd92f55ddff768",
    "title": "Summer Wedding Special",
    "image": "/uploads/banners/banner1.jpg",
    "link": "/venue/6912ed3ee9dd92f55ddff764",
    "isActive": true,
    "order": 1
  }
}
```

**Errors:**
- `404` - Banner not found
- `500` - Internal server error

---

## 🤖 10. AI Gateway APIs

### 10.1 Venue Recommendations
**Endpoint:** `POST /api/ai/recommend`  
**Authentication:** ✅ Required (Bearer Token)  
**Status:** ❌ Not Implemented (501)

**Expected Request Body:**
```json
{
  "budget": 50000,
  "guests": 300,
  "location": "Mumbai",
  "preferences": ["AC", "Parking"]
}
```

---

### 10.2 Dynamic Pricing
**Endpoint:** `POST /api/ai/pricing`  
**Authentication:** ✅ Required (Bearer Token)  
**Status:** ❌ Not Implemented (501)

---

### 10.3 Lead Scoring
**Endpoint:** `POST /api/ai/leadscore`  
**Authentication:** ✅ Required (Bearer Token)  
**Status:** ❌ Not Implemented (501)

---

### 10.4 Review Sentiment
**Endpoint:** `POST /api/ai/review-sentiment`  
**Authentication:** ✅ Required (Bearer Token)  
**Status:** ❌ Not Implemented (501)

---

### 10.5 Visual Search
**Endpoint:** `POST /api/ai/visual-search`  
**Authentication:** ✅ Required (Bearer Token)  
**Status:** ❌ Not Implemented (501)

---

### 10.6 Auto Content Generation
**Endpoint:** `POST /api/ai/autocontent`  
**Authentication:** ✅ Required (Bearer Token)  
**Status:** ❌ Not Implemented (501)

---

## 🏥 11. Health Check

### 11.1 Health Check
**Endpoint:** `GET /api/health`  
**Authentication:** ❌ Not Required  
**Status:** ✅ Implemented

**Response (200):**
```json
{
  "status": "ok",
  "service": "wedding-venue-backend",
  "uptime": 3600.5
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
  "error": "Database connection unavailable",
  "hint": "Please check MongoDB connection settings and restart backend server"
}
```

---

## 🔑 Authentication Headers

सभी protected APIs के लिए header में JWT token भेजें:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

## 📊 Implementation Status Summary

| Category | Total APIs | Implemented | Not Implemented |
|----------|-----------|-------------|-----------------|
| Authentication | 5 | 5 | 0 |
| Vendor Venues | 6 | 6 | 0 |
| Bookings | 6 | 6 | 0 |
| Categories | 5 | 5 | 0 |
| Payments | 4 | 4 | 0 |
| Vendor | 3 | 3 | 0 |
| Affiliate | 3 | 0 | 3 |
| Banners | 2 | 2 | 0 |
| Admin | 27 | 27 | 0 |
| AI Gateway | 6 | 0 | 6 |
| Health | 1 | 1 | 0 |
| **Total** | **62** | **59** | **9** |

---

## 🚀 Quick Start Example

```javascript
// 1. Register
const registerResponse = await fetch('http://192.168.29.20:4000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    phone: '1234567890',
    role: 'customer'
  })
});
const { token } = await registerResponse.json();

// 2. Get Venues
const venuesResponse = await fetch('http://192.168.29.20:4000/api/vendor/venues', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const venues = await venuesResponse.json();

// 3. Create Booking
const bookingResponse = await fetch('http://192.168.29.20:4000/api/bookings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    venueId: '6912ed3ee9dd92f55ddff764',
    date: '2025-12-25',
    guests: 300,
    totalAmount: 50000
  })
});
```

---

## 🗺️ 6. Google Maps APIs

### 6.1 Get Location Suggestions (Autocomplete)
**Endpoint:** `GET /api/maps/suggestions`  
**Authentication:** ❌ Not Required (Public API)  
**Status:** ✅ Implemented

**Description:**  
Get location suggestions/autocomplete results from Google Places API. This helps users search and select locations with suggestions as they type.

**Query Parameters:**
- `input` (required) - Search query text (e.g., "Mumbai", "Jaipur wedding")
- `language` (optional) - Language code (default: "en")

**Response (200):**
```json
{
  "success": true,
  "query": "Mumbai",
  "count": 5,
  "suggestions": [
    {
      "placeId": "ChIJwe1EZjDG5zsRaYxkjY_tpF0",
      "description": "Mumbai, Maharashtra, India",
      "mainText": "Mumbai",
      "secondaryText": "Maharashtra, India",
      "types": ["locality", "political", "geocode"]
    },
    {
      "placeId": "ChIJwe1EZjDG5zsRaYxkjY_tpF0",
      "description": "Mumbai Airport, Mumbai, Maharashtra, India",
      "mainText": "Mumbai Airport",
      "secondaryText": "Mumbai, Maharashtra, India",
      "types": ["establishment", "point_of_interest"]
    }
  ],
  "status": "OK"
}
```

**Example Requests:**
```
GET /api/maps/suggestions?input=Mumbai
GET /api/maps/suggestions?input=Jaipur wedding hall&language=en
GET /api/maps/suggestions?input=Delhi banquet
```

**Errors:**
- `400` - Input parameter required or invalid request
- `500` - Google Maps API key not configured or internal server error

**Note:**  
- Requires `GOOGLE_MAPS_API_KEY` environment variable
- Results are restricted to India by default (can be modified in controller)
- Returns suggestions in order of relevance

---

### 6.2 Get Location Details
**Endpoint:** `GET /api/maps/details`  
**Authentication:** ❌ Not Required (Public API)  
**Status:** ✅ Implemented

**Description:**  
Get detailed location information including coordinates, address components, and map link. Use this after user selects a suggestion from autocomplete.

**Query Parameters:**
- `placeId` (required) - Place ID from autocomplete suggestions

**Response (200):**
```json
{
  "success": true,
  "location": {
    "placeId": "ChIJwe1EZjDG5zsRaYxkjY_tpF0",
    "name": "Mumbai",
    "address": "123 Main Street",
    "formattedAddress": "123 Main Street, Mumbai, Maharashtra 400001, India",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "pincode": "400001",
    "latitude": 19.0760,
    "longitude": 72.8777,
    "mapLink": "https://www.google.com/maps?q=19.0760,72.8777",
    "website": "https://example.com",
    "phone": "+91 22 1234 5678",
    "types": ["locality", "political"]
  }
}
```

**Example Requests:**
```
GET /api/maps/details?placeId=ChIJwe1EZjDG5zsRaYxkjY_tpF0
```

**Errors:**
- `400` - Place ID required or invalid
- `404` - Place not found
- `500` - Google Maps API key not configured or internal server error

**Usage Flow:**
1. User types location → Call `/api/maps/suggestions?input=...`
2. User selects suggestion → Get `placeId` from suggestion
3. Get full details → Call `/api/maps/details?placeId=...`
4. Use location data → Save to venue with coordinates and address

---

### 6.3 Get Google Maps API Key
**Endpoint:** `GET /api/maps/api-key`  
**Authentication:** ❌ Not Required (Public API)  
**Status:** ✅ Implemented

**Description:**  
Get Google Maps API key for frontend use (for Maps JavaScript API, displaying maps, etc.)

**Response (200):**
```json
{
  "success": true,
  "hasApiKey": true,
  "apiKey": "AIzaSy...",
  "message": "Google Maps API key available"
}
```

**Response (when not configured):**
```json
{
  "success": false,
  "hasApiKey": false,
  "message": "Google Maps API key not configured"
}
```

**Note:**  
- ⚠️ In production, consider restricting this endpoint or using API key restrictions
- Frontend can use this key for Maps JavaScript API, Geocoding API, etc.
- Make sure to set up API key restrictions in Google Cloud Console

---

### Google Maps API Setup

**Option 1: Admin Panel (Recommended)**
Admin panel se Google Maps API key add/update kar sakte hain:
- `GET /api/admin/google-maps-config` - Get current API key (masked)
- `PUT /api/admin/google-maps-config` - Update API key

**Option 2: Environment Variable (Fallback)**
Add to your `.env` file:
```
GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

**Note:** Database mein configured key priority hai. Agar database mein key hai to woh use hogi, warna environment variable check hogi.

**How to Get Google Maps API Key:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable these APIs:
   - **Places API** (for autocomplete and place details)
   - **Maps JavaScript API** (for displaying maps on frontend)
   - **Geocoding API** (optional, for reverse geocoding)
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy the API key and add to `.env` file
6. (Recommended) Set API key restrictions:
   - Application restrictions: HTTP referrers (for web) or Android/iOS apps
   - API restrictions: Select only the APIs you need

**API Pricing:**
- Places Autocomplete: $2.83 per 1000 requests (first 1000 free per month)
- Place Details: $17 per 1000 requests (first 1000 free per month)
- Maps JavaScript API: Free for most use cases (with usage limits)

**Frontend Integration Example:**
```javascript
// 1. Get location suggestions
const response = await fetch('/api/maps/suggestions?input=Mumbai');
const { suggestions } = await response.json();

// 2. User selects a suggestion
const selectedPlace = suggestions[0];
const placeId = selectedPlace.placeId;

// 3. Get full location details
const detailsResponse = await fetch(`/api/maps/details?placeId=${placeId}`);
const { location } = await detailsResponse.json();

// 4. Use location data for venue
const venueLocation = {
  address: location.address,
  city: location.city,
  state: location.state,
  pincode: location.pincode,
  latitude: location.latitude,
  longitude: location.longitude,
  mapLink: location.mapLink
};

// 5. Display on map (using Google Maps JavaScript API)
// Load Google Maps with the API key from /api/maps/api-key
```

---

**Last Updated:** January 2025  
**Version:** 1.1.0


# New APIs Added - Complete List

## 🆕 NEW API ENDPOINTS

### 1. Role Management APIs (6 endpoints)
**Base Path:** `/api/admin/roles`

| Method | Endpoint | Permission Required | Description |
|--------|----------|-------------------|-------------|
| GET | `/api/admin/roles` | `view_roles` | Get all roles |
| GET | `/api/admin/roles/:id` | `view_roles` | Get role by ID |
| GET | `/api/admin/roles/permissions/available` | `view_roles` | Get all available permissions (NEW) |
| POST | `/api/admin/roles` | `create_roles` | Create new role |
| PUT | `/api/admin/roles/:id` | `edit_roles` | Update role |
| DELETE | `/api/admin/roles/:id` | `delete_roles` | Delete role |

**Example Request (Create Role):**
```json
POST /api/admin/roles
{
  "name": "Manager",
  "permissions": ["view_users", "view_bookings", "edit_bookings"],
  "description": "Manager role with booking permissions"
}
```

**Example Response (Get Available Permissions):**
```json
GET /api/admin/roles/permissions/available
{
  "allPermissions": ["view_dashboard", "view_users", ...],
  "permissionsByCategory": {
    "dashboard": ["view_dashboard"],
    "users": ["view_users", "create_users", ...],
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

### 2. Staff Management APIs (5 endpoints)
**Base Path:** `/api/admin/staff`

| Method | Endpoint | Permission Required | Description |
|--------|----------|-------------------|-------------|
| GET | `/api/admin/staff` | `view_staff` | Get all staff members |
| GET | `/api/admin/staff/:id` | `view_staff` | Get staff by ID |
| POST | `/api/admin/staff` | `create_staff` | Create new staff (with image upload) |
| PUT | `/api/admin/staff/:id` | `edit_staff` | Update staff (with optional image upload) |
| DELETE | `/api/admin/staff/:id` | `delete_staff` | Delete staff (soft delete) |

**Example Request (Create Staff):**
```json
POST /api/admin/staff
Content-Type: multipart/form-data

{
  "name": "John Doe",
  "phone": "1234567890",
  "email": "john@example.com",
  "password": "password123",
  "location": "Mumbai",
  "gender": "male",
  "role": "ROLE_ID_HERE",
  "img": [image file]
}
```

**Example Response:**
```json
{
  "message": "Staff created successfully",
  "staff": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "location": "Mumbai",
    "gender": "male",
    "img": "/uploads/staff/filename.jpg",
    "role": {
      "id": "...",
      "name": "Manager",
      "permissions": ["view_users", "view_bookings"]
    }
  }
}
```

---

### 3. Staff Authentication APIs (2 endpoints)
**Base Path:** `/api/staff`

| Method | Endpoint | Permission Required | Description |
|--------|----------|-------------------|-------------|
| POST | `/api/staff/login` | None (Public) | Staff login |
| GET | `/api/staff/profile` | `staff` role | Get staff profile |

**Example Request (Staff Login):**
```json
POST /api/staff/login
{
  "email": "staff@example.com",
  "password": "password123"
}
```

**Example Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "staff": {
    "id": "...",
    "name": "John Doe",
    "email": "staff@example.com",
    "phone": "1234567890",
    "location": "Mumbai",
    "gender": "male",
    "img": "/uploads/staff/filename.jpg",
    "role": {
      "id": "...",
      "name": "Manager",
      "permissions": ["view_users", "view_bookings"]
    }
  }
}
```

**Note:** JWT token me permissions array included hota hai:
```json
{
  "userId": "...",
  "email": "staff@example.com",
  "role": "staff",
  "roleId": "...",
  "permissions": ["view_users", "view_bookings"]
}
```

---

### 4. Review Management APIs (4 endpoints)
**Base Path:** `/api/admin/reviews`

| Method | Endpoint | Permission Required | Description |
|--------|----------|-------------------|-------------|
| GET | `/api/admin/reviews` | `view_reviews` | Get all reviews (with filters) |
| GET | `/api/admin/reviews/:id` | `view_reviews` | Get review by ID |
| PUT | `/api/admin/reviews/:id` | `edit_reviews` | Update review |
| DELETE | `/api/admin/reviews/:id` | `delete_reviews` | Delete review |

**Example Request (Get Reviews with Filters):**
```json
GET /api/admin/reviews?venueId=VENUE_ID&rating=5&userId=USER_ID
```

**Example Response:**
```json
{
  "success": true,
  "count": 32,
  "reviews": [
    {
      "_id": "...",
      "userId": {...},
      "venueId": {...},
      "rating": 5,
      "comment": "Great venue!",
      "reply": {...},
      "createdAt": "..."
    }
  ]
}
```

---

## 📊 API SUMMARY

### Total New APIs: **17 endpoints**

| Category | Count | Endpoints |
|----------|-------|-----------|
| Role Management | 6 | GET all, GET by ID, GET permissions, POST, PUT, DELETE |
| Staff Management | 5 | GET all, GET by ID, POST, PUT, DELETE |
| Staff Auth | 2 | POST login, GET profile |
| Review Management | 4 | GET all, GET by ID, PUT, DELETE |

---

## 🔐 Permission-Based Access

### Important Notes:
1. **All admin routes require:**
   - `requireAuth` middleware (JWT token)
   - `requireRole('admin', 'staff')` middleware
   - Specific permission check via `requirePermission()`

2. **Admin has all permissions automatically**
   - Admin ko koi permission check fail nahi hota

3. **Staff permissions come from their role**
   - Staff ke JWT token me permissions array hota hai
   - Har route pe specific permission check hota hai

4. **Public routes:**
   - `POST /api/staff/login` - No authentication required

---

## 🧪 Testing Examples

### 1. Create Role
```bash
POST /api/admin/roles
Headers: Authorization: Bearer <admin_token>
Body: {
  "name": "Manager",
  "permissions": ["view_users", "view_bookings", "edit_bookings"]
}
```

### 2. Create Staff
```bash
POST /api/admin/staff
Headers: 
  Authorization: Bearer <admin_token>
  Content-Type: multipart/form-data
Body: FormData with name, phone, email, password, location, gender, role, img
```

### 3. Staff Login
```bash
POST /api/staff/login
Body: {
  "email": "staff@example.com",
  "password": "password123"
}
```

### 4. Get All Reviews
```bash
GET /api/admin/reviews
Headers: Authorization: Bearer <staff_token>
Query: ?venueId=xxx&rating=5
```

### 5. Get Available Permissions
```bash
GET /api/admin/roles/permissions/available
Headers: Authorization: Bearer <admin_token>
```

---

## 📝 API Response Formats

### Success Response:
```json
{
  "message": "Operation successful",
  "data": {...}
}
```

### Error Response:
```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

### Permission Denied:
```json
{
  "error": "Forbidden",
  "message": "You do not have the required permissions to access this resource"
}
```

---

## 🔗 Related Files

- **Routes:** `src/routes/v1/admin.routes.js`, `src/routes/v1/staff.routes.js`
- **Controllers:** `src/controllers/role.controller.js`, `src/controllers/staff.controller.js`, `src/controllers/review.controller.js`
- **Middleware:** `src/middlewares/auth.js` (requirePermission)
- **Models:** `src/models/Role.js`, `src/models/Staff.js`

---

**Total New APIs:** 17 endpoints
**All APIs are protected** except `POST /api/staff/login`


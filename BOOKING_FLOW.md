# Booking Flow Documentation

## Complete Booking Flow: Customer → Admin → Vendor

### 📋 Overview
Booking process mein 3 main steps hain:
1. **Customer** booking create karta hai (payment ke saath)
2. **Admin** booking ko approve/reject karta hai
3. **Vendor** sirf approved bookings dekh sakta hai

---

## 🔄 Step-by-Step Flow

### Step 1: Customer Booking Create

**Location:** `backend/src/controllers/booking.controller.js` - `createBooking()`

**Process:**
1. Customer venue select karta hai
2. Booking details fill karta hai (date, guests, etc.)
3. Payment karta hai
4. Booking create hoti hai with:
   ```javascript
   {
     status: 'pending',           // ✅ Pending status
     adminApproved: false,         // ✅ Admin approval pending
     paymentStatus: 'paid',        // Payment done
     paymentId: <payment_id>
   }
   ```
5. Lead bhi create hota hai (admin tracking ke liye)

**Important:** Booking create hote hi **confirmed** nahi hoti, **pending** status mein hoti hai.

---

### Step 2: Payment Callback (Microservice)

**Location:** `backend/src/controllers/microserviceCallback.controller.js` - `handleMicroserviceCallback()`

**Process:**
1. Payment microservice callback bhejta hai
2. Booking create hoti hai (agar pehle se nahi bani)
3. Booking status: **'pending'** (not 'confirmed')
4. `adminApproved: false` (admin approval required)

**Fixed:** Ab status directly 'confirmed' nahi hoti, 'pending' hoti hai.

---

### Step 3: Customer View

**Location:** `src/pages/customer/BookingHistory.jsx`

**What Customer Sees:**
- ✅ Apni sabhi bookings (approved/unapproved dono)
- ✅ Leads (agar payment nahi kiya)
- ✅ Booking status: 'pending', 'confirmed', etc.

**Filter Logic:**
```javascript
// Customer sees all their bookings regardless of adminApproved
filter.$or = [
  { customerId: userId },
  { deviceId: deviceIdFromQuery }
]
// Don't filter by adminApproved for customers
```

---

### Step 4: Admin View & Approval

**Location:** `src/pages/admin/bookings/index.jsx`

**Admin Dashboard:**
- ✅ Sabhi bookings dikhengi (approved/unapproved)
- ✅ Approve/Reject buttons dikhenge pending bookings ke liye
- ✅ Status manually change kar sakte hain

**Approve Button:**
- **Location:** Admin Bookings page (`/admin/bookings`)
- **Condition:** `booking.status === 'pending' && !booking.adminApproved`
- **Action:** `bookingsAPI.approve(bookingId)`

**Backend Approve Function:**
**Location:** `backend/src/controllers/admin.controller.js` - `approveBooking()`

```javascript
// Admin approves booking
await Booking.findByIdAndUpdate(id, { 
  adminApproved: true  // ✅ Vendor ko ab dikhegi
})
// Status abhi bhi 'pending' rahega (admin manually change kar sakta hai)
```

**Important:** 
- Admin approve karte waqt sirf `adminApproved: true` set hota hai
- Status change nahi hota (admin manually 'confirmed' kar sakta hai)
- Ab vendor ko booking dikhne lagti hai

---

### Step 5: Vendor View

**Location:** `backend/src/controllers/vendor.controller.js` - `getVendorBookings()`

**What Vendor Sees:**
- ✅ Sirf **admin-approved** bookings
- ✅ Sirf apne venues ki bookings
- ❌ Unapproved bookings nahi dikhengi

**Filter Logic:**
```javascript
// Vendor sees ONLY admin-approved bookings
filter.adminApproved = true
filter.venueId = { $in: vendorVenueIds }
```

**Important:** 
- Vendor tab tak booking nahi dekh sakta jab tak admin approve nahi karta
- `adminApproved: true` wali bookings hi vendor ko dikhengi

---

## 📊 Status Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    BOOKING STATUS FLOW                      │
└─────────────────────────────────────────────────────────────┘

Customer Creates Booking
    ↓
status: 'pending'
adminApproved: false
paymentStatus: 'paid'
    ↓
Admin Reviews Booking
    ↓
Admin Approves (adminApproved: true)
    ↓
Vendor Can Now See Booking
    ↓
Admin Can Change Status to 'confirmed' (optional)
    ↓
Booking Complete
```

---

## 🔑 Key Fields

### `status` Field
- **'pending'**: Booking create hui hai, admin approval pending
- **'confirmed'**: Admin ne manually confirm kar diya
- **'cancelled'**: Booking cancel ho gayi
- **'completed'**: Event complete ho gaya

### `adminApproved` Field
- **false**: Vendor ko nahi dikhegi (admin approval pending)
- **true**: Vendor ko dikhegi (admin ne approve kar diya)

### `paymentStatus` Field
- **'paid'**: Payment ho gaya
- **'pending'**: Payment pending
- **'failed'**: Payment fail ho gaya

---

## 🛠️ Admin Actions

### 1. Approve Booking
- **Endpoint:** `PUT /api/admin/bookings/:id/approve`
- **Action:** Sets `adminApproved: true`
- **Result:** Vendor ko booking dikhne lagti hai

### 2. Reject Booking
- **Endpoint:** `PUT /api/admin/bookings/:id/reject`
- **Action:** Booking reject ho jati hai
- **Result:** Vendor ko nahi dikhegi

### 3. Update Status
- **Endpoint:** `PUT /api/admin/bookings/:id/status`
- **Action:** Status manually change kar sakte hain
- **Options:** 'pending', 'confirmed', 'cancelled', 'completed'

---

## 📝 Important Notes

1. **Booking Create:** Status hamesha 'pending' hoti hai (not 'confirmed')
2. **Admin Approval:** `adminApproved: true` set hota hai, status change nahi hota
3. **Vendor Visibility:** Sirf `adminApproved: true` wali bookings dikhengi
4. **Customer View:** Customer apni sab bookings dekh sakta hai (approved/unapproved)
5. **Status Change:** Admin manually status change kar sakta hai

---

## 🐛 Fixed Issues

1. ✅ **Microservice Callback:** Ab status 'pending' set hoti hai (pehle 'confirmed' thi)
2. ✅ **Admin Approval:** `adminApproved: true` properly set ho raha hai
3. ✅ **Flow:** Booking create → Pending → Admin Approve → Vendor See

---

## 📍 File Locations

- **Customer Booking Create:** `backend/src/controllers/booking.controller.js`
- **Payment Callback:** `backend/src/controllers/microserviceCallback.controller.js`
- **Admin Approve:** `backend/src/controllers/admin.controller.js` - `approveBooking()`
- **Vendor View:** `backend/src/controllers/vendor.controller.js` - `getVendorBookings()`
- **Admin UI:** `src/pages/admin/bookings/index.jsx`
- **Customer UI:** `src/pages/customer/BookingHistory.jsx`







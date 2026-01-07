# Payment APIs Documentation

## Overview

यह project **Microservices Architecture** use करता है Razorpay payments के लिए। Direct Razorpay integration नहीं है, बल्कि एक **Central Payments Microservice** के through payments handle होते हैं।

## Payment Flow

```
Frontend → Backend API → Microservice → Razorpay → Microservice → Backend Callback → Booking Created
```

## Architecture

### 1. **Microservice-Based Payment System**
- **Microservice URL**: `https://payments.synilogic.in` (configured via `MICROSERVICE_API_URL`)
- **Hosted Checkout**: Payments microservice पर hosted checkout page
- **HMAC Authentication**: Microservice calls के लिए HMAC SHA256 signature

### 2. **Configuration**
- **PaymentConfig Model** में:
  - `razorpayKeyId` → Microservice Project Code
  - `razorpayKeySecret` → Microservice Project Secret
- **Environment Variable**:
  - `MICROSERVICE_API_URL` → Microservice base URL

---

## Frontend APIs (Customer)

### Base URL
```
http://localhost:8030/api/payment
```

### 1. Get Payment Config
**Endpoint:** `GET /api/payment/config`  
**Auth:** ❌ Not Required (Public)

**Response:**
```json
{
  "razorpayKeyId": "rzp_test_xxxxx"
}
```

**Usage:**
```javascript
import { paymentAPI } from '@/services/customer/api';

const config = await paymentAPI.getConfig();
```

---

### 2. Create Payment Order
**Endpoint:** `POST /api/payment/create-order`  
**Auth:** ❌ Optional (works without login)

**Request Body:**
```json
{
  "amount": 50000,           // Amount in paise (₹500 = 50000 paise)
  "currency": "INR",
  "bookingData": {
    "venueId": "venue_id",
    "date": "2025-12-25",
    "dateFrom": "2025-12-25",
    "dateTo": "2025-12-26",
    "guests": 100,
    "rooms": 5,
    "eventType": "wedding",
    "marriageFor": "boy",
    "name": "Customer Name",
    "email": "customer@example.com",
    "phone": "9876543210",
    "foodPreference": "both",
    "totalAmount": 500,      // Amount in rupees
    "deviceId": "device_id"
  }
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "order_xxxxx",
    "amount": 50000,
    "currency": "INR"
  }
}
```

**Usage:**
```javascript
const orderResponse = await paymentAPI.createOrder({
  amount: totalAmount,      // in paise
  currency: 'INR',
  bookingData: bookingData
});

if (orderResponse.data.success) {
  const order = orderResponse.data.order;
  // Redirect to hosted checkout
  const checkoutUrl = `https://payments.synilogic.in/pay/${order.id}?return_url=${returnUrl}`;
  window.location.href = checkoutUrl;
}
```

**What happens:**
1. Backend validates booking dates
2. Checks venue availability
3. Calls microservice: `POST /api/payment/order`
4. Microservice creates Razorpay order
5. Returns order ID for checkout

---

### 3. Verify Payment (After Payment)
**Endpoint:** `POST /api/payment/verify`  
**Auth:** ❌ Optional

**Request Body:**
```json
{
  "razorpay_order_id": "order_xxxxx",
  "razorpay_payment_id": "pay_xxxxx",
  "razorpay_signature": "signature_xxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified and booking created",
  "booking": {
    "_id": "booking_id",
    "status": "pending",
    "paymentStatus": "paid"
  }
}
```

**Usage:**
```javascript
const verifyResponse = await paymentAPI.verify({
  razorpay_order_id: orderId,
  razorpay_payment_id: paymentId,
  razorpay_signature: signature
});
```

---

### 4. Verify Payment for Lead
**Endpoint:** `POST /api/payment/verify-lead`  
**Auth:** ❌ Optional

**Request Body:**
```json
{
  "razorpay_order_id": "order_xxxxx",
  "razorpay_payment_id": "pay_xxxxx",
  "razorpay_signature": "signature_xxxxx",
  "leadId": "lead_id"
}
```

**Usage:** Lead को booking में convert करने के लिए

---

## Backend APIs

### Payment Controller (`backend/src/controllers/payment.controller.js`)

#### 1. `createPaymentOrder`
- Date availability check करता है
- Venue validation करता है
- Microservice को call करता है: `POST /api/payment/order`
- HMAC signature के साथ request भेजता है

#### 2. `verifyPayment`
- Razorpay signature verify करता है
- Booking create करता है
- Payment status update करता है

#### 3. `verifyPaymentForLead`
- Lead को booking में convert करता है

---

## Microservice Integration

### Microservice Client (`backend/src/utils/microserviceClient.js`)

**Function:** `callMicroservice(endpoint, method, payload)`

**How it works:**
1. PaymentConfig से project code और secret fetch करता है
2. Request body का HMAC SHA256 signature generate करता है
3. Headers में भेजता है:
   - `X-Project-Id`: Project code
   - `X-Project-Signature`: HMAC signature
4. Microservice को call करता है

**Example:**
```javascript
const response = await callMicroservice('/api/payment/order', 'POST', {
  amount: 50000,
  currency: 'INR',
  customer: { name, email, contact },
  notes: { source: 'Shubhvenue', venue_id, booking_data }
});
```

---

## Microservice Callback

### Callback Endpoint
**URL:** `POST /api/microservice/payment-callback`

**Headers:**
- `X-Microservice-Signature`: HMAC signature

**Payload:**
```json
{
  "transaction_id": "txn_xxxxx",
  "order_id": "order_xxxxx",
  "payment_id": "pay_xxxxx",
  "status": "paid",
  "amount": 50000,
  "currency": "INR",
  "customer": {
    "name": "Customer Name",
    "email": "customer@example.com",
    "contact": "9876543210"
  },
  "notes": {
    "source": "Shubhvenue",
    "venue_id": "venue_id",
    "booking_data": { ... }
  }
}
```

**What happens:**
1. Signature verify होता है
2. Payment status check होता है
3. Booking create होता है (अगर `status === 'paid'`)
4. Response return होता है

---

## Payment Flow Diagram

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │
       │ 1. POST /api/payment/create-order
       │    { amount, bookingData }
       ▼
┌─────────────┐
│   Backend   │
│   (Node.js) │
└──────┬──────┘
       │
       │ 2. Validate dates & venue
       │ 3. POST /api/payment/order (with HMAC)
       │    { amount, customer, notes }
       ▼
┌─────────────┐
│ Microservice│
│(payments.   │
│ synilogic.in)│
└──────┬──────┘
       │
       │ 4. Create Razorpay Order
       │ 5. Return order_id
       │
       │ 6. Redirect to hosted checkout
       ▼
┌─────────────┐
│   Razorpay  │
│  Checkout   │
└──────┬──────┘
       │
       │ 7. User completes payment
       │
       │ 8. POST /api/microservice/payment-callback
       │    { payment_id, status, notes }
       ▼
┌─────────────┐
│   Backend   │
│  Callback   │
└──────┬──────┘
       │
       │ 9. Verify signature
       │ 10. Create booking
       │
       │ 11. Redirect to return_url
       ▼
┌─────────────┐
│   Frontend  │
│(booking-    │
│  history)   │
└─────────────┘
```

---

## Environment Variables

### Backend (.env)
```env
MICROSERVICE_API_URL=https://payments.synilogic.in
RAZORPAY_KEY_ID=rzp_test_xxxxx        # Optional (legacy)
RAZORPAY_KEY_SECRET=secret_xxxxx      # Optional (legacy)
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8030/api
```

---

## Admin Configuration

Admin panel में payment configuration:
- **Settings → Payment Configuration**
- **Razorpay Key ID** → Microservice Project Code
- **Razorpay Key Secret** → Microservice Project Secret

---

## Key Differences: Direct Razorpay vs Microservice

### Direct Razorpay (Not Used)
```javascript
// ❌ Not used in this project
const razorpay = new Razorpay({
  key_id: 'rzp_test_xxxxx',
  key_secret: 'secret_xxxxx'
});

const order = await razorpay.orders.create({
  amount: 50000,
  currency: 'INR'
});
```

### Microservice (Current Implementation)
```javascript
// ✅ Current implementation
const response = await callMicroservice('/api/payment/order', 'POST', {
  amount: 50000,
  currency: 'INR',
  customer: { name, email, contact },
  notes: { source: 'Shubhvenue', venue_id, booking_data }
});
```

---

## Testing

### Test Payment Order Creation
```bash
curl -X POST http://localhost:8030/api/payment/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "currency": "INR",
    "bookingData": {
      "venueId": "venue_id",
      "date": "2025-12-25",
      "guests": 50,
      "name": "Test User",
      "phone": "9876543210",
      "marriageFor": "boy",
      "totalAmount": 100
    }
  }'
```

---

## Important Notes

1. **Microservice Required**: Direct Razorpay integration नहीं है
2. **HMAC Authentication**: सभी microservice calls में signature required
3. **Hosted Checkout**: Payment microservice पर hosted checkout page use होता है
4. **Callback URL**: Microservice project में callback URL configure होना चाहिए:
   ```
   https://shubhvenue.com/api/microservice/payment-callback
   ```
5. **Amount**: हमेशा **paise** में send करें (₹1 = 100 paise)

---

## Troubleshooting

### Error: "Microservice is not fully configured"
- Check `MICROSERVICE_API_URL` environment variable
- Check PaymentConfig में project code और secret set हैं या नहीं

### Error: "Invalid signature"
- Project secret सही है या नहीं check करें
- HMAC signature generation verify करें

### Error: "Microservice did not return a valid order"
- Microservice server running है या नहीं
- Network connectivity check करें
- Microservice logs check करें

---

## API Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/payment/config` | GET | ❌ | Get Razorpay key ID |
| `/api/payment/create-order` | POST | ❌ | Create payment order |
| `/api/payment/verify` | POST | ❌ | Verify payment & create booking |
| `/api/payment/verify-lead` | POST | ❌ | Verify payment & convert lead |
| `/api/microservice/payment-callback` | POST | ✅ | Microservice callback |

---

## Files Reference

- **Frontend API**: `src/services/customer/api.js`
- **Backend Controller**: `backend/src/controllers/payment.controller.js`
- **Microservice Client**: `backend/src/utils/microserviceClient.js`
- **Callback Handler**: `backend/src/controllers/microserviceCallback.controller.js`
- **Routes**: `backend/src/routes/v1/payment.routes.js`
- **Payment Config Model**: `backend/src/models/PaymentConfig.js`


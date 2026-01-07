# Payment Method Switching Guide

## Overview

अब admin panel में **dono payment methods** में से किसी एक को enable/disable कर सकते हैं:
1. **Razorpay Direct** - Direct Razorpay integration
2. **Microservice Payment** - Central payments microservice (default)

## Features

✅ Admin can enable/disable payment methods  
✅ Customer automatically uses enabled payment method  
✅ Only one method active at a time  
✅ Easy switching between methods  
✅ Backend automatically handles the selected method  

## Admin Configuration

### Steps:

1. **Admin Panel** → **Settings** → **Payment Configuration**

2. **Payment Method Select करें:**
   - **Microservice Payment** (default) - Central payments microservice use करेगा
   - **Razorpay Direct** - Direct Razorpay integration use करेगा

3. **अगर Razorpay Direct select किया:**
   - Razorpay Key ID enter करें
   - Razorpay Key Secret enter करें
   - **Update Payment Configuration** click करें

4. **अगर Microservice select किया:**
   - Backend में `MICROSERVICE_API_URL` environment variable set होना चाहिए
   - PaymentConfig में project code और secret set होने चाहिए

## How It Works

### Backend Flow

1. **Payment Order Creation** (`POST /api/payment/create-order`):
   - PaymentConfig check करता है
   - `enableRazorpayDirect === true` → Razorpay Direct use करता है
   - `enableMicroservice === true` → Microservice use करता है
   - Response में `paymentMethod` field return करता है

2. **Payment Verification**:
   - Razorpay Direct: Signature verify करता है
   - Microservice: Callback handle करता है

### Frontend Flow

1. **Payment Order Create** करता है
2. Response से `paymentMethod` check करता है:
   - `razorpay_direct` → Razorpay Checkout modal open करता है
   - `microservice` → Hosted checkout page पर redirect करता है

## Code Changes

### Backend

1. **PaymentConfig Model** (`backend/src/models/PaymentConfig.js`):
   - `enableRazorpayDirect` (Boolean, default: false)
   - `enableMicroservice` (Boolean, default: true)

2. **Payment Controller** (`backend/src/controllers/payment.controller.js`):
   - Method selection logic
   - Direct Razorpay API integration
   - Microservice integration (existing)

3. **Admin Controller** (`backend/src/controllers/admin.controller.js`):
   - Payment method update support
   - Validation (only one method enabled)

### Frontend

1. **Settings Page** (`src/pages/admin/settings/index.jsx`):
   - Payment method radio buttons
   - Conditional Razorpay key fields
   - Payment method state management

2. **Booking Flow** (`src/pages/customer/Booking.jsx`):
   - Payment method detection
   - Razorpay Checkout integration
   - Microservice redirect

3. **Venue Detail** (`src/components/customer/VenueDetail.jsx`):
   - Payment method detection
   - Razorpay Checkout integration
   - Microservice redirect

## API Response Format

### Payment Order Response

```json
{
  "success": true,
  "paymentMethod": "razorpay_direct" | "microservice",
  "order": {
    "id": "order_xxxxx",
    "amount": 50000,
    "currency": "INR"
  },
  "razorpayKeyId": "rzp_test_xxxxx" // Only if razorpay_direct
}
```

## Testing

### Test Razorpay Direct:

1. Admin panel में **Razorpay Direct** enable करें
2. Razorpay keys enter करें
3. Customer side से booking करें
4. Razorpay Checkout modal आना चाहिए

### Test Microservice:

1. Admin panel में **Microservice Payment** enable करें
2. Customer side से booking करें
3. Hosted checkout page पर redirect होना चाहिए

## Important Notes

1. **Only One Method**: एक समय में केवल एक payment method active हो सकता है
2. **Razorpay Keys**: Razorpay Direct के लिए valid keys required हैं
3. **Microservice Config**: Microservice के लिए backend environment variable required है
4. **Customer Experience**: Customer को automatically correct payment method दिखेगा

## Troubleshooting

### Error: "Only one payment method can be enabled"
- ✅ **Solution**: एक method disable करके दूसरा enable करें

### Error: "Razorpay Key ID and Secret are required"
- ✅ **Solution**: Razorpay Direct enable करने पर keys enter करें

### Payment method not switching
- ✅ **Solution**: Backend server restart करें
- ✅ Check PaymentConfig में settings correctly save हुई हैं या नहीं

## Migration Notes

- Existing microservice setup **preserved** है
- Default: Microservice enabled
- Backward compatible: अगर method select नहीं किया, microservice use होगा

---

**Status**: ✅ Complete and Ready to Use


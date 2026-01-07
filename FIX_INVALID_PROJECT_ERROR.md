# Fix "Invalid Project" Error - Step by Step Guide

## Current Error
```
❌ Payment order creation error: Error: Invalid project
POST http://localhost:8030/api/payment/create-order 500 (Internal Server Error)
```

## Root Cause
यह error तब आता है जब Microservice में project code या secret **incorrect** है।

## Solution Steps

### Step 1: Check Backend Logs
Backend server के logs में अब detailed information दिखेगी:

```bash
# PM2 logs देखें
pm2 logs wedding-venue-backend

# या direct logs
tail -f logs/app.log
```

Logs में यह दिखेगा:
- 📋 Payment Config (कौन सा method enabled है)
- 🎯 Selected Payment Method
- 🔍 Microservice Config Check (API URL, Project ID, Secret check)

### Step 2: Verify Payment Configuration

#### A. Admin Panel में Check करें:
1. **Admin Panel** → **Settings** → **Payment Configuration**
2. **Payment Method** देखें:
   - **Microservice Payment** selected है?
   - **Razorpay Direct** selected है?

#### B. Configuration Verify करें:

**अगर Microservice enabled है:**
- **Project Code** (Razorpay Key ID field) में सही project code होना चाहिए
- **Project Secret** (Razorpay Key Secret field) में सही secret होना चाहिए
- Backend `.env` file में `MICROSERVICE_API_URL` set होना चाहिए

**अगर Razorpay Direct enabled है:**
- **Razorpay Key ID** में `rzp_test_...` या `rzp_live_...` होना चाहिए
- **Razorpay Key Secret** सही होना चाहिए

### Step 3: Fix Configuration

#### Option A: Microservice Configuration Fix

1. **Microservice Admin Panel** में जाएं
2. **Project Code** और **Secret** verify करें
3. **Admin Panel** → **Settings** → **Payment Configuration** में:
   - **Microservice Payment** select करें
   - **Project Code** enter करें (microservice project code)
   - **Project Secret** enter करें (microservice project secret)
   - **Update Payment Configuration** click करें

4. **Backend `.env` file** check करें:
   ```env
   MICROSERVICE_API_URL=https://payments.synilogic.in
   ```

5. **Backend server restart** करें:
   ```bash
   pm2 restart wedding-venue-backend
   # या
   npm run dev
   ```

#### Option B: Switch to Razorpay Direct (Temporary Fix)

1. **Admin Panel** → **Settings** → **Payment Configuration**
2. **Razorpay Direct** select करें
3. Valid **Razorpay Key ID** और **Secret** enter करें
4. **Update Payment Configuration** click करें

### Step 4: Test Again

1. Customer side से booking try करें
2. Backend logs check करें
3. Error message अब detailed होगी

## What Changed

### Better Error Messages:
- ✅ Clear error messages अब frontend पर दिखेंगी
- ✅ Specific guidance क्या check करना है
- ✅ Configuration status logs में दिखेगा

### Enhanced Logging:
- ✅ Payment method selection logs
- ✅ Microservice config verification logs
- ✅ Detailed error response logs

## Debug Checklist

- [ ] Backend logs में payment config details देखें
- [ ] Admin panel में payment method correctly set है
- [ ] Project Code और Secret microservice में match करते हैं
- [ ] `MICROSERVICE_API_URL` backend `.env` में set है
- [ ] Backend server restarted है
- [ ] Microservice server running है
- [ ] Project code में spaces या extra characters तो नहीं

## Common Issues

### Issue 1: "Invalid Project" Error
**Cause:** Project code या secret wrong है
**Fix:** Microservice admin panel से correct values verify करें और admin settings में update करें

### Issue 2: "Microservice Not Configured"
**Cause:** `MICROSERVICE_API_URL` या payment config missing है
**Fix:** Backend `.env` file में `MICROSERVICE_API_URL` set करें और admin panel में config add करें

### Issue 3: Wrong Payment Method Selected
**Cause:** Admin panel में wrong payment method selected है
**Fix:** Admin panel में correct payment method select करें

## Next Steps

1. ✅ Backend logs check करें
2. ✅ Payment configuration verify करें
3. ✅ Correct values set करें
4. ✅ Backend restart करें
5. ✅ Test करें

अगर अभी भी error आ रहा है, backend logs share करें - अब detailed information दिखेगी!


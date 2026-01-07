# Payment Error Troubleshooting Guide

## Error: "Invalid project"

### Cause
यह error तब आता है जब:
1. Microservice project code या secret **incorrect** है
2. Microservice API में project **not found** है
3. Project code format **wrong** है

### Solution

#### Step 1: Admin Panel में Check करें
1. **Admin Panel** → **Settings** → **Payment Configuration**
2. **Payment Method** check करें:
   - अगर **Microservice** enabled है:
     - Project Code (Razorpay Key ID) सही है या नहीं
     - Project Secret (Razorpay Key Secret) सही है या नहीं
   - अगर **Razorpay Direct** enabled है:
     - Razorpay Key ID सही है या नहीं
     - Razorpay Key Secret सही है या नहीं

#### Step 2: Backend Environment Check करें
```bash
# Backend .env file में check करें:
MICROSERVICE_API_URL=https://payments.synilogic.in
```

#### Step 3: Configuration Verify करें
1. Admin panel में payment configuration **save** करें
2. Backend server **restart** करें
3. फिर से try करें

#### Step 4: Microservice से Verify करें
- Microservice admin panel में project code और secret verify करें
- Project **active** है या नहीं check करें

---

## Common Errors and Solutions

### 1. Error: "Microservice is not fully configured"
**Solution:**
- `MICROSERVICE_API_URL` environment variable set करें
- PaymentConfig में project code और secret add करें

### 2. Error: "Invalid Project Configuration"
**Solution:**
- Project code और secret सही enter करें
- Microservice admin panel में verify करें
- Secret में spaces या extra characters तो नहीं हैं

### 3. Error: "Razorpay Key ID and Secret are required"
**Solution:**
- Razorpay Direct enable करने पर keys enter करना **required** है
- Keys सही format में हैं या नहीं check करें (`rzp_test_...`)

### 4. Error: "Payment configuration error"
**Solution:**
- Microservice response में issue है
- Backend logs check करें
- Microservice server running है या नहीं verify करें

---

## Debug Steps

### 1. Check Payment Method
```javascript
// Backend logs में check करें:
console.log('Payment Method:', useMicroservice ? 'microservice' : 'razorpay_direct');
console.log('Config:', {
  enableMicroservice: config.enableMicroservice,
  enableRazorpayDirect: config.enableRazorpayDirect
});
```

### 2. Check Microservice Config
```javascript
// Backend में check करें:
const { apiUrl, projectId, projectSecret } = await getMicroserviceConfig();
console.log('Microservice Config:', {
  apiUrl,
  projectId: projectId.substring(0, 10) + '...',
  hasSecret: !!projectSecret
});
```

### 3. Test Payment Config
```bash
# Backend directory में:
node test_payment_config.js
```

---

## Quick Fix Checklist

- [ ] Admin panel में correct payment method selected है
- [ ] Payment config में correct keys entered हैं
- [ ] Backend server restarted है
- [ ] Environment variables set हैं
- [ ] Microservice server running है
- [ ] Project code और secret microservice में verify किए हैं
- [ ] No extra spaces in keys
- [ ] Correct key format (`rzp_test_...` for Razorpay)

---

## Still Having Issues?

1. **Backend Logs Check करें:**
   ```bash
   # PM2 logs
   pm2 logs wedding-venue-backend
   
   # Or direct logs
   tail -f logs/app.log
   ```

2. **Browser Console Check करें:**
   - Network tab में API request देखें
   - Response में exact error message देखें

3. **Microservice Logs Check करें:**
   - Microservice admin panel में logs देखें
   - Request आ रही है या नहीं verify करें

---

## Contact Support

अगर issue resolve नहीं हो रहा:
1. Error message की screenshot लें
2. Backend logs share करें
3. Payment configuration (masked) share करें
4. Steps to reproduce share करें


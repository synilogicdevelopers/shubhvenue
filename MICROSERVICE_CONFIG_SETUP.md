# Microservice Payment Configuration Setup

## Problem
```
Error: Microservice project code or secret is incorrect. 
Please verify the payment configuration in admin settings.
```

## Solution Steps

### Step 1: Get Microservice Credentials

1. **Microservice Admin Panel** में जाएं:
   - URL: `https://payments.synilogic.in` (या आपका microservice URL)
   - Login करें

2. **Project Settings** में जाएं:
   - Your Project को select करें
   - **Project Code** copy करें
   - **Project Secret** copy करें

### Step 2: Configure in Admin Panel

1. **Admin Panel** → **Settings** → **Payment Configuration**

2. **Payment Method** select करें:
   - ✅ **Microservice Payment** radio button select करें

3. **Configuration Fields** भरें:
   - **Microservice Project Code (Key ID):**
     - Microservice admin panel से copy किया हुआ Project Code enter करें
     - Example: `PROJECT_ABC123`
   
   - **Microservice Project Secret (Key Secret):**
     - Microservice admin panel से copy किया हुआ Project Secret enter करें
     - Click करके show/hide कर सकते हैं
     - Example: `secret_xyz789...`

4. **Update Payment Configuration** button click करें

### Step 3: Backend Environment Check

**Backend `.env` file** में verify करें:
```env
MICROSERVICE_API_URL=https://payments.synilogic.in
```

अगर नहीं है, तो add करें और backend restart करें:
```bash
pm2 restart wedding-venue-backend
# या
npm run dev
```

### Step 4: Test

1. Admin panel में configuration save करें
2. Backend server restart करें (अगर .env में change किया)
3. Customer side से booking try करें
4. Error अब नहीं आना चाहिए

## Important Notes

⚠️ **Confusion Avoid करें:**
- ❌ ये **Razorpay keys नहीं हैं**
- ✅ ये **Microservice Project Code और Secret** हैं
- ✅ Microservice admin panel से मिलते हैं

⚠️ **Format:**
- Project Code: Usually alphanumeric string (e.g., `PROJECT_123`)
- Project Secret: Long string (usually starts with `secret_` or random string)

⚠️ **Security:**
- Project Secret कभी भी expose न करें
- Admin panel में masked display होता है
- Full secret सिर्फ update करने के लिए enter करना होता है

## Troubleshooting

### Error: "Invalid project"
**Cause:** Project Code या Secret wrong है
**Fix:** 
1. Microservice admin panel में verify करें
2. Exact values copy करें (spaces न आएं)
3. Admin settings में update करें

### Error: "Microservice Not Configured"
**Cause:** `MICROSERVICE_API_URL` missing है
**Fix:**
1. Backend `.env` file में add करें
2. Backend server restart करें

### Still Not Working?
1. **Backend logs check करें:**
   ```bash
   pm2 logs wedding-venue-backend
   ```
   
2. Logs में यह देखें:
   - 🔍 Microservice Config Check
   - Project Code preview
   - Secret length
   - API URL status

3. **Values verify करें:**
   - Project Code exact match कर रहा है?
   - Secret में spaces या extra characters तो नहीं?
   - API URL correct है?

## Quick Checklist

- [ ] Microservice admin panel से Project Code copy किया
- [ ] Microservice admin panel से Project Secret copy किया
- [ ] Admin panel में Microservice Payment selected है
- [ ] Project Code correctly entered है
- [ ] Project Secret correctly entered है
- [ ] Backend `.env` में `MICROSERVICE_API_URL` set है
- [ ] Backend server restarted है
- [ ] Configuration saved है

---

**Need Help?** Backend logs share करें - detailed information मिलेगी!


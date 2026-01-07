# Quick Fix: Microservice Payment Error

## Current Error
```
Error: Microservice project code or secret is incorrect
```

## Solution

### Step 1: Backend .env File Check
Backend directory mein `.env` file check karo:

```env
MICROSERVICE_API_URL=https://payments.synilogic.in
```

**Important:** Agar yeh line missing hai ya galat hai, to:
1. `.env` file mein add/update karo
2. Backend server **restart** karo

### Step 2: Verify Microservice URL
- Microservice URL correct hai ya nahi verify karo
- URL accessible hai ya nahi check karo

### Step 3: Backend Server Restart
```bash
# PM2 se restart
pm2 restart wedding-venue-backend

# Ya direct restart
npm run dev
```

### Step 4: Check Backend Logs
Backend logs mein yeh dikhega:
```
🔍 Microservice Config Check:
   hasApiUrl: true/false
   apiUrl: https://...
```

Agar `hasApiUrl: false` hai, to `.env` file mein `MICROSERVICE_API_URL` set nahi hai.

## Still Getting Error?

Agar "Invalid project" error abhi bhi aa raha hai, to:

1. **Backend logs check karo:**
   ```bash
   pm2 logs wedding-venue-backend
   ```

2. **Microservice URL test karo:**
   ```bash
   curl https://payments.synilogic.in/api/health
   ```

3. **Verify configuration:**
   - Backend `.env` file mein `MICROSERVICE_API_URL` set hai
   - URL correct format mein hai (https://...)
   - Backend server restarted hai

## Alternative: Switch to Razorpay Direct

Agar microservice issue fix nahi ho raha, temporarily Razorpay Direct use karo:

1. Admin Panel → Settings → Payment Configuration
2. **Razorpay Direct** select karo
3. Razorpay keys enter karo
4. Save karo

---

**Most Common Issue:** Backend `.env` file mein `MICROSERVICE_API_URL` missing ya incorrect hai.


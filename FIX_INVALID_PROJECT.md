# Fix "Invalid Project" Error - Complete Guide

## Current Error
```
Error: Invalid project
POST /api/payment/create-order 400 (Bad Request)
```

## Root Cause
Microservice ko **"Invalid project"** error tab aata hai jab:
1. Project Code (Key ID) **wrong** hai
2. Project Secret (Key Secret) **wrong** hai  
3. Project Code/Secret **match nahi kar rahe** microservice mein configured values se
4. Project Code/Secret mein **extra spaces** ya formatting issues hain

## Solution Steps

### Step 1: Verify in Microservice Admin Panel

1. **Microservice Admin Panel** mein jao:
   - URL: `https://payments.synilogic.in` (ya aapka microservice URL)
   - Login karo

2. **Project Settings** check karo:
   - Your Project select karo
   - **Project Code** copy karo (exact value)
   - **Project Secret** copy karo (exact value)

3. **Callback URL** verify karo:
   - Callback URL: `https://shubhvenue.com/api/microservice/payment-callback`
   - Ye URL microservice project settings mein configured hona chahiye

### Step 2: Update Admin Panel Configuration

1. **Admin Panel** → **Settings** → **Payment Configuration**

2. **Microservice Payment** select karo (agar nahi hai)

3. **Project Code (Key ID)** field:
   - Microservice admin panel se **exact** Project Code copy karo
   - Paste karo (extra spaces na aayein)
   - Verify karo ki format correct hai

4. **Project Secret (Key Secret)** field:
   - Microservice admin panel se **exact** Project Secret copy karo
   - Paste karo (extra spaces na aayein)
   - Verify karo ki length reasonable hai

5. **Update Payment Configuration** click karo

### Step 3: Verify Backend Configuration

**Backend `.env` file** check karo:
```env
MICROSERVICE_API_URL=https://payments.synilogic.in
```

### Step 4: Check Backend Logs

Backend server logs mein yeh dikhega:
```
🔍 Microservice Config Check:
   hasApiUrl: true
   apiUrl: https://payments.synilogic.in...
   hasProjectId: true
   projectIdPreview: PROJECT_ABC...
   hasProjectSecret: true
   projectSecretLength: 32
```

Agar `hasProjectId: false` ya `hasProjectSecret: false` hai, to configuration save nahi hui.

### Step 5: Common Issues to Check

#### Issue 1: Extra Spaces
- Project Code/Secret copy karte waqt **extra spaces** na aayein
- Beginning aur end mein spaces check karo
- Trim karke paste karo

#### Issue 2: Wrong Values
- Microservice admin panel se **exact** values use karo
- Test values ya dummy values use mat karo
- Production/Test environment match karo

#### Issue 3: Format Issues
- Project Code usually alphanumeric string hai
- Project Secret usually long string hai
- Special characters properly handle ho rahe hain ya nahi check karo

#### Issue 4: Configuration Not Saved
- Admin panel mein **Update** button click kiya?
- Success message aaya?
- Backend server **restart** kiya?

### Step 6: Test Again

1. Backend server **restart** karo:
   ```bash
   pm2 restart wedding-venue-backend
   ```

2. Backend logs check karo:
   ```bash
   pm2 logs wedding-venue-backend
   ```

3. Customer side se booking try karo

4. Logs mein check karo:
   - Project Code preview
   - Signature generation
   - Microservice response

## Debug Checklist

- [ ] Microservice admin panel se Project Code verify kiya
- [ ] Microservice admin panel se Project Secret verify kiya
- [ ] Admin panel mein exact values paste kiye (no extra spaces)
- [ ] Update Payment Configuration button click kiya
- [ ] Success message aaya
- [ ] Backend `.env` mein `MICROSERVICE_API_URL` set hai
- [ ] Backend server restart kiya
- [ ] Backend logs mein project code/secret dikh rahe hain
- [ ] Callback URL microservice mein configured hai

## Still Getting Error?

Agar abhi bhi "Invalid project" error aa raha hai:

1. **Backend logs share karo:**
   - `pm2 logs wedding-venue-backend` se recent logs
   - Microservice Config Check section

2. **Microservice admin panel verify karo:**
   - Project Code exact match kar raha hai?
   - Project Secret exact match kar raha hai?
   - Project active hai?

3. **Try fresh values:**
   - Microservice admin panel se **fresh** copy karo
   - Admin settings mein **clear karke** paste karo
   - Save karo aur restart karo

---

**Callback URL:** ✅ Correctly configured at `/api/microservice/payment-callback`

**Next Step:** Verify Project Code and Secret match microservice admin panel exactly.


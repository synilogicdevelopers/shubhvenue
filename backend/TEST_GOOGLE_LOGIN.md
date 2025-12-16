# 🧪 Google Login API Test Guide

## Quick Test (Without Token)

Endpoint availability check करने के लिए:

```bash
# Windows PowerShell
curl -X POST http://localhost:4000/api/auth/google-login -H "Content-Type: application/json" -d "{\"idToken\":\"test\",\"role\":\"customer\"}"

# Or use Postman/Insomnia
POST http://localhost:4000/api/auth/google-login
Headers: Content-Type: application/json
Body:
{
  "idToken": "test_token",
  "role": "customer"
}
```

Expected Response (400 or 401):
```json
{
  "error": "Google ID token is required"
}
```
या
```json
{
  "error": "Invalid Google token"
}
```

## Full Test (With Real Google Token)

### Step 1: Get Google ID Token

**Option A: Flutter App से:**
1. App में Google Sign-In button click करें
2. Console logs में `idToken` देखें
3. Token copy करें

**Option B: Test Script Use करें:**
```bash
cd WeddingVenue_backend
node test_google_login.js <GOOGLE_ID_TOKEN>
```

### Step 2: Test API

```bash
# Using curl
curl -X POST http://localhost:4000/api/auth/google-login \
  -H "Content-Type: application/json" \
  -d "{
    \"idToken\": \"YOUR_GOOGLE_ID_TOKEN\",
    \"role\": \"customer\",
    \"fcmToken\": \"optional_fcm_token\"
  }"
```

### Step 3: Expected Success Response

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

## Environment Check

`.env` file में ये होना चाहिए:
```
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

Check करें:
```bash
# Windows PowerShell
cd WeddingVenue_backend
Get-Content .env | Select-String "GOOGLE_CLIENT_ID"
```

## Common Errors

### Error 1: "Google ID token is required"
- **Cause:** `idToken` missing in request
- **Fix:** Request body में `idToken` add करें

### Error 2: "Invalid Google token"
- **Cause:** Invalid or expired Google ID token
- **Fix:** Fresh Google Sign-In करें और नया token लें

### Error 3: "Database connection unavailable"
- **Cause:** MongoDB not connected
- **Fix:** MongoDB connection check करें

### Error 4: "User with this Google account already exists"
- **Cause:** Duplicate Google ID
- **Fix:** Normal behavior, user already exists

## Test Scenarios

### Scenario 1: New User Registration
1. First time Google login
2. Should create new user automatically
3. Returns JWT token

### Scenario 2: Existing User Login
1. User already exists with Google ID
2. Should return existing user data
3. Updates FCM token if provided

### Scenario 3: Email Linking
1. User exists with email/password
2. Google login with same email
3. Should link Google account to existing user

## Manual Test Steps

1. **Backend Start करें:**
   ```bash
   cd WeddingVenue_backend
   npm run dev
   ```

2. **Health Check:**
   ```bash
   curl http://localhost:4000/api/health
   ```

3. **Google Login Test (Invalid Token):**
   ```bash
   curl -X POST http://localhost:4000/api/auth/google-login \
     -H "Content-Type: application/json" \
     -d "{\"idToken\":\"invalid_token\",\"role\":\"customer\"}"
   ```

4. **Google Login Test (Valid Token from App):**
   - Flutter app से Google Sign-In करें
   - Console में idToken copy करें
   - Test script run करें

## Using Test Script

```bash
# Without token (endpoint check)
node test_google_login.js

# With token (full test)
node test_google_login.js eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...
```





# Quick Fix: 503 Error - MongoDB Connection

## Problem
Getting 503 error on `/api/admin/login` because MongoDB is not connected.

## Solution

### Step 1: Update MongoDB Password in .env

Open `WeddingVenue_backend\.env` file and replace `<db_password>` with your actual MongoDB Atlas password:

```env
MONGODB_URI=mongodb+srv://synilogicteam_db_user:YOUR_ACTUAL_PASSWORD@restaurantmanagement.a6hn3sg.mongodb.net/?appName=RestaurantManagement
```

**Important:** Replace `YOUR_ACTUAL_PASSWORD` with your real MongoDB password (no angle brackets).

### Step 2: Restart Backend Server

```bash
cd WeddingVenue_backend
# Stop current server (Ctrl+C)
npm run dev
```

### Step 3: Verify Connection

Check backend console - you should see:
```
Connected to MongoDB
Database connection established.
```

### Step 4: Create Admin User

After MongoDB is connected, create admin user:

```bash
npm run create-admin
```

Default credentials:
- Email: `admin@admin.com`
- Password: `admin123`

### Step 5: Test Login

Go to admin panel: `http://localhost:3000`
Login with the credentials above.

---

## Alternative: Use Local MongoDB

If you have MongoDB installed locally:

1. Update `.env`:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/wedding_db
```

2. Make sure MongoDB service is running:
```bash
# Windows - Check if MongoDB is running
Get-Service MongoDB
```

3. Restart backend and create admin user.

---

## Still Having Issues?

1. Check MongoDB Atlas:
   - Password is correct
   - Network Access allows your IP (or 0.0.0.0/0 for all)
   - Database user has proper permissions

2. Check Backend Logs:
   - Look for MongoDB connection errors
   - Verify MONGODB_URI format is correct

3. Test Connection:
   ```bash
   node -e "require('dotenv').config(); console.log(process.env.MONGODB_URI)"
   ```








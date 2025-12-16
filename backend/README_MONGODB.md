# MongoDB Setup Instructions

## Issue: 500/503 Error - Database Connection Failed

### Problem
The backend is showing 500/503 errors because MongoDB is not connected.

### Solution

1. **Update `.env` file** in `WeddingVenue_backend` folder:
   ```
   MONGODB_URI=mongodb+srv://synilogicteam_db_user:YOUR_ACTUAL_PASSWORD@restaurantmanagement.a6hn3sg.mongodb.net/?appName=RestaurantManagement
   ```
   
   Replace `YOUR_ACTUAL_PASSWORD` with your actual MongoDB Atlas password.

2. **OR Use Local MongoDB** (if installed):
   ```
   MONGODB_URI=mongodb://127.0.0.1:27017/wedding_db
   ```
   Make sure MongoDB is running locally.

3. **Restart Backend Server**:
   ```bash
   cd WeddingVenue_backend
   npm run dev
   ```

4. **Create Admin User** (after MongoDB is connected):
   ```bash
   npm run create-admin
   ```
   
   Default credentials:
   - Email: `admin@admin.com`
   - Password: `admin123`

### Verify Connection

Check backend logs - you should see:
```
Connected to MongoDB
API server listening on port 4000
```

If you see connection errors, verify:
- MongoDB Atlas password is correct
- Network allows connection to MongoDB Atlas
- MongoDB Atlas IP whitelist includes your IP (or 0.0.0.0/0 for all)








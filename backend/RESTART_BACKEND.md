# Backend Restart Instructions

## Important: Backend Server Must Be Restarted

After updating MongoDB password in `.env`, you **MUST restart the backend server** for changes to take effect.

### Steps:

1. **Stop Current Backend Server**
   - If running in terminal, press `Ctrl+C`
   - Or close the terminal window

2. **Start Backend Again**
   ```bash
   cd WeddingVenue_backend
   npm run dev
   ```

3. **Verify Connection**
   Look for these messages in console:
   ```
   Connected to MongoDB
   Database connection established.
   API server listening on port 4000
   ```

4. **Create Admin User** (if not already created)
   ```bash
   npm run create-admin
   ```

5. **Test Login**
   - Go to: http://localhost:3000
   - Email: `admin@admin.com`
   - Password: `admin123`

---

## If Still Getting 503 Error:

1. **Check Backend Console** for MongoDB connection errors
2. **Verify .env file** - Make sure password has no spaces or special characters that need encoding
3. **Test Connection Manually**:
   ```bash
   node -e "require('dotenv').config(); console.log('URI:', process.env.MONGODB_URI?.substring(0, 50) + '...')"
   ```








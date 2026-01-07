# Banner & Banner Category API Test Guide

## Prerequisites

1. **Backend server must be running**
   ```bash
   cd backend
   npm start
   # or
   node server.js
   ```

2. **Admin user must exist**
   ```bash
   npm run create-admin
   ```
   Default credentials:
   - Email: `admin@admin.com`
   - Password: `admin123`

3. **MongoDB must be running and connected**

## Running the Tests

### Option 1: Using npm script
```bash
cd backend
npm run test-banners
```

### Option 2: Direct node command
```bash
cd backend
node test_banner_api.js
```

### Option 3: With custom base URL
```bash
cd backend
BASE_URL=http://localhost:4000/api node test_banner_api.js
```

## Test Coverage

The test file covers all banner category and banner APIs:

### Banner Category APIs
- ✅ Create Banner Category
- ✅ Get All Banner Categories
- ✅ Get Banner Category By ID
- ✅ Update Banner Category
- ✅ Toggle Banner Category Active Status
- ✅ Delete Banner Category

### Banner APIs (Admin)
- ✅ Create Banner (with category)
- ✅ Get All Banners
- ✅ Get Banners By Category
- ✅ Get Banners Without Category
- ✅ Get Banner By ID
- ✅ Update Banner
- ✅ Toggle Banner Active Status
- ✅ Delete Banner

### Public Banner APIs
- ✅ Get All Public Banners
- ✅ Get Public Banners By Category

## Expected Output

The test will:
1. Login as admin
2. Create a banner category
3. Test all category CRUD operations
4. Create a banner with the category
5. Test all banner CRUD operations
6. Test category filtering
7. Test public APIs
8. Clean up test data (delete created banner and category)

## API Endpoints Tested

### Banner Categories
- `POST /api/admin/banner-categories` - Create category
- `GET /api/admin/banner-categories` - Get all categories
- `GET /api/admin/banner-categories/:id` - Get category by ID
- `PUT /api/admin/banner-categories/:id` - Update category
- `PUT /api/admin/banner-categories/:id/toggle-active` - Toggle active
- `DELETE /api/admin/banner-categories/:id` - Delete category

### Banners (Admin)
- `POST /api/admin/banners` - Create banner
- `GET /api/admin/banners` - Get all banners
- `GET /api/admin/banners?categoryId=xxx` - Get banners by category
- `GET /api/admin/banners?categoryId=null` - Get banners without category
- `GET /api/admin/banners/:id` - Get banner by ID
- `PUT /api/admin/banners/:id` - Update banner
- `PUT /api/admin/banners/:id/toggle-active` - Toggle active
- `DELETE /api/admin/banners/:id` - Delete banner

### Banners (Public)
- `GET /api/banners` - Get all active banners
- `GET /api/banners?categoryId=xxx` - Get active banners by category

## Troubleshooting

### Connection Refused Error
- **Problem**: Backend server is not running
- **Solution**: Start the backend server with `npm start` or `node server.js`

### Admin Login Failed
- **Problem**: Admin user doesn't exist or wrong credentials
- **Solution**: Create admin user with `npm run create-admin`

### Database Connection Error
- **Problem**: MongoDB is not running or connection string is wrong
- **Solution**: Check MongoDB connection in `.env` file and ensure MongoDB is running

### Permission Denied
- **Problem**: Admin token doesn't have required permissions
- **Solution**: Check admin user permissions in database

## Notes

- The test creates and then deletes test data
- If you want to keep test data, comment out the cleanup section at the end of `test_banner_api.js`
- All tests require admin authentication except public banner endpoints
- Banner categories cannot be deleted if they have banners assigned to them


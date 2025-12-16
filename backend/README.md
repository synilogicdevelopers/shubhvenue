# Wedding Venue Backend (Node.js + Express + MongoDB)

Quick start:

1. Create a `.env` file in this folder with:

```
PORT=4000
MONGODB_URI=mongodb+srv://synilogicteam_db_user:<db_password>@restaurantmanagement.a6hn3sg.mongodb.net/?appName=RestaurantManagement
JWT_SECRET=supersecret
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
FIREBASE_SERVER_KEY=
```

2. Install and run:

```
npm install
npm run dev
```

Health check:
- GET `/api/health`

API base:
- `/api`

Structure:
- `src/app.js` Express app and middleware
- `src/config/db.js` MongoDB connection
- `src/routes/` API routers (v1 placeholders)
- `src/models/` Mongoose models
- `src/middlewares/` Common middlewares (auth, roles)

Next steps:
- Implement Auth (register/login/profile) with JWT + bcrypt
- Implement Venue CRUD, Booking, Payments (Razorpay), Affiliate, Admin
- Add AI gateway routes to Python microservices



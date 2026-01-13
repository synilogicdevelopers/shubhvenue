# Vendor Booking Testing Guide

## Fixed Issues

### 1. Manual Venue Name Bookings
- ✅ Fixed validation for manual venue names
- ✅ Proper handling of empty strings (converted to null)
- ✅ Added debug logging for troubleshooting

### 2. Error Handling
- ✅ Fixed MIME type errors (HTML vs JSON)
- ✅ Better error messages
- ✅ Proper response validation

### 3. Booking Retrieval
- ✅ Fixed populate errors
- ✅ Handle null venueId and customerId
- ✅ Better error handling for empty arrays

## How to Test

### Option 1: Using Browser (Recommended)
1. Login as vendor in the frontend
2. Go to Bookings page
3. Click "Add Booking"
4. Select "Enter venue name manually"
5. Fill in the form:
   - Venue Name: "Test Venue"
   - Check-in Date: Future date
   - Name: "Test Customer"
   - Phone: "9876543210"
   - Guests: 200
   - Event Type: Select any
   - Payment Status: Paid
   - Total Amount: 50000
6. Click "Add Booking"
7. Verify booking appears in the list

### Option 2: Using Test Script
```bash
# Get token from browser console:
# localStorage.getItem('vendor_token')

# Run test:
cd backend
node test_booking_simple.js <your_token>
```

### Option 3: Using curl
```bash
# Get bookings
curl -X GET http://localhost:8030/api/vendor/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Create booking with manual venue
curl -X POST http://localhost:8030/api/vendor/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "venueId": null,
    "venueName": "Test Manual Venue",
    "date": "2025-12-25",
    "dateFrom": "2025-12-25",
    "dateTo": "2025-12-25",
    "name": "Test Customer",
    "phone": "9876543210",
    "email": "test@example.com",
    "eventType": "wedding",
    "marriageFor": "boy",
    "guests": 200,
    "rooms": 5,
    "foodPreference": "both",
    "totalAmount": 50000,
    "paymentStatus": "paid"
  }'
```

## Expected Results

### Create Booking Response
```json
{
  "success": true,
  "message": "Booking created successfully",
  "booking": {
    "_id": "...",
    "venueId": null,
    "venueName": "Test Manual Venue",
    "name": "Test Customer",
    "phone": "9876543210",
    "status": "confirmed",
    "adminApproved": true,
    ...
  }
}
```

### Get Bookings Response
```json
{
  "success": true,
  "count": 1,
  "bookings": [
    {
      "id": "...",
      "venueName": "Test Manual Venue",
      "venue": null,
      "customer": null,
      "name": "Test Customer",
      ...
    }
  ]
}
```

## Troubleshooting

### If booking doesn't appear:
1. Check browser console for errors
2. Check server logs for errors
3. Verify token is valid
4. Check network tab in browser DevTools
5. Verify booking was actually created (check database)

### Common Issues:
- **MIME type error**: Server returning HTML instead of JSON - check server logs
- **Empty bookings list**: Check if vendor has venues or if bookings are admin-approved
- **Validation errors**: Check all required fields are filled

## Debug Logging

The backend now logs:
- Booking creation attempts with venueId/venueName
- Populate errors
- Query errors

Check server console for debug information.


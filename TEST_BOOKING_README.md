# Booking Test Scripts

ये scripts booking functionality को test करने के लिए हैं, खासकर vendor name का Booking ID के साथ display होना।

## Files

1. **test-booking.js** - Basic test script (no admin auth required)
2. **test-booking-admin.js** - Admin authentication के साथ full test
3. **test-booking-browser.js** - Browser console में run करने के लिए

## Setup

### Option 1: Install dependencies (if needed)

```bash
npm install axios dotenv
```

या package.json में add करें:
```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "dotenv": "^16.3.1"
  }
}
```

### Option 2: Use existing node_modules

अगर project में already `axios` और `dotenv` installed हैं, तो directly run कर सकते हैं।

## Usage

### 1. Basic Test (No Admin Auth)

```bash
node test-booking.js
```

यह script:
- एक venue fetch करेगा
- एक test booking create करेगा
- Booking ID show करेगा

### 2. Full Test with Admin Auth

पहले `.env` file में admin token add करें:
```
ADMIN_TOKEN=your_admin_token_here
API_URL=http://localhost:8030/api
```

फिर run करें:
```bash
node test-booking-admin.js
```

या directly:
```bash
ADMIN_TOKEN=your_token node test-booking-admin.js
```

यह script:
- Venue fetch करेगा
- Test booking create करेगा
- Admin API से bookings fetch करेगा
- Vendor information verify करेगा
- First 3 words of vendor name show करेगा

### 3. Browser Console Test

1. Admin panel में login करें (`/admin/bookings` page पर)
2. Browser console खोलें (F12)
3. `test-booking-browser.js` file का content copy करें
4. Console में paste करें और Enter दबाएं

यह automatically:
- Current admin token use करेगा
- Test booking create करेगा
- Vendor information verify करेगा
- Results console में show करेगा

## Expected Results

Test successful होने पर आपको दिखना चाहिए:

1. ✅ Booking successfully created
2. ✅ Vendor name populated in booking data
3. ✅ First 3 words of vendor name extract हो रहे हैं
4. ✅ Admin bookings table में Booking ID के नीचे vendor name दिख रहा है

## Troubleshooting

### Error: "No approved venues found"
- कम से कम एक venue create करें और approve करें

### Error: "ADMIN_TOKEN not set"
- Admin panel में login करें
- Browser DevTools → Application → Local Storage → `admin_token` copy करें
- `.env` file में add करें या environment variable set करें

### Error: "Cannot connect to server"
- Backend server running है या नहीं check करें
- `API_URL` correct है या नहीं verify करें

### Vendor name नहीं दिख रहा
- Backend server restart करें (vendor populate changes के लिए)
- Browser में page refresh करें
- Network tab में API response check करें कि `venueId.vendorId.name` populated है या नहीं

## Manual Testing

1. Admin panel में `/admin/bookings` page पर जाएं
2. एक booking create करें (या existing booking देखें)
3. Booking ID column में check करें:
   - Booking ID (last 8 characters)
   - उसके नीचे vendor name के पहले 3 words

## Notes

- Test bookings को delete करना न भूलें (optional)
- Production में test scripts run न करें
- Backend server `http://localhost:8030` पर running होना चाहिए


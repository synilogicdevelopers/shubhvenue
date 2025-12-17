# Vendor Delete/Reject Test Script

यह test script vendor delete और reject functionality को test करता है।

## Setup

1. `.env` file में admin credentials add करें:
```env
ADMIN_EMAIL=your_admin_email@example.com
ADMIN_PASSWORD=your_admin_password
API_URL=http://localhost:4000/api
```

या environment variables set करें:
```bash
export ADMIN_EMAIL=your_admin_email@example.com
export ADMIN_PASSWORD=your_admin_password
export API_URL=http://localhost:4000/api
```

## Test Script Run करें

```bash
cd backend
npm run test-vendor
```

या directly:
```bash
node test_vendor_delete_reject.js
```

## Tests क्या करते हैं

1. **Admin Login** - Admin credentials से login
2. **Create Test Vendor** - Test vendor account बनाता है
3. **Create Test Venue** - (Optional) Venue create करने की कोशिश
4. **Vendor Login (Before)** - Vendor reject/delete से पहले login test
5. **Reject Vendor** - Vendor को reject करता है
6. **Vendor Login After Reject** - Reject के बाद login block होना चाहिए
7. **Check Venues After Reject** - सभी venues rejected होनी चाहिए
8. **Approve Vendor Again** - Delete test के लिए vendor को approve करता है
9. **Delete Vendor** - Vendor को delete करता है
10. **Vendor Login After Delete** - Delete के बाद login block होना चाहिए
11. **Check Venues After Delete** - सभी venues rejected होनी चाहिए
12. **Get Vendor Profile** - Profile access block होना चाहिए

## Expected Results

✅ **Success Cases:**
- Vendor reject/delete के बाद login नहीं कर सकता
- Vendor की सभी venues automatically rejected हो जाती हैं
- Proper error messages show होते हैं

❌ **Failure Cases:**
- अगर vendor reject/delete के बाद भी login कर पाता है तो BUG है
- अगर venues rejected नहीं होतीं तो BUG है

## Notes

- Test script automatically एक test vendor बनाता है
- Test vendor का email unique होता है (timestamp based)
- Test के बाद vendor database में रहता है (manual cleanup करना होगा अगर चाहिए)
- Server running होना चाहिए (`npm run dev` या `npm start`)

## Troubleshooting

1. **Admin login fails:**
   - Check `.env` file में `ADMIN_EMAIL` और `ADMIN_PASSWORD` सही हैं
   - Admin account database में exist करता है

2. **API connection fails:**
   - Server running है या नहीं check करें
   - `API_URL` सही है या नहीं check करें

3. **Vendor creation fails:**
   - Database connection check करें
   - Email unique होना चाहिए


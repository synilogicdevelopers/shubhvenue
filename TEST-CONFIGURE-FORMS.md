# Configure Forms API Test Guide

यह guide Configure Forms functionality को test करने के लिए है।

## Test Scripts

### 1. Node.js Test Script (Backend Testing)

**File:** `test-configure-forms.js`

**Usage:**
```bash
# Install dependencies if needed
npm install axios

# Update credentials in the script
# Edit ADMIN_EMAIL and ADMIN_PASSWORD

# Run the test
node test-configure-forms.js
```

**What it tests:**
- ✅ Admin login
- ✅ Create vendor category
- ✅ Update category with formConfig
- ✅ Get category and verify formConfig
- ✅ Partial formConfig update
- ✅ Cleanup (delete test category)

### 2. Browser Console Test Script (Frontend Testing)

**File:** `test-configure-forms-browser.js`

**Usage:**
1. Admin panel में login करें
2. Vendor Categories page खोलें
3. Browser console खोलें (F12)
4. Script को copy-paste करें और Enter दबाएं

**What it tests:**
- ✅ Get all categories
- ✅ Update category with formConfig
- ✅ Verify formConfig was saved
- ✅ Get category again (verify persistence)
- ✅ Test partial formConfig update

## Manual Testing Steps

### Step 1: Create/Select Category
1. Admin panel में जाएं
2. Vendor Categories section खोलें
3. एक category create करें या existing category select करें

### Step 2: Configure Forms
1. Category के सामने "Configure Forms" button (Settings icon) पर click करें
2. Form editor modal खुलेगा
3. Venue और Booking fields को configure करें:
   - Checkboxes को enable/disable करें
   - Options add करें
   - Settings adjust करें

### Step 3: Save Configuration
1. "Save Configuration" button पर click करें
2. Success message देखना चाहिए
3. Modal close हो जाना चाहिए

### Step 4: Verify Configuration
1. Same category के लिए फिर से "Configure Forms" खोलें
2. आपकी settings save हुई हैं या नहीं check करें
3. Changes persist होने चाहिए

### Step 5: Test in Venue Form
1. Vendor panel में login करें
2. Venues section में जाएं
3. Add Venue या Edit Venue करें
4. Configure किए गए fields visible होने चाहिए
5. Disabled fields visible नहीं होने चाहिए

## API Endpoints

### Update Vendor Category with FormConfig
```
PUT /api/admin/vendor-categories/:id
Headers:
  Authorization: Bearer <admin_token>
  Content-Type: multipart/form-data

Body (FormData):
  formConfig: JSON.stringify(formConfigObject)
```

### Get Vendor Category
```
GET /api/admin/vendor-categories/:id
Headers:
  Authorization: Bearer <admin_token>
```

## Expected FormConfig Structure

```javascript
{
  venue: {
    name: true/false,
    location: {
      enabled: true/false,
      city: true/false,
      state: true/false,
      address: true/false
    },
    priceType: {
      enabled: true/false,
      types: ['per_day', 'per_km', ...]
    },
    type: {
      enabled: true/false,
      allowCustom: true/false,
      options: ['Option1', 'Option2', ...]
    },
    numberOfGuests: true/false,
    numberOfRooms: true/false,
    food: {
      enabled: true/false,
      options: ['veg', 'non_veg', 'both'],
      allowIndividualItems: true/false
    },
    amenities: true/false,
    highlights: true/false,
    timing: {
      enabled: true/false,
      openTime: true/false,
      closeTime: true/false
    },
    openDays: {
      enabled: true/false,
      allowAllDays: true/false,
      days: ['monday', 'tuesday', ...]
    },
    gender: true/false,
    category: true/false,
    menu: true/false,
    submenu: true/false,
    videos: true/false,
    galleryImages: true/false
  },
  booking: {
    date: true/false,
    numberOfGuests: true/false,
    numberOfRooms: true/false,
    type: {
      enabled: true/false,
      source: 'venue' | 'custom'
    },
    foodPrice: {
      enabled: true/false,
      autoCalculate: true/false
    },
    gender: true/false,
    pickupDrop: {
      enabled: true/false,
      pickup: true/false,
      drop: true/false
    },
    dateSelection: {
      enabled: true/false,
      allowMultipleDates: true/false
    }
  }
}
```

## Troubleshooting

### Issue: FormConfig not saving
- Check browser console for errors
- Check Network tab for API response
- Verify admin token is valid
- Check backend logs for errors

### Issue: FormConfig not loading in form editor
- Check if formConfig is in database
- Verify API response includes formConfig
- Check browser console for errors

### Issue: Fields not showing/hiding in venue form
- Verify vendor's category has formConfig
- Check if formConfig structure is correct
- Verify venue form is reading formConfig correctly

## Database Verification

MongoDB में check करें:
```javascript
// MongoDB shell में
use your_database_name
db.vendorcategories.findOne({ name: "Your Category Name" })
// formConfig field check करें
```

## Notes

- FormConfig को JSON string के रूप में FormData में send किया जाता है
- Backend में FormData parse होता है और JSON.parse() से convert होता है
- Empty या null formConfig को handle किया जाता है
- Partial updates supported हैं (merge with existing config)


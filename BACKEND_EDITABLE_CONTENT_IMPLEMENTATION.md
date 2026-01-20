# Backend Editable Content Implementation

## ✅ COMPLETED

### Backend Implementation

1. **Model Created**: `backend/src/models/HomepageContent.js`
   - Stores SEO content and City SEO content
   - Types: `seo-content`, `city-seo`
   - Fields: title, content, cities (array), isActive, lastUpdated

2. **Controller Created**: `backend/src/controllers/homepageContent.controller.js`
   - `getPublicHomepageContent` - Public API (no auth)
   - `getAllHomepageContent` - Admin API
   - `getHomepageContentByType` - Admin API
   - `updateHomepageContent` - Admin API

3. **Routes Added**:
   - Public: `/api/homepage-content/:type` (GET)
   - Admin: `/api/admin/homepage-content` (GET)
   - Admin: `/api/admin/homepage-content/:type` (GET, PUT)

4. **Frontend Updated**:
   - API service: `publicHomepageContentAPI.getByType(type)`
   - Component: `SEOContentSection.jsx` now fetches from API
   - Fallback to default content if API fails

### API Endpoints

**Public Endpoints (No Auth Required):**
- `GET /api/homepage-content/seo-content` - Get SEO content
- `GET /api/homepage-content/city-seo` - Get city SEO content

**Admin Endpoints (Auth Required):**
- `GET /api/admin/homepage-content` - Get all homepage content
- `GET /api/admin/homepage-content/:type` - Get content by type
- `PUT /api/admin/homepage-content/:type` - Update content by type

### Request/Response Format

**Update Request (PUT `/api/admin/homepage-content/seo-content`):**
```json
{
  "title": "About Shubh Venue",
  "content": "Content text here...",
  "cities": [] // Only for city-seo type
}
```

**Update Request (PUT `/api/admin/homepage-content/city-seo`):**
```json
{
  "title": "Popular Wedding Venue Destinations",
  "content": "",
  "cities": [
    {
      "name": "Kota",
      "description": "Discover the best wedding venues in Kota..."
    },
    {
      "name": "Jaipur",
      "description": "Discover the best wedding venues in Jaipur..."
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Homepage content updated successfully",
  "content": {
    "_id": "...",
    "type": "seo-content",
    "title": "About Shubh Venue",
    "content": "...",
    "cities": [],
    "isActive": true,
    "lastUpdated": "2024-01-01T00:00:00.000Z"
  }
}
```

## ⚠️ PENDING

### Admin Interface for Editing Content

**Required:** Admin panel interface to edit homepage SEO content

**Location:** Should be added to `src/pages/admin/settings/index.jsx` or create new page `src/pages/admin/homepage-content/index.jsx`

**Features Needed:**
1. Form to edit SEO content (title + content textarea)
2. Form to edit City SEO (title + cities array with name/description)
3. Rich text editor or markdown editor for content
4. Save button that calls `PUT /api/admin/homepage-content/:type`
5. Preview functionality

**Permissions Required:**
- `view_legal_pages` - to view content
- `edit_legal_pages` - to edit content

## 📝 Notes

1. **Content Format**: Content supports markdown-like syntax:
   - `## Heading` converts to `<h3>`
   - `### Subheading` converts to `<h4>`
   - `[text](url)` converts to `<a href="url">text</a>`
   - Line breaks preserved

2. **Default Content**: If no content exists in database, default content is automatically created on first API call.

3. **Fallback**: Frontend has fallback content if API fails, ensuring page never breaks.

4. **SEO Friendly**: Content is always visible (not hidden), properly structured with H2/H3 headings.

---

**Status:** ✅ Backend Ready | ⚠️ Admin UI Pending








# Admin Panel - Homepage Content Editing Guide

## ✅ Implementation Complete

Homepage SEO content ab admin panel se editable hai!

## 📍 Location

**Admin Panel → Settings → Homepage SEO Content**

URL: `/admin/settings` (scroll down to "Homepage SEO Content" section)

## 🎯 Features

### 1. SEO Content Editing
- **Type:** `seo-content`
- **Fields:**
  - Title (e.g., "About Shubh Venue")
  - Content (supports markdown formatting)

### 2. City SEO Block Editing
- **Type:** `city-seo`
- **Fields:**
  - Title (e.g., "Popular Wedding Venue Destinations")
  - Cities Array (name + description for each city)

## 📝 How to Use

### Editing SEO Content

1. Go to **Admin Panel → Settings**
2. Scroll to **"Homepage SEO Content"** section
3. Select **"SEO Content (About Shubh Venue)"** from dropdown
4. Edit Title and Content
5. Click **"Update Homepage Content"**

**Content Formatting:**
- Use `## Heading` for H3 headings
- Use `### Subheading` for H4 headings
- Use `[text](url)` for links
- Line breaks are preserved

**Example:**
```
## Venue Types We Offer

Our platform features a diverse range of venue types...

## City Coverage

Shubh Venue proudly serves customers across multiple cities...

[Kota](/venues?city=Kota) | [Jaipur](/venues?city=Jaipur)
```

### Editing City SEO Block

1. Select **"City SEO Block"** from dropdown
2. Edit Title
3. **Add Cities:**
   - Enter City Name (e.g., "Kota")
   - Enter City Description (2-3 lines)
   - Click **"Add City"**
4. **Remove Cities:** Click trash icon next to city
5. Click **"Update Homepage Content"**

**City Format:**
- Each city needs:
  - **Name:** City name (e.g., "Kota", "Jaipur")
  - **Description:** 2-3 line description about venues in that city

**Example City:**
```
Name: Kota
Description: Discover the best wedding venues in Kota with Shubh Venue. 
From luxurious banquet halls to beautiful marriage gardens, find your perfect venue 
for your special day in Kota.
```

## 🔐 Permissions Required

- `view_legal_pages` - to view content
- `edit_legal_pages` - to edit content

## 📡 API Endpoints Used

- `GET /api/admin/homepage-content/:type` - Fetch content
- `PUT /api/admin/homepage-content/:type` - Update content

## ⚠️ Important Notes

1. **Content is Live:** Changes are immediately visible on homepage
2. **SEO Friendly:** Content is always visible (not hidden)
3. **Fallback:** If API fails, default content is shown
4. **Markdown Support:** Limited markdown formatting supported
5. **City Links:** City names automatically link to venue search pages

## 🎨 UI Features

- ✅ Dropdown to switch between content types
- ✅ Loading states
- ✅ Form validation
- ✅ Success/error toasts
- ✅ Add/remove cities (for city-seo)
- ✅ Large textarea for content editing
- ✅ Responsive design

## 📋 Current Content Structure

**SEO Content:**
- About Shubh Venue
- Venue Types We Offer
- City Coverage
- Why Choose Shubh Venue

**City SEO:**
- Popular Wedding Venue Destinations
- List of cities with descriptions

---

**Status:** ✅ Ready to Use
**Last Updated:** Content is editable from admin panel








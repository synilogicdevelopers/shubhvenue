# Caching Strategy - कौन सा Data Cache करना चाहिए

## Overview
यह document explain करता है कि Redis caching में कौन सा data cache करना चाहिए और क्यों।

---

## 1. **PUBLIC STATIC DATA (High Priority)** ⭐⭐⭐
ये data बहुत frequently accessed होता है और rarely change होता है।

### A. Categories (Categories List)
**API**: `GET /api/categories`
**Why Cache?**
- Homepage पर हर user को categories चाहिए
- Categories कभी-कभार ही change होते हैं
- हर request पर database query expensive है

**Cache Key**: `categories:active` या `categories:all`
**TTL**: 1 hour (3600 seconds)
**Data Structure**:
```javascript
{
  "_id": "category_id",
  "name": "Banquet Halls",
  "slug": "banquet-halls",
  "icon": "/uploads/categories/icon.jpg",
  "isActive": true,
  "venueCount": 45
}
```

### B. Banners (Homepage Banners)
**API**: `GET /api/banners`
**Why Cache?**
- Homepage load होते ही banners fetch होते हैं
- Multiple users same banners देखते हैं
- Date-based filtering complex है, cache से fast

**Cache Key**: `banners:active:${currentDate}`
**TTL**: 1 hour या until banner expires
**Data Structure**:
```javascript
{
  "_id": "banner_id",
  "title": "Summer Wedding Special",
  "image": "/uploads/banners/banner1.jpg",
  "link": "/venues",
  "sortOrder": 1
}
```

### C. FAQs (Frequently Asked Questions)
**API**: `GET /api/faqs`
**Why Cache?**
- Help/Support page पर frequently accessed
- Rarely change होते हैं
- Same content सभी users को दिखता है

**Cache Key**: `faqs:active`
**TTL**: 24 hours (86400 seconds)
**Data Structure**:
```javascript
{
  "_id": "faq_id",
  "question": "What is cancellation policy?",
  "answer": "Cancellation allowed 7 days before...",
  "category": "Booking"
}
```

### D. Testimonials
**API**: `GET /api/testimonials`
**Why Cache?**
- Homepage पर display होते हैं
- Multiple users same testimonials देखते हैं
- Rarely updated

**Cache Key**: `testimonials:active`
**TTL**: 6 hours (21600 seconds)
**Data Structure**:
```javascript
{
  "_id": "testimonial_id",
  "name": "John Doe",
  "rating": 5,
  "comment": "Great venue!",
  "image": "/uploads/testimonials/photo.jpg"
}
```

### E. Company Information
**API**: `GET /api/company`
**Why Cache?**
- Footer में हर page पर display होता है
- Very rarely change होता है
- Same data सभी users को चाहिए

**Cache Key**: `company:info`
**TTL**: 24 hours (86400 seconds)
**Data Structure**:
```javascript
{
  "companyName": "ShubhVenue",
  "description": "Your trusted partner...",
  "address": "123 Street, City",
  "phone": "+91 1234567890",
  "email": "info@shubhvenue.com",
  "facebook": "https://facebook.com/...",
  "instagram": "https://instagram.com/..."
}
```

### F. Videos
**API**: `GET /api/videos`
**Why Cache?**
- Homepage पर videos display होते हैं
- Date-based filtering complex
- Rarely updated

**Cache Key**: `videos:active:${currentDate}`
**TTL**: 1 hour
**Data Structure**: Video list with metadata

### G. Legal Pages (Privacy Policy, Terms, etc.)
**API**: `GET /api/legal-pages/:type`
**Why Cache?**
- Footer links से frequently accessed
- Very rarely change होते हैं
- Same content सभी users को

**Cache Key**: `legal:${type}` (e.g., `legal:privacy`, `legal:terms`)
**TTL**: 24 hours
**Data Structure**: Full page content

---

## 2. **VENUE-RELATED DATA (Medium Priority)** ⭐⭐

### A. Featured Venues
**API**: `GET /api/venues?isFeatured=true&limit=10`
**Why Cache?**
- Homepage पर featured venues display होते हैं
- Multiple users same venues देखते हैं
- Venues update होने पर cache invalidate करना है

**Cache Key**: `venues:featured:${page}:${limit}`
**TTL**: 30 minutes (1800 seconds)
**Note**: जब venue update हो तो cache invalidate करें

### B. Popular Venues (by rating/views)
**API**: `GET /api/venues?sort=rating&limit=10`
**Why Cache?**
- Homepage recommendations के लिए
- Expensive query (sorting + aggregation)

**Cache Key**: `venues:popular:${sortType}:${limit}`
**TTL**: 1 hour

### C. Venue Count by Category
**Why Cache?**
- Categories page पर venue count दिखाना
- Expensive aggregation query

**Cache Key**: `venues:count:category:${categoryId}`
**TTL**: 1 hour

---

## 3. **USER SESSION DATA (High Priority)** ⭐⭐⭐

### A. User Profile Cache
**API**: `GET /api/auth/profile`
**Why Cache?**
- हर authenticated request में user profile check होता है
- Token verification के साथ profile data भी cache करें

**Cache Key**: `user:profile:${userId}` या `session:${token}`
**TTL**: 1 hour या token expiry जो भी पहले हो
**Data Structure**:
```javascript
{
  "userId": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "customer",
  "phone": "1234567890"
}
```

### B. Vendor Dashboard Data
**API**: `GET /api/vendor/dashboard`
**Why Cache?**
- Dashboard frequently accessed
- Complex aggregations (bookings, revenue, etc.)

**Cache Key**: `vendor:dashboard:${vendorId}:${month}:${year}`
**TTL**: 5-10 minutes (dashboard data frequently update होता है)

---

## 4. **LOCATION DATA (Medium Priority)** ⭐⭐

### A. States List
**API**: `GET /api/vendor/venues/states`
**Why Cache?**
- Form dropdown में use होता है
- Rarely change होता है

**Cache Key**: `locations:states`
**TTL**: 24 hours

### B. Cities by State
**API**: `GET /api/vendor/venues/cities?state=Rajasthan`
**Why Cache?**
- Form dropdown में use होता है
- Large dataset

**Cache Key**: `locations:cities:${state}`
**TTL**: 24 hours

---

## 5. **MENU DATA (Low-Medium Priority)** ⭐

### A. Menu List by Venue
**API**: `GET /api/menus?venueId=${venueId}`
**Why Cache?**
- Venue detail page पर display होता है
- Rarely change होता है

**Cache Key**: `menus:venue:${venueId}`
**TTL**: 1 hour
**Note**: Menu update होने पर cache invalidate करें

---

## 6. **REVIEWS & RATINGS (Medium Priority)** ⭐⭐

### A. Venue Reviews
**API**: `GET /api/reviews/venue/${venueId}`
**Why Cache?**
- Venue detail page पर display होते हैं
- Aggregation queries expensive हैं

**Cache Key**: `reviews:venue:${venueId}:${page}:${limit}`
**TTL**: 30 minutes
**Note**: New review add होने पर cache invalidate करें

### B. Venue Average Rating
**Why Cache?**
- हर venue listing में rating display होता है
- Expensive aggregation

**Cache Key**: `rating:venue:${venueId}`
**TTL**: 1 hour

---

## 7. **DATA जो CACHE नहीं करना चाहिए** ❌

### A. Real-time Data
- Live bookings
- Payment status
- Current availability
- Recent transactions

### B. User-Specific Dynamic Data
- User's own bookings (personalized)
- User's cart (session-based, use in-memory)
- Search results (too many variations)
- Filtered venue listings (too many combinations)

### C. Frequently Changing Data
- Booking status updates
- Payment confirmations
- Real-time notifications

---

## Cache Invalidation Strategy

### When to Invalidate Cache:

1. **Categories Updated**
   - Invalidate: `categories:*`

2. **Venue Created/Updated/Deleted**
   - Invalidate: `venues:featured:*`
   - Invalidate: `venues:popular:*`
   - Invalidate: `venues:count:category:*`
   - Invalidate: `menus:venue:${venueId}`

3. **Banner Added/Updated/Deleted**
   - Invalidate: `banners:active:*`

4. **Review Added/Updated**
   - Invalidate: `reviews:venue:${venueId}:*`
   - Invalidate: `rating:venue:${venueId}`

5. **Menu Updated**
   - Invalidate: `menus:venue:${venueId}`

6. **User Profile Updated**
   - Invalidate: `user:profile:${userId}`

---

## Implementation Priority

### Phase 1: Immediate (Biggest Impact)
1. ✅ Categories
2. ✅ Banners
3. ✅ Company Info
4. ✅ FAQs
5. ✅ Testimonials

### Phase 2: Short-term
6. Featured Venues
7. User Profile Cache
8. Location Data (States/Cities)

### Phase 3: Long-term
9. Venue Reviews
10. Menu Data
11. Vendor Dashboard

---

## Cache Size Estimation

### Approximate Cache Size:

- **Categories**: ~50KB (100 categories)
- **Banners**: ~100KB (10 banners with images)
- **FAQs**: ~200KB (50 FAQs)
- **Testimonials**: ~150KB (20 testimonials)
- **Company Info**: ~5KB
- **Videos**: ~50KB (10 videos metadata)
- **Featured Venues (10)**: ~500KB
- **States/Cities**: ~200KB
- **Total Estimated**: ~1.2MB for all public data

**Redis Memory**: 100MB-500MB recommended for production

---

## Example Redis Keys Structure

```
categories:active                    -> Array of categories
banners:active:2024-01-15           -> Array of active banners
faqs:active                         -> Array of FAQs
testimonials:active                 -> Array of testimonials
company:info                        -> Company object
videos:active:2024-01-15            -> Array of videos
legal:privacy                       -> Legal page content
legal:terms                         -> Legal page content
venues:featured:1:10                -> Featured venues (page 1, limit 10)
venues:popular:rating:10            -> Popular venues sorted by rating
user:profile:user123                -> User profile
vendor:dashboard:vendor456:1:2024   -> Vendor dashboard data
locations:states                    -> States list
locations:cities:Rajasthan          -> Cities in Rajasthan
menus:venue:venue789                -> Menus for venue
reviews:venue:venue789:1:10         -> Reviews for venue (page 1)
rating:venue:venue789               -> Average rating for venue
```

---

## Performance Impact

### Without Caching:
- Categories API: ~100-200ms (database query)
- Banners API: ~150-250ms (database query + date filtering)
- FAQs API: ~80-150ms (database query)

### With Caching:
- Categories API: ~1-5ms (Redis lookup)
- Banners API: ~1-5ms (Redis lookup)
- FAQs API: ~1-5ms (Redis lookup)

**Improvement**: 20-100x faster response times! 🚀

---

## Next Steps

1. Install Redis: `npm install redis ioredis`
2. Create cache utility file: `backend/src/utils/cache.js`
3. Implement cache middleware for routes
4. Add cache invalidation on data updates
5. Monitor cache hit/miss rates


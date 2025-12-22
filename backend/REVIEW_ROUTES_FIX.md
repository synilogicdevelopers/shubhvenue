# Review Routes Fix - Admin Panel

## Issue Fixed
Review routes admin panel me properly add nahi the ya route order me issue tha.

## Solution
Route order fix kiya - specific routes (`/reviews/:id/reply`) ko dynamic routes (`/reviews/:id`) se pehle rakha.

## Available Review Routes in Admin Panel

### Review Management
- `GET /api/admin/reviews` - Saare reviews (Permission: `view_reviews`)
- `GET /api/admin/reviews/:id` - Single review (Permission: `view_reviews`)
- `PUT /api/admin/reviews/:id` - Review update (Permission: `edit_reviews`)
- `DELETE /api/admin/reviews/:id` - Review delete (Permission: `delete_reviews`)

### Review Reply Management
- `POST /api/admin/reviews/:id/reply` - Reply create (Permission: `create_review_replies`)
- `PUT /api/admin/reviews/:id/reply` - Reply update (Permission: `edit_review_replies`)
- `DELETE /api/admin/reviews/:id/reply` - Reply delete (Permission: `delete_review_replies`)

## Route Order (Important!)
Express routes ko top-to-bottom match karta hai, isliye specific routes pehle aane chahiye:

```javascript
// ✅ Correct Order:
router.get('/reviews', ...);                    // List all
router.post('/reviews/:id/reply', ...);        // Specific route first
router.put('/reviews/:id/reply', ...);         // Specific route first
router.delete('/reviews/:id/reply', ...);     // Specific route first
router.get('/reviews/:id', ...);               // Dynamic route after
router.put('/reviews/:id', ...);               // Dynamic route after
router.delete('/reviews/:id', ...);           // Dynamic route after

// ❌ Wrong Order (would cause conflicts):
router.get('/reviews/:id', ...);               // This would match /reviews/reply too!
router.post('/reviews/:id/reply', ...);       // Never reached
```

## Testing
✅ Test successful - Reviews endpoint working:
```bash
GET /api/admin/reviews
Response: { success: true, count: 32, reviews: [...] }
```

## Permissions Required
- `view_reviews` - To view reviews
- `edit_reviews` - To edit reviews
- `delete_reviews` - To delete reviews
- `create_review_replies` - To create replies
- `edit_review_replies` - To edit replies
- `delete_review_replies` - To delete replies

## Notes
- Admin automatically has all permissions
- Staff needs these permissions in their role to access review routes
- Route order is critical for Express routing to work correctly


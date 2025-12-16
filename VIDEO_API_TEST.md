# Video APIs Test Documentation

## Public Video APIs (No Authentication Required)

### 1. Get All Active Videos
**Endpoint:** `GET /api/videos`

**Description:** Fetches all active videos that are currently available (based on start/end dates)

**Response:**
```json
{
  "success": true,
  "count": 2,
  "videos": [
    {
      "_id": "video_id",
      "title": "Video Title",
      "description": "Video Description",
      "video": "/uploads/videos/filename.mp4",
      "thumbnail": "https://example.com/thumb.jpg",
      "link": "https://example.com",
      "sortOrder": 0
    }
  ]
}
```

**Test Command:**
```bash
curl http://localhost:4000/api/videos
```

**Frontend Usage:**
```javascript
import { publicVideosAPI } from './services/api';

const response = await publicVideosAPI.getAll();
console.log(response.data.videos);
```

---

### 2. Get Single Video by ID
**Endpoint:** `GET /api/videos/:id`

**Description:** Fetches a single active video by its ID

**Response:**
```json
{
  "success": true,
  "video": {
    "_id": "video_id",
    "title": "Video Title",
    "description": "Video Description",
    "video": "/uploads/videos/filename.mp4",
    "thumbnail": "https://example.com/thumb.jpg",
    "link": "https://example.com",
    "sortOrder": 0
  }
}
```

**Test Command:**
```bash
curl http://localhost:4000/api/videos/VIDEO_ID_HERE
```

**Frontend Usage:**
```javascript
import { publicVideosAPI } from './services/api';

const response = await publicVideosAPI.getById('video_id');
console.log(response.data.video);
```

---

## Admin Video APIs (Authentication Required)

### 1. Get All Videos (Admin)
**Endpoint:** `GET /api/admin/videos`

**Headers:** `Authorization: Bearer <admin_token>`

### 2. Create Video (Admin)
**Endpoint:** `POST /api/admin/videos`

**Headers:** 
- `Authorization: Bearer <admin_token>`
- `Content-Type: multipart/form-data`

**Body (FormData):**
- `title` (required)
- `description` (optional)
- `video` (file or URL - required)
- `thumbnail` (optional)
- `link` (optional)
- `isActive` (boolean, default: true)
- `sortOrder` (number, default: 0)
- `startDate` (optional, ISO date)
- `endDate` (optional, ISO date)

### 3. Update Video (Admin)
**Endpoint:** `PUT /api/admin/videos/:id`

### 4. Delete Video (Admin)
**Endpoint:** `DELETE /api/admin/videos/:id`

### 5. Toggle Video Active Status (Admin)
**Endpoint:** `PUT /api/admin/videos/:id/toggle-active`

---

## Features

✅ **Public APIs:**
- No authentication required
- Only returns active videos
- Respects start/end dates
- Sorted by sortOrder

✅ **Security:**
- Public APIs only return active videos
- Inactive videos are hidden from public
- Date-based filtering (startDate/endDate)

✅ **Video URL Format:**
- Local uploads: `/uploads/videos/filename.mp4`
- External URLs: Full HTTP/HTTPS URLs

---

## Testing Checklist

- [ ] Test GET /api/videos (should return active videos only)
- [ ] Test GET /api/videos/:id (should return single active video)
- [ ] Test with inactive video (should not appear in public API)
- [ ] Test with startDate/endDate filtering
- [ ] Test video file upload via admin API
- [ ] Test video URL upload via admin API
- [ ] Verify video playback in frontend

---

## Frontend Integration

### WeddingVenue_web (Vendor App)
```javascript
import { publicVideosAPI } from '../services/api';

// Get all videos
const fetchVideos = async () => {
  try {
    const response = await publicVideosAPI.getAll();
    const videos = response.data.videos || [];
    console.log('Videos:', videos);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Admin Panel
```javascript
import { videosAPI } from '../services/api';

// Get all videos (admin)
const fetchAllVideos = async () => {
  try {
    const response = await videosAPI.getAll();
    const videos = response.data.videos || [];
    console.log('All Videos:', videos);
  } catch (error) {
    console.error('Error:', error);
  }
};
```


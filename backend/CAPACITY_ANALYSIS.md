# Backend Capacity Analysis

## Current Configuration

### Server Setup
- **PM2 Instances**: 1 (Single instance)
- **Memory Limit**: 1GB
- **Exec Mode**: Fork (not cluster)
- **Port**: 8030

### Rate Limiting
- **Limit**: 10,000 requests per minute per IP
- **Window**: 60 seconds

### Database Connection Pool
- **Max Pool Size**: 10 connections
- **Min Pool Size**: 2 connections
- **Server Selection Timeout**: 3 seconds
- **Socket Timeout**: 8 seconds

## Estimated Capacity

### Current Setup (1 Instance)
- **Concurrent Users**: ~50-100 users (moderate activity)
- **Peak Concurrent**: ~150-200 users (high activity)
- **Daily Active Users**: ~500-1000 users
- **Requests per Second**: ~50-100 RPS

## Bottlenecks

1. **Single Instance**: Only 1 Node.js process running
2. **MongoDB Pool**: 10 connections may be limiting under high load
3. **Memory**: 1GB limit may be restrictive for heavy operations

## Recommendations for Scaling

### Option 1: Enable Cluster Mode (Recommended)
Update `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'wedding-venue-backend',
    script: './server.js',
    instances: 'max', // or specify number like 4
    exec_mode: 'cluster', // Enable cluster mode
    watch: false,
    max_memory_restart: '512M', // Per instance
    env: {
      NODE_ENV: 'production',
      PORT: 8030
    }
  }]
};
```

**Expected Improvement**: 4-8x capacity increase (depends on CPU cores)

### Option 2: Increase MongoDB Pool
Update `backend/src/config/db.js`:

```javascript
maxPoolSize: 50, // Increase from 10
minPoolSize: 5,  // Increase from 2
```

**Expected Improvement**: Better handling of concurrent database operations

### Option 3: Increase Memory Limit
Update `ecosystem.config.js`:

```javascript
max_memory_restart: '2G', // Increase from 1G
```

### Option 4: Combined Approach (Best Performance)
- Enable cluster mode with 4-8 instances
- Increase MongoDB pool to 50
- Increase memory to 2GB per instance
- Add load balancer (nginx) if needed

**Expected Capacity with Optimizations**:
- **Concurrent Users**: ~500-1000 users
- **Peak Concurrent**: ~2000-3000 users
- **Daily Active Users**: ~10,000-20,000 users
- **Requests per Second**: ~500-1000 RPS

## Monitoring Recommendations

1. Monitor PM2 processes: `pm2 monit`
2. Check MongoDB connection pool usage
3. Monitor memory usage
4. Track response times
5. Monitor error rates

## Production Checklist

- [ ] Enable cluster mode
- [ ] Increase MongoDB pool size
- [ ] Set up proper logging
- [ ] Configure nginx load balancer
- [ ] Set up monitoring (PM2 Plus or similar)
- [ ] Configure database indexes for performance
- [ ] Set up caching (Redis) for frequently accessed data
- [ ] Configure CDN for static assets

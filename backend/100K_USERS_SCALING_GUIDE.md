# 100K Users Scaling Guide

## Current Capacity vs Required Capacity

### Current Setup (After Recent Updates)
- **Instances**: 1 (Fork mode)
- **Memory**: 2GB per instance
- **MongoDB Pool**: 50 connections
- **Estimated Capacity**: ~100-200 concurrent users

### For 100K Users, We Need:
- **Daily Active Users (DAU)**: 100,000
- **Peak Concurrent Users**: ~5,000-10,000 (assuming 5-10% concurrent)
- **Requests per Second (RPS)**: ~2,000-5,000 RPS
- **Required Instances**: 8-16 PM2 cluster instances
- **Memory**: 16-32GB total (2GB per instance)
- **MongoDB Pool**: 100-200 connections
- **Database**: MongoDB Atlas cluster (recommended) or optimized standalone

## Required Changes

### 1. Enable PM2 Cluster Mode ⚠️ CRITICAL
This is the most important change for handling 100k users.

**File**: `ecosystem.config.js` / `ecosystem.config.cjs`

Change from:
```javascript
instances: 1,
exec_mode: 'fork',
```

To:
```javascript
instances: 'max', // or specify number like 8 or 16
exec_mode: 'cluster',
```

### 2. Increase MongoDB Connection Pool
Already done (50 connections), but for 100k users, consider:
- **Recommended**: 100-200 connections
- **Update**: `backend/src/config/db.js`

### 3. Nginx Load Balancing Configuration
Update nginx to use upstream with multiple backend instances:

```nginx
upstream backend_pool {
    least_conn;  # Use least connections load balancing
    server localhost:8030 max_fails=3 fail_timeout=30s;
    server localhost:8031 max_fails=3 fail_timeout=30s;
    server localhost:8032 max_fails=3 fail_timeout=30s;
    # Add more if running multiple PM2 clusters
    keepalive 32;
}
```

### 4. Server Hardware Requirements

**Minimum for 100K Users:**
- **CPU**: 8-16 cores
- **RAM**: 32GB (16GB for Node.js, 16GB for system)
- **Storage**: 500GB+ SSD
- **Network**: 1Gbps bandwidth

**Recommended:**
- **CPU**: 16-32 cores
- **RAM**: 64GB
- **Storage**: 1TB+ SSD
- **Network**: 10Gbps bandwidth

### 5. Database Optimization

#### MongoDB Atlas (Recommended)
- Use MongoDB Atlas cluster with:
  - **M10 or M20 tier** (minimum)
  - **Replica Set**: 3 nodes
  - **Connection Pooling**: Enabled
  - **Auto-scaling**: Enabled

#### Database Indexes
Ensure all frequently queried fields are indexed:
```javascript
// Example indexes needed
db.venues.createIndex({ location: "2dsphere" });
db.bookings.createIndex({ userId: 1, status: 1 });
db.users.createIndex({ email: 1 });
// Add more based on your query patterns
```

### 6. Add Caching Layer (Redis) - HIGHLY RECOMMENDED

Install Redis:
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis
```

Add Redis to Node.js:
```bash
npm install redis ioredis
```

Cache frequently accessed data:
- User sessions
- Venue listings
- Categories
- Static content

### 7. CDN for Static Assets

Use CDN (CloudFlare, AWS CloudFront, etc.) for:
- Images
- Videos
- CSS/JS files
- Fonts

This offloads ~70-80% of bandwidth from your server.

### 8. Rate Limiting Adjustments

Current: 10,000 requests/minute per IP
For 100k users, consider:
- **Per-IP limit**: 1,000 requests/minute
- **Per-user limit**: 10,000 requests/minute (based on auth token)
- **Global limit**: Monitor and adjust based on capacity

### 9. Monitoring & Logging

Essential tools:
- **PM2 Monitoring**: `pm2 monit`
- **PM2 Plus**: For production monitoring (optional)
- **New Relic / Datadog**: Application performance monitoring
- **MongoDB Atlas Monitoring**: Database performance
- **Nginx Access Logs**: Traffic analysis

### 10. Database Connection Strategy

For 100k users, consider:
- **Connection Pooling**: Already configured (50)
- **Read Replicas**: Use MongoDB read preferences for read-heavy operations
- **Sharding**: If database becomes too large (future consideration)

## Step-by-Step Implementation

### Phase 1: Immediate (Can handle ~500-1000 concurrent)
1. ✅ Increase MongoDB pool to 50 (DONE)
2. ✅ Increase memory to 2GB (DONE)
3. ⚠️ Enable PM2 cluster mode (DO THIS NEXT)

### Phase 2: Short-term (Can handle ~2,000-5,000 concurrent)
4. Increase MongoDB pool to 100
5. Add Redis caching
6. Optimize database indexes
7. Set up CDN for static assets
8. Improve nginx configuration

### Phase 3: Long-term (Can handle 10,000+ concurrent)
9. Move to MongoDB Atlas cluster
10. Add multiple servers (horizontal scaling)
11. Implement database read replicas
12. Add comprehensive monitoring
13. Load testing and optimization

## Performance Targets

For 100K DAU:
- **Response Time**: < 200ms (95th percentile)
- **Uptime**: 99.9% (8.76 hours downtime/year)
- **Error Rate**: < 0.1%
- **Database Query Time**: < 100ms (average)

## Load Testing

Before going live with 100k users, perform load testing:

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test endpoints
ab -n 10000 -c 100 http://localhost:8030/api/health
```

Or use tools like:
- **k6**: Modern load testing tool
- **Artillery**: Node.js load testing
- **JMeter**: Java-based load testing

## Cost Estimation

### Cloud Server (for 100k users)
- **AWS EC2**: $200-500/month (c5.2xlarge or larger)
- **DigitalOcean**: $240-480/month (16GB-32GB droplets)
- **MongoDB Atlas M20**: $150-200/month
- **Redis Cloud**: $30-50/month (optional)
- **CDN**: $20-100/month (depends on traffic)
- **Total**: ~$400-800/month

### Self-Hosted
- Server hardware: $2,000-5,000 (one-time)
- Hosting/internet: $100-200/month
- MongoDB hosting: $0 (if self-hosted) or $150-200/month (Atlas)

## Monitoring Commands

```bash
# PM2 Status
pm2 status
pm2 monit

# System Resources
htop
free -h
df -h

# Nginx Status
sudo systemctl status nginx
sudo tail -f /var/log/nginx/access.log

# MongoDB Connections
mongosh "your-connection-string" --eval "db.serverStatus().connections"

# Redis Status
redis-cli info stats
```

## Critical Checklist

- [ ] Enable PM2 cluster mode (8-16 instances)
- [ ] Increase MongoDB pool to 100-200
- [ ] Set up Redis caching
- [ ] Optimize all database indexes
- [ ] Configure CDN for static assets
- [ ] Update nginx for load balancing
- [ ] Set up monitoring and alerts
- [ ] Perform load testing
- [ ] Document incident response procedures
- [ ] Set up automated backups
- [ ] Configure SSL/HTTPS (if not already)
- [ ] Set up database backups
- [ ] Configure rate limiting properly
- [ ] Enable compression (already done)
- [ ] Set up log rotation

## Warning Signs to Watch

If you see these, you need to scale:
- Response time > 500ms consistently
- Memory usage > 80%
- CPU usage > 80% consistently
- MongoDB connection pool exhausted
- Error rate > 1%
- Database query time > 500ms

## Conclusion

With the current single-instance setup, **you CANNOT handle 100k users**. However, by implementing these changes (especially cluster mode), you can scale to handle 100k users. The most critical immediate step is enabling PM2 cluster mode.


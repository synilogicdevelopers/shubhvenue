# PM2 Setup Guide

PM2 has been configured for the Wedding Venue Backend.

## Quick Start

### Start the backend with PM2:
```bash
npm run pm2:start
```

### Stop the backend:
```bash
npm run pm2:stop
```

### Restart the backend:
```bash
npm run pm2:restart
```

### View logs:
```bash
npm run pm2:logs
```

### Monitor in real-time:
```bash
npm run pm2:monit
```

### Check status:
```bash
npm run pm2:status
```

### Delete from PM2:
```bash
npm run pm2:delete
```

## Direct PM2 Commands

You can also use PM2 commands directly:

```bash
# Start
pm2 start ecosystem.config.js

# Stop
pm2 stop wedding-venue-backend

# Restart
pm2 restart wedding-venue-backend

# Delete
pm2 delete wedding-venue-backend

# View logs
pm2 logs wedding-venue-backend

# Monitor
pm2 monit

# Status
pm2 status

# Save PM2 process list (to auto-start on system reboot)
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

## Configuration

The PM2 configuration is in `ecosystem.config.js`:
- App name: `wedding-venue-backend`
- Script: `server.js`
- Port: 8030 (or from environment variable)
- Logs: `./logs/pm2-*.log`
- Auto-restart: Enabled
- Max memory: 1GB

## Logs Location

PM2 logs are stored in:
- Error logs: `./logs/pm2-error.log`
- Output logs: `./logs/pm2-out.log`
- Combined logs: `./logs/pm2-combined.log`

## Environment Variables

Make sure your `.env` file is configured properly. PM2 will use the environment variables from your system or `.env` file.


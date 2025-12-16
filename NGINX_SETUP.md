# Nginx Configuration for Admin & Vendor Web

## Problem
When reloading pages in admin or vendor web applications, you get 404 Not Found errors. This happens because nginx tries to find files at routes like `/dashboard`, but in Single Page Applications (SPAs), all routes are handled by JavaScript.

## Solution
Configure nginx to serve `index.html` for all routes (SPA routing).

## Setup Instructions

### Step 1: Build the Applications

First, build both applications:

```bash
# Build Admin
cd shaadi_garden_admin
npm run build

# Build Vendor Web
cd WeddingVenue_web
npm run build
```

### Step 2: Copy Build Files to Server

Copy the `dist` folders to your server:

```bash
# Admin
sudo cp -r shaadi_garden_admin/dist /var/www/admin/

# Vendor Web
sudo cp -r WeddingVenue_web/dist /var/www/vendor/
```

### Step 3: Install Nginx Configuration

1. Copy the configuration file to nginx sites-available:

```bash
sudo cp nginx-combined.conf /etc/nginx/sites-available/wedding-venue
```

2. Update the paths in the config file:
   - `/var/www/admin/dist` - Your admin build path
   - `/var/www/vendor/dist` - Your vendor build path
   - `/var/www/backend/uploads` - Your uploads directory path

3. Create symlink to enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/wedding-venue /etc/nginx/sites-enabled/
```

4. Test the configuration:

```bash
sudo nginx -t
```

5. Reload nginx:

```bash
sudo nginx -s reload
# OR
sudo systemctl reload nginx
```

## Configuration Details

### Key Settings:

1. **SPA Routing**: 
   ```nginx
   try_files $uri $uri/ /admin/index.html;
   ```
   This ensures all routes serve `index.html` for client-side routing.

2. **API Proxy**:
   ```nginx
   location /api {
       proxy_pass http://localhost:8030;
   }
   ```
   Proxies API requests to your backend server.

3. **Static Assets Caching**:
   ```nginx
   expires 1y;
   add_header Cache-Control "public, immutable";
   ```
   Caches static files for better performance.

## Alternative: Separate Configurations

If you prefer separate nginx configs:

- `nginx-admin.conf` - For admin only
- `nginx-vendor.conf` - For vendor web only
- `nginx-combined.conf` - For both (recommended)

## Troubleshooting

### Check nginx error logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

### Check nginx access logs:
```bash
sudo tail -f /var/log/nginx/access.log
```

### Verify file permissions:
```bash
sudo chown -R www-data:www-data /var/www/admin
sudo chown -R www-data:www-data /var/www/vendor
```

### Restart nginx:
```bash
sudo systemctl restart nginx
```

## Important Notes

1. **Update Paths**: Make sure to update all paths in the config file to match your server setup.

2. **Backend Port**: The config assumes backend runs on port 8030. Update if different.

3. **Domain**: Update `server_name` with your actual domain.

4. **HTTPS**: For production, add SSL certificate configuration (Let's Encrypt recommended).

## SSL/HTTPS Setup (Optional but Recommended)

For production, add SSL:

```bash
sudo certbot --nginx -d syniwedding.synilogictech.in
```

This will automatically configure SSL and update your nginx config.








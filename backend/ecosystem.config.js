module.exports = {
  apps: [{
    name: 'wedding-venue-backend',
    script: './server.js',
    instances: 'max', // Use all available CPU cores for cluster mode (recommended for 100k users)
    // Alternative: Set specific number like 8 or 16 if you want to limit instances
    // instances: 8, // Uncomment and set number if you prefer specific count
    exec_mode: 'cluster', // Cluster mode - essential for handling high load
    watch: false,
    max_memory_restart: '2G', // Memory limit per instance
    env: {
      NODE_ENV: 'production',
      PORT: 8030
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 8030
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000
  }]
};


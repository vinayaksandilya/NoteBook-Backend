module.exports = {
  apps: [
    {
      name: 'notebook-backend',
      script: './src/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
}; 
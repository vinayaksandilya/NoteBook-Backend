const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { initializeDatabase, testConnection } = require('./config/database');
const userRoutes = require('./routes/user');
const fileRoutes = require('./routes/file');
const courseRoutes = require('./routes/course');
const statsRoutes = require('./routes/stats');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/exports', express.static(path.join(__dirname, '../public/exports')));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/stats', statsRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const isConnected = await testConnection();
    res.json({ 
      status: 'ok',
      database: isConnected ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      database: 'error',
      error: error.message 
    });
  }
});

// Initialize database and start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Test database connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }

    // Initialize database
    await initializeDatabase();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log('Database connection is active');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});

startServer(); 
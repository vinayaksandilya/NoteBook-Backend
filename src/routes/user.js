const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const auth = require('../middleware/auth');
const LoggingService = require('../services/loggingService');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format' 
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User with this email already exists' 
      });
    }

    // Create new user
    const user = await User.create({ username, email, password });

    // Initialize user stats
    await LoggingService.initializeUserStats(user.id);
    
    // Log registration
    await LoggingService.logUserAction(user.id, 'register', {
      action: 'registration',
      username: username,
      email: email
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Failed to register user',
      details: error.message 
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    
    // Validate required fields
    if (!login || !password) {
      return res.status(400).json({ 
        error: 'Login and password are required' 
      });
    }

    // Find user by email or username
    const user = await User.findByEmailOrUsername(login);
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid login credentials' 
      });
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid login credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log successful login
    await LoggingService.logUserAction(user.id, 'login', {
      action: 'login',
      method: 'email/username'
    });

    // Update last login timestamp
    await LoggingService.updateLastLogin(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Failed to login',
      details: error.message 
    });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch profile',
      details: error.message 
    });
  }
});

// Update user profile
router.patch('/profile', auth, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = await User.update(req.user.id, { username, email, password });
    res.json(user);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      error: 'Failed to update profile',
      details: error.message 
    });
  }
});

module.exports = router; 
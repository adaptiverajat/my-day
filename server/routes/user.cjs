const express = require('express');
const { getPool } = require('../db.cjs');

const router = express.Router();

// Check if any user exists in the database
router.get('/user/check', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized' });
    }

    const [rows] = await pool.query('SELECT email FROM user_credentials LIMIT 1');
    const userExists = rows.length > 0;
    res.json({ success: true, userExists, email: userExists ? rows[0].email : null });
  } catch (error) {
    console.error('Error checking user:', error);
    res.status(500).json({ success: false, message: 'Error checking user', error: error.message });
  }
});

// Create a new user
router.post('/user/create', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const [existing] = await pool.query('SELECT id FROM user_credentials WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    await pool.query('INSERT INTO user_credentials (email, password) VALUES (?, ?)', [email, password]);
    res.json({ success: true, message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Error creating user', error: error.message });
  }
});

// Login user
router.post('/user/login', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const [rows] = await pool.query('SELECT id FROM user_credentials WHERE email = ? AND password = ?', [email, password]);

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    res.json({ success: true, message: 'Login successful' });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ success: false, message: 'Error logging in', error: error.message });
  }
});

module.exports = router;

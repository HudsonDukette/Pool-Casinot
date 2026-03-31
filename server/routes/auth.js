const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'poolcasino_secret';
const SALT_ROUNDS = 10;

function validateUsername(username) {
  return typeof username === 'string' && username.trim().length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
}

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!validateUsername(username) || !validatePassword(password)) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const existing = await db.get('SELECT id FROM users WHERE username = ?', [username.trim()]);
    if (existing) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await db.run(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username.trim(), password_hash]
    );
    const user = await db.get('SELECT id, username, balance, created_at FROM users WHERE id = ?', [result.lastID]);
    const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '12h' });

    return res.json({ token, user });
  } catch (error) {
    return res.status(500).json({ message: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!validateUsername(username) || !validatePassword(password)) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const user = await db.get('SELECT id, username, password_hash, balance, created_at FROM users WHERE username = ?', [username.trim()]);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '12h' });
    return res.json({ token, user: { id: user.id, username: user.username, balance: user.balance, created_at: user.created_at } });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed' });
  }
});

module.exports = router;

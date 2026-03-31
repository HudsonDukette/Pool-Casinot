const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const user = await db.get('SELECT id, username, balance, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load user data' });
  }
});

router.get('/history', async (req, res) => {
  try {
    const history = await db.all(
      'SELECT game, result_number, bet_type, bet_amount, win, created_at FROM game_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 12',
      [req.user.id]
    );
    return res.json({ history });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load history' });
  }
});

router.post('/update-balance', async (req, res) => {
  try {
    const { amount } = req.body;
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const user = await db.get('SELECT balance FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newBalance = user.balance + amount;
    await db.run('UPDATE users SET balance = ? WHERE id = ?', [newBalance, req.user.id]);
    await db.run('INSERT INTO transactions (user_id, type, amount) VALUES (?, ?, ?)', [req.user.id, 'deposit', amount]);

    return res.json({ balance: newBalance });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update balance' });
  }
});

module.exports = router;

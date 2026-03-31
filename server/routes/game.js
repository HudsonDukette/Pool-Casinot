const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const allowedBets = ['red', 'black', 'green', 'even', 'odd'];

function computeColor(number) {
  if (number === 0) return 'green';
  return number % 2 === 0 ? 'black' : 'red';
}

function betWins(resultNumber, betType) {
  if (betType === 'red' || betType === 'black') {
    return computeColor(resultNumber) === betType;
  }
  if (betType === 'green') {
    return resultNumber === 0;
  }
  if (betType === 'even') {
    return resultNumber !== 0 && resultNumber % 2 === 0;
  }
  if (betType === 'odd') {
    return resultNumber % 2 === 1;
  }
  return false;
}

function getPayout(betType, amount) {
  if (betType === 'green') return amount * 35;
  return amount;
}

router.post('/roulette', authMiddleware, async (req, res) => {
  try {
    const { bet_type, bet_amount } = req.body;
    if (!allowedBets.includes(bet_type) || typeof bet_amount !== 'number' || bet_amount <= 0) {
      return res.status(400).json({ message: 'Invalid bet' });
    }

    const user = await db.get('SELECT id, balance FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (bet_amount > user.balance) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const resultNumber = Math.floor(Math.random() * 37);
    const win = betWins(resultNumber, bet_type);
    const profit = win ? getPayout(bet_type, bet_amount) : -bet_amount;
    const newBalance = user.balance + profit;

    await db.run('UPDATE users SET balance = ? WHERE id = ?', [newBalance, user.id]);
    await db.run('INSERT INTO transactions (user_id, type, amount) VALUES (?, ?, ?)', [
      user.id,
      win ? 'win' : 'loss',
      profit,
    ]);
    await db.run(
      'INSERT INTO game_history (user_id, game, result_number, bet_type, bet_amount, win) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, 'roulette', resultNumber, bet_type, bet_amount, win ? 1 : 0]
    );

    const stats = await db.get('SELECT total_pool, biggest_win, biggest_bet FROM global_stats WHERE id = 1');
    const poolChange = win ? -profit : bet_amount;
    const totalPool = stats.total_pool + poolChange;
    const biggestWin = win && profit > stats.biggest_win ? profit : stats.biggest_win;
    const biggestBet = bet_amount > stats.biggest_bet ? bet_amount : stats.biggest_bet;
    await db.run('UPDATE global_stats SET total_pool = ?, biggest_win = ?, biggest_bet = ? WHERE id = 1', [
      totalPool,
      biggestWin,
      biggestBet,
    ]);

    return res.json({
      result_number: resultNumber,
      win,
      new_balance: newBalance,
      profit,
      result_color: computeColor(resultNumber),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Roulette spin failed' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const stats = await db.get('SELECT total_pool, biggest_win, biggest_bet FROM global_stats WHERE id = 1');
    const recentWins = await db.all(
      `SELECT gh.game, gh.result_number, gh.bet_type, gh.bet_amount, gh.created_at, u.username
       FROM game_history gh
       JOIN users u ON u.id = gh.user_id
       WHERE gh.win = 1
       ORDER BY gh.created_at DESC
       LIMIT 4`,
      []
    );
    return res.json({
      total_pool: stats.total_pool,
      biggest_win: stats.biggest_win,
      biggest_bet: stats.biggest_bet,
      recent_wins: recentWins,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load stats' });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await db.all(
      'SELECT username, balance FROM users ORDER BY balance DESC LIMIT 10',
      []
    );
    return res.json({ leaderboard });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load leaderboard' });
  }
});

module.exports = router;

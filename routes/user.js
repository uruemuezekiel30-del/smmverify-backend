const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Get user profile
router.get('/profile', authMiddleware, (req, res) => {
  const userId = req.userId;

  db.get(
    `SELECT id, username, email, balance, created_at FROM users WHERE id = ?`,
    [userId],
    (err, user) => {
      if (err || !user) {
        return res.status(500).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    }
  );
});

// Get balance
router.get('/balance', authMiddleware, (req, res) => {
  const userId = req.userId;

  db.get(
    `SELECT balance FROM users WHERE id = ?`,
    [userId],
    (err, user) => {
      if (err || !user) {
        return res.status(500).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        balance: user.balance
      });
    }
  );
});

// Get transaction history
router.get('/transactions', authMiddleware, (req, res) => {
  const userId = req.userId;
  const limit = req.query.limit || 50;

  db.all(
    `SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    [userId, limit],
    (err, transactions) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch transactions'
        });
      }

      res.json({
        success: true,
        data: transactions
      });
    }
  );
});

// Get OTP history
router.get('/otp-history', authMiddleware, (req, res) => {
  const userId = req.userId;
  const limit = req.query.limit || 50;

  db.all(
    `SELECT id, service, country, phone_number, status, price, created_at, completed_at 
     FROM otp_orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    [userId, limit],
    (err, orders) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch OTP history'
        });
      }

      res.json({
        success: true,
        data: orders
      });
    }
  );
});

module.exports = router;

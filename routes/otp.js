const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const smsPoolService = require('../services/smspool');

const PRICES = {
  'facebook': 500,
  'whatsapp': 1000,
  'tiktok': 600,
  'instagram': 600
};

// Request OTP
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { service, country } = req.body;
    const userId = req.userId;

    if (!service || !country) {
      return res.status(400).json({
        success: false,
        message: 'Service and country are required'
      });
    }

    const price = PRICES[service];
    if (!price) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service'
      });
    }

    // Check user balance
    db.get(`SELECT balance FROM users WHERE id = ?`, [userId], async (err, user) => {
      if (err || !user) {
        return res.status(500).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.balance < price) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance. Required: ₦${price}, Available: ₦${user.balance}`
        });
      }

      try {
        // Request from SMSPool
        const smsResponse = await smsPoolService.requestOTP(service, country);

        if (smsResponse.success) {
          const orderId = uuidv4();
          const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes

          // Save order
          db.run(
            `INSERT INTO otp_orders (id, user_id, service, country, phone_number, price, status, smspool_order_id, expires_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [orderId, userId, service, country, smsResponse.phoneNumber, price, 'active', smsResponse.orderId, expiresAt],
            (err) => {
              if (err) {
                return res.status(500).json({
                  success: false,
                  message: 'Failed to save order'
                });
              }

              // Deduct balance
              db.run(
                `UPDATE users SET balance = balance - ? WHERE id = ?`,
                [price, userId],
                () => {
                  // Log transaction
                  db.run(
                    `INSERT INTO transactions (id, user_id, type, amount, order_id, order_type, description)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [uuidv4(), userId, 'debit', price, orderId, 'otp', `OTP Request - ${service} (${country})`]
                  );

                  res.json({
                    success: true,
                    message: 'OTP requested successfully',
                    data: {
                      orderId,
                      phoneNumber: smsResponse.phoneNumber,
                      service,
                      country,
                      price,
                      expiresAt
                    }
                  });
                }
              );
            }
          );
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to request OTP: ' + error.message
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Check OTP Status
router.get('/check/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;

    db.get(
      `SELECT * FROM otp_orders WHERE id = ? AND user_id = ?`,
      [orderId, userId],
      async (err, order) => {
        if (err || !order) {
          return res.status(404).json({
            success: false,
            message: 'Order not found'
          });
        }

        try {
          const otpResponse = await smsPoolService.checkOTP(order.smspool_order_id);

          if (otpResponse.otp) {
            // Update order
            db.run(
              `UPDATE otp_orders SET otp_code = ?, status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?`,
              [otpResponse.otp, orderId]
            );
          }

          res.json({
            success: true,
            data: {
              orderId,
              status: otpResponse.otp ? 'completed' : 'pending',
              otp: otpResponse.otp || null
            }
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            message: 'Failed to check OTP: ' + error.message
          });
        }
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Cancel OTP Order
router.post('/cancel/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;

    db.get(
      `SELECT * FROM otp_orders WHERE id = ? AND user_id = ?`,
      [orderId, userId],
      async (err, order) => {
        if (err || !order) {
          return res.status(404).json({
            success: false,
            message: 'Order not found'
          });
        }

        try {
          await smsPoolService.cancelOrder(order.smspool_order_id);

          // Update order
          db.run(
            `UPDATE otp_orders SET status = 'cancelled' WHERE id = ?`,
            [orderId]
          );

          // Refund balance
          db.run(
            `UPDATE users SET balance = balance + ? WHERE id = ?`,
            [order.price, userId]
          );

          res.json({
            success: true,
            message: 'Order cancelled and balance refunded'
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            message: 'Failed to cancel order: ' + error.message
          });
        }
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

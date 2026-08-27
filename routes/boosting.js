const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const smmPanelService = require('../services/smmpanel');

const RATES = {
  'fb_followers': 1700,
  'tt_followers': 2000,
  'tt_views': 50,
  'ig_followers': 1800,
  'ig_likes': 300
};

// Submit Boosting Order
router.post('/order', authMiddleware, async (req, res) => {
  try {
    const { serviceType, targetLink, quantity } = req.body;
    const userId = req.userId;

    if (!serviceType || !targetLink || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Service type, target link, and quantity are required'
      });
    }

    const rate = RATES[serviceType];
    if (!rate) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service type'
      });
    }

    if (quantity < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum quantity is 100'
      });
    }

    const totalCost = (quantity / 1000) * rate;

    // Check user balance
    db.get(`SELECT balance FROM users WHERE id = ?`, [userId], async (err, user) => {
      if (err || !user) {
        return res.status(500).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.balance < totalCost) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance. Required: ₦${totalCost.toFixed(2)}, Available: ₦${user.balance.toFixed(2)}`
        });
      }

      try {
        // Place order on SMM Panel
        const smmResponse = await smmPanelService.placeOrder(serviceType, targetLink, quantity);

        if (smmResponse.success) {
          const orderId = uuidv4();

          // Save order
          db.run(
            `INSERT INTO boosting_orders (id, user_id, service_type, target_link, quantity, total_cost, status, smm_panel_order_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [orderId, userId, serviceType, targetLink, quantity, totalCost, 'pending', smmResponse.orderId],
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
                [totalCost, userId],
                () => {
                  // Log transaction
                  db.run(
                    `INSERT INTO transactions (id, user_id, type, amount, order_id, order_type, description)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [uuidv4(), userId, 'debit', totalCost, orderId, 'boosting', `${serviceType} - ${quantity} units`]
                  );

                  res.status(201).json({
                    success: true,
                    message: 'Boosting order submitted successfully',
                    data: {
                      orderId,
                      smmOrderId: smmResponse.orderId,
                      serviceType,
                      quantity,
                      totalCost,
                      status: 'pending'
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
          message: 'Failed to place order: ' + error.message
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

// Check Boosting Order Status
router.get('/status/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;

    db.get(
      `SELECT * FROM boosting_orders WHERE id = ? AND user_id = ?`,
      [orderId, userId],
      async (err, order) => {
        if (err || !order) {
          return res.status(404).json({
            success: false,
            message: 'Order not found'
          });
        }

        try {
          const statusResponse = await smmPanelService.checkOrderStatus(order.smm_panel_order_id);

          // Update status if changed
          if (statusResponse.status === 'Completed') {
            db.run(
              `UPDATE boosting_orders SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?`,
              [orderId]
            );
          }

          res.json({
            success: true,
            data: {
              orderId,
              status: statusResponse.status,
              progress: `${statusResponse.currentCount}/${order.quantity}`
            }
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            message: 'Failed to check order status: ' + error.message
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

// Get all boosting orders
router.get('/orders', authMiddleware, (req, res) => {
  const userId = req.userId;

  db.all(
    `SELECT * FROM boosting_orders WHERE user_id = ? ORDER BY created_at DESC`,
    [userId],
    (err, orders) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch orders'
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

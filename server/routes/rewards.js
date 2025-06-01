import express from 'express';
import { body, validationResult } from 'express-validator';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import { db } from '../config/database.js';

const router = express.Router();

// Get all rewards
router.get('/rewards', async (req, res) => {
  try {
    const rewards = db.prepare('SELECT * FROM rewards').all();
    res.json(rewards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create reward (admin only)
router.post(
  '/rewards',
  [
    verifyToken,
    isAdmin,
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('pointsRequired').isInt({ min: 1 }).withMessage('Valid points required is required'),
    body('stock').isInt({ min: -1 }).withMessage('Valid stock is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, pointsRequired, stock } = req.body;
      
      const result = db.prepare(`
        INSERT INTO rewards (title, description, points_required, stock)
        VALUES (?, ?, ?, ?)
      `).run(title, description, pointsRequired, stock);

      res.json({
        id: result.lastInsertRowid,
        title,
        description,
        pointsRequired,
        stock
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Claim reward
router.post('/rewards/:id/claim', verifyToken, async (req, res) => {
  try {
    const rewardId = req.params.id;
    const userId = req.user.id;

    const reward = db.prepare('SELECT * FROM rewards WHERE id = ?').get(rewardId);
    if (!reward) {
      return res.status(404).json({ error: 'Reward not found' });
    }

    const user = db.prepare('SELECT points FROM users WHERE id = ?').get(userId);
    if (user.points < reward.points_required) {
      return res.status(400).json({ error: 'Insufficient points' });
    }

    if (reward.stock === 0) {
      return res.status(400).json({ error: 'Reward out of stock' });
    }

    db.transaction(() => {
      // Deduct points
      db.prepare(`
        UPDATE users 
        SET points = points - ? 
        WHERE id = ?
      `).run(reward.points_required, userId);

      // Record claim
      db.prepare(`
        INSERT INTO claims (user_id, reward_id)
        VALUES (?, ?)
      `).run(userId, rewardId);

      // Update stock if not unlimited (-1)
      if (reward.stock > 0) {
        db.prepare(`
          UPDATE rewards 
          SET stock = stock - 1 
          WHERE id = ?
        `).run(rewardId);
      }
    })();

    res.json({ message: 'Reward claimed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
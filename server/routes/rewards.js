import express from 'express';
import { body, validationResult } from 'express-validator';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import { getAllRewards, claimReward, runQuery } from '../config/database.js';

const router = express.Router();

// Get all rewards
router.get('/rewards', async (req, res) => {
  try {
    const rewards = await getAllRewards();
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
      
      const result = await runQuery(
        'INSERT INTO rewards (title, description, points_required, stock) VALUES (?, ?, ?, ?)',
        [title, description, pointsRequired, stock]
      );

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

    await claimReward(userId, rewardId);
    res.json({ message: 'Reward claimed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
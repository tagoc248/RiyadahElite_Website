import express from 'express';
import { db } from '../models/database.js';
import { verifyToken } from '../middleware/auth.js';

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

// Claim reward
router.post('/rewards/claim', verifyToken, async (req, res) => {
  try {
    const { rewardId } = req.body;
    const userId = req.user.id;

    // Check if reward exists
    const reward = db.prepare('SELECT * FROM rewards WHERE id = ?').get(rewardId);
    if (!reward) {
      return res.status(404).json({ error: 'Reward not found' });
    }

    // Add claim
    const result = db.prepare(
      'INSERT INTO claims (user_id, reward_id) VALUES (?, ?)'
    ).run(userId, rewardId);

    res.json({
      id: result.lastInsertRowid,
      userId,
      rewardId,
      claimedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
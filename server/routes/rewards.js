import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getAllRewards, claimReward } from '../models/database.js';

const router = express.Router();

// Get all rewards
router.get('/rewards', async (req, res) => {
  try {
    const rewards = getAllRewards();
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

    const result = claimReward(userId, rewardId);

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
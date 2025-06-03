import express from 'express';
import { body } from 'express-validator';
import {
  getAllRewards,
  getRewardById,
  createReward,
  updateReward,
  deleteReward,
  claimReward
} from '../controllers/rewards.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllRewards);
router.get('/:id', getRewardById);
router.post('/', [
  auth,
  adminAuth,
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('points').isInt({ min: 1 }).withMessage('Points must be a positive number')
], createReward);
router.put('/:id', auth, adminAuth, updateReward);
router.delete('/:id', auth, adminAuth, deleteReward);
router.post('/:id/claim', auth, claimReward);

export default router;
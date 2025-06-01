import express from 'express';
import { body, validationResult } from 'express-validator';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import { getAllTournaments, createTournament } from '../models/database.js';

const router = express.Router();

// Get all tournaments
router.get('/tournaments', async (req, res) => {
  try {
    const tournaments = getAllTournaments();
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create tournament (admin only)
router.post(
  '/tournaments',
  [
    verifyToken,
    isAdmin,
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('date').isISO8601().withMessage('Valid date is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, date } = req.body;
      const result = createTournament(title, description, date);

      res.json({
        id: result.lastInsertRowid,
        title,
        description,
        date
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
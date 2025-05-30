import express from 'express';
import { db } from '../models/database.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get all tournaments
router.get('/tournaments', async (req, res) => {
  try {
    const tournaments = db.prepare('SELECT * FROM tournaments ORDER BY date DESC').all();
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create tournament (admin only)
router.post('/tournaments', verifyToken, async (req, res) => {
  try {
    const { title, description, date } = req.body;

    const result = db.prepare(
      'INSERT INTO tournaments (title, description, date) VALUES (?, ?, ?)'
    ).run(title, description, date);

    res.json({
      id: result.lastInsertRowid,
      title,
      description,
      date
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
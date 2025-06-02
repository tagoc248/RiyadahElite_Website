import express from 'express';
import { body, validationResult } from 'express-validator';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import { getAllTournaments, createTournament, getOne, runQuery } from '../config/database.js';

const router = express.Router();

// Get all tournaments
router.get('/tournaments', async (req, res) => {
  try {
    const tournaments = await getAllTournaments();
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tournament by ID
router.get('/tournaments/:id', async (req, res) => {
  try {
    const tournament = await getOne('SELECT * FROM tournaments WHERE id = ?', [req.params.id]);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    res.json(tournament);
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
    body('date').isISO8601().withMessage('Valid date is required'),
    body('prizePool').trim().notEmpty().withMessage('Prize pool is required'),
    body('maxParticipants').isInt({ min: 1 }).withMessage('Valid max participants is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, date, prizePool, maxParticipants } = req.body;
      
      const result = await createTournament({ title, description, date, prizePool, maxParticipants });

      res.json({
        id: result.lastInsertRowid,
        title,
        description,
        date,
        prizePool,
        maxParticipants
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Join tournament
router.post('/tournaments/:id/join', verifyToken, async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const userId = req.user.id;

    const tournament = await getOne('SELECT * FROM tournaments WHERE id = ?', [tournamentId]);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    if (tournament.current_participants >= tournament.max_participants) {
      return res.status(400).json({ error: 'Tournament is full' });
    }

    await runQuery(
      'INSERT INTO tournament_participants (tournament_id, user_id) VALUES (?, ?)',
      [tournamentId, userId]
    );

    await runQuery(
      'UPDATE tournaments SET current_participants = current_participants + 1 WHERE id = ?',
      [tournamentId]
    );

    res.json({ message: 'Successfully joined tournament' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
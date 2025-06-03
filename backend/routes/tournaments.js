import express from 'express';
import { body } from 'express-validator';
import { 
  getAllTournaments,
  getTournamentById,
  createTournament,
  updateTournament,
  deleteTournament
} from '../controllers/tournaments.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllTournaments);
router.get('/:id', getTournamentById);
router.post('/', [
  auth,
  adminAuth,
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('prizePool').isNumeric().withMessage('Prize pool must be a number')
], createTournament);
router.put('/:id', auth, adminAuth, updateTournament);
router.delete('/:id', auth, adminAuth, deleteTournament);

export default router;
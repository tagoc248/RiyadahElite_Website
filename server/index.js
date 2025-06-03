import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { initializeDatabase } from './config/database.js';
import authRoutes from './routes/auth.js';
import tournamentRoutes from './routes/tournaments.js';
import rewardRoutes from './routes/rewards.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize database
initializeDatabase();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(helmet());
app.use(compression());
app.use(cookieParser());

// API Routes
app.use('/api', authRoutes);
app.use('/api', tournamentRoutes);
app.use('/api', rewardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start HTTP server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});

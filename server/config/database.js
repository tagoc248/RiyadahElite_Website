import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '../data/riyadah.db');

let db;

// Helper function to run SQL queries
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

// Helper function to get single row
const getOne = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Helper function to get multiple rows
const getAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export async function initializeDatabase() {
  try {
    db = new sqlite3.Database(dbPath);
    db.run('PRAGMA foreign_keys = ON');

    // Users table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        google_id TEXT UNIQUE,
        role TEXT DEFAULT 'user',
        avatar TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create admin user if not exists
    const adminEmail = 'admin@gmail.com';
    const admin = await getOne('SELECT * FROM users WHERE email = ?', [adminEmail]);
    
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('Admin@123', salt);
      
      await runQuery(`
        INSERT INTO users (name, email, password_hash, role)
        VALUES (?, ?, ?, ?)
      `, ['Admin', adminEmail, passwordHash, 'admin']);
      
      console.log('Admin user created successfully');
    }

    // Tournaments table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS tournaments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        date TIMESTAMP NOT NULL,
        prize_pool TEXT,
        max_participants INTEGER,
        current_participants INTEGER DEFAULT 0,
        status TEXT DEFAULT 'upcoming',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tournament Participants table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS tournament_participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tournament_id) REFERENCES tournaments (id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(tournament_id, user_id)
      )
    `);

    // Rewards table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS rewards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        points_required INTEGER NOT NULL,
        stock INTEGER DEFAULT -1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User Points table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS user_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        points INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Claims table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS claims (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        reward_id INTEGER NOT NULL,
        claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (reward_id) REFERENCES rewards (id)
      )
    `);

    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

// User operations
export async function createUser({ name, email, passwordHash, googleId = null, role = 'user', avatar = null }) {
  const result = await runQuery(
    `INSERT INTO users (name, email, password_hash, google_id, role, avatar)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, email, passwordHash, googleId, role, avatar]
  );
  
  // Initialize user points
  await runQuery(
    'INSERT INTO user_points (user_id) VALUES (?)',
    [result.lastID]
  );
  
  return result;
}

export async function getUserByEmail(email) {
  return await getOne('SELECT * FROM users WHERE email = ?', [email]);
}

export async function getUserById(id) {
  return await getOne(
    'SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?',
    [id]
  );
}

export async function getUserByGoogleId(googleId) {
  return await getOne('SELECT * FROM users WHERE google_id = ?', [googleId]);
}

// Tournament operations
export async function getAllTournaments() {
  return await getAll(`
    SELECT t.*, COUNT(tp.id) as participant_count 
    FROM tournaments t 
    LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id 
    GROUP BY t.id 
    ORDER BY t.date DESC
  `);
}

export async function createTournament(data) {
  return await runQuery(
    `INSERT INTO tournaments (title, description, date, prize_pool, max_participants)
     VALUES (?, ?, ?, ?, ?)`,
    [data.title, data.description, data.date, data.prizePool, data.maxParticipants]
  );
}

// Rewards operations
export async function getAllRewards() {
  return await getAll('SELECT * FROM rewards');
}

export async function claimReward(userId, rewardId) {
  const reward = await getOne('SELECT * FROM rewards WHERE id = ?', [rewardId]);
  if (!reward) {
    throw new Error('Reward not found');
  }

  const userPoints = await getOne('SELECT points FROM user_points WHERE user_id = ?', [userId]);
  if (!userPoints || userPoints.points < reward.points_required) {
    throw new Error('Insufficient points');
  }

  // Start transaction
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      try {
        // Deduct points
        db.run(
          'UPDATE user_points SET points = points - ? WHERE user_id = ?',
          [reward.points_required, userId]
        );
        
        // Record claim
        db.run(
          'INSERT INTO claims (user_id, reward_id) VALUES (?, ?)',
          [userId, rewardId]
        );

        db.run('COMMIT');
        resolve({ success: true });
      } catch (error) {
        db.run('ROLLBACK');
        reject(error);
      }
    });
  });
}
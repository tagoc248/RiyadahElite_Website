import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '../data/riyadah.db');

export const db = new Database(dbPath);

export function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      google_id TEXT UNIQUE,
      role TEXT DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tournaments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tournaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      date TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Rewards table
  db.exec(`
    CREATE TABLE IF NOT EXISTS rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      points_required INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Claims table
  db.exec(`
    CREATE TABLE IF NOT EXISTS claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      reward_id INTEGER NOT NULL,
      claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (reward_id) REFERENCES rewards (id)
    )
  `);

  // Create admin user if not exists
  const adminEmail = 'admin@riyadahelite.com';
  const admin = db.prepare('SELECT * FROM users WHERE email = ?').get(adminEmail);
  
  if (!admin) {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('admin123', salt);
    
    db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `).run('Admin', adminEmail, passwordHash, 'admin');
  }
}

export function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

export function getUserById(id) {
  return db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(id);
}

export function createUser(name, email, passwordHash) {
  const stmt = db.prepare(`
    INSERT INTO users (name, email, password_hash)
    VALUES (?, ?, ?)
  `);
  return stmt.run(name, email, passwordHash);
}

export function createGoogleUser(name, email, googleId) {
  const stmt = db.prepare(`
    INSERT INTO users (name, email, google_id)
    VALUES (?, ?, ?)
  `);
  return stmt.run(name, email, googleId);
}

export function getUserByGoogleId(googleId) {
  return db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);
}

export function getAllTournaments() {
  return db.prepare('SELECT * FROM tournaments ORDER BY date DESC').all();
}

export function createTournament(title, description, date) {
  const stmt = db.prepare(`
    INSERT INTO tournaments (title, description, date)
    VALUES (?, ?, ?)
  `);
  return stmt.run(title, description, date);
}

export function getAllRewards() {
  return db.prepare('SELECT * FROM rewards').all();
}

export function claimReward(userId, rewardId) {
  const stmt = db.prepare(`
    INSERT INTO claims (user_id, reward_id)
    VALUES (?, ?)
  `);
  return stmt.run(userId, rewardId);
}
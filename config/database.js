const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('✅ Connected to SQLite database');
    initializeTables();
  }
});

function initializeTables() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        balance REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // OTP Orders table
    db.run(`
      CREATE TABLE IF NOT EXISTS otp_orders (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        service TEXT NOT NULL,
        country TEXT NOT NULL,
        phone_number TEXT,
        otp_code TEXT,
        price REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        smspool_order_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        completed_at DATETIME,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // Boosting Orders table
    db.run(`
      CREATE TABLE IF NOT EXISTS boosting_orders (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        service_type TEXT NOT NULL,
        target_link TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        total_cost REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        smm_panel_order_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // Transactions table
    db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        order_id TEXT,
        order_type TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);
  });
}

module.exports = db;

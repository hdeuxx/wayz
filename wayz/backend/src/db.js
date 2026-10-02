const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'wayz.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    description TEXT,
    photo_url TEXT,
    created_at INTEGER NOT NULL,
    reported_by TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    confirmed_count INTEGER NOT NULL DEFAULT 0,
    dismissed_count INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_incidents_expires ON incidents(expires_at);

  CREATE TABLE IF NOT EXISTS devices (
    token TEXT PRIMARY KEY,
    user_id TEXT,
    latitude REAL,
    longitude REAL,
    updated_at INTEGER NOT NULL
  );
`);

module.exports = { db, DATA_DIR };

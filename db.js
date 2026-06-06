const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// DATABASE_PATH env var points to persistent disk on Render; falls back to local ./data/
const dataDir = process.env.DATABASE_PATH
  ? path.dirname(process.env.DATABASE_PATH)
  : path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbFile = process.env.DATABASE_PATH || path.join(dataDir, 'zzlogistics.db');
const db = new Database(dbFile);

db.exec(`
  PRAGMA journal_mode=WAL;

  CREATE TABLE IF NOT EXISTS accounts (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    email     TEXT    COLLATE NOCASE,
    phone     TEXT,
    apple     TEXT    COLLATE NOCASE,
    pw_hash   TEXT    NOT NULL,
    sec_q     TEXT,
    sec_a_hash TEXT,
    role      TEXT    DEFAULT 'admin',
    created   INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS user_data (
    user_id  INTEGER PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
    payload  TEXT    NOT NULL DEFAULT '{}',
    updated  INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS sessions (
    sid      TEXT    PRIMARY KEY,
    sess     TEXT    NOT NULL,
    expired  INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_expired ON sessions(expired);
`);

module.exports = db;

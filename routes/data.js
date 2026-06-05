const express = require('express');
const db = require('../db');
const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'غير مسجل' });
  next();
}

// GET all data for current user
router.get('/data', requireAuth, (req, res) => {
  const row = db.prepare('SELECT payload FROM user_data WHERE user_id=?').get(req.session.userId);
  try { res.json(row ? JSON.parse(row.payload) : {}); }
  catch(e) { res.json({}); }
});

// PUT (upsert) all data for current user
router.put('/data', requireAuth, (req, res) => {
  db.prepare(`
    INSERT INTO user_data (user_id, payload, updated) VALUES (?,?,unixepoch())
    ON CONFLICT(user_id) DO UPDATE SET payload=excluded.payload, updated=excluded.updated
  `).run(req.session.userId, JSON.stringify(req.body));
  res.json({ ok: true });
});

// DELETE all data for current user
router.delete('/data', requireAuth, (req, res) => {
  db.prepare('DELETE FROM user_data WHERE user_id=?').run(req.session.userId);
  res.json({ ok: true });
});

module.exports = router;

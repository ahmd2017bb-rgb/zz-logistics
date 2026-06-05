require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const db = require('./db');
const SQLiteStore = require('./sqliteStore');
const authRouter = require('./routes/auth');
const dataRouter = require('./routes/data');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  store: new SQLiteStore(db),
  secret: process.env.SESSION_SECRET || 'zzlg2024-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 8 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax'
  }
}));

app.use('/api/auth', authRouter);
app.use('/api', dataRouter);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅  Z&Z Logistics  →  http://localhost:${PORT}`);
});

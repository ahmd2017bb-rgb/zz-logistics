const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { sendCodeEmail } = require('./mailer');
const router = express.Router();

// Recover account tokens (in-memory, 15 min TTL)
const forgotTokens = new Map();
// Email OTP codes (in-memory, 10 min TTL)
const otpCodes = new Map();

function findAccount(identifier) {
  const id = identifier.trim().toLowerCase();
  return db.prepare(`
    SELECT * FROM accounts
    WHERE LOWER(name)=?
       OR LOWER(email)=?
       OR REPLACE(REPLACE(phone,' ',''),'-','') = REPLACE(REPLACE(?,' ',''),'-','')
       OR LOWER(apple)=?
  `).get(id, id, id, id);
}

// ── STATUS (for startup check) ────────────────
router.get('/status', (req, res) => {
  const firstRun = !db.prepare('SELECT 1 FROM accounts LIMIT 1').get();
  if (req.session.userId) {
    const acct = db.prepare(
      'SELECT id,name,email,phone,apple,role FROM accounts WHERE id=?'
    ).get(req.session.userId);
    if (acct) return res.json({ loggedIn: true, firstRun: false, user: acct });
  }
  res.json({ loggedIn: false, firstRun });
});

// ── LOGIN ─────────────────────────────────────
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password)
    return res.status(400).json({ error: 'بيانات ناقصة' });

  const acct = findAccount(identifier);
  if (!acct) return res.status(401).json({ error: 'لا يوجد حساب بهذا المعرف' });

  const ok = await bcrypt.compare(password, acct.pw_hash);
  if (!ok) return res.status(401).json({ error: 'كلمة المرور غير صحيحة' });

  req.session.userId = acct.id;
  res.json({ id: acct.id, name: acct.name, email: acct.email, phone: acct.phone, apple: acct.apple, role: acct.role });
});

// ── LOGOUT ────────────────────────────────────
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// ── SIGNUP ────────────────────────────────────
router.post('/signup', async (req, res) => {
  const { name, email, phone, apple, password, secQuestion, secAnswer } = req.body;
  if (!name || !password || !secQuestion || !secAnswer)
    return res.status(400).json({ error: 'بيانات ناقصة' });
  if (password.length < 4)
    return res.status(400).json({ error: 'كلمة المرور قصيرة (4 أحرف على الأقل)' });

  const existing = db.prepare('SELECT id FROM accounts WHERE LOWER(name)=?').get(name.toLowerCase());
  if (existing) return res.status(409).json({ error: 'اسم المستخدم مستخدم بالفعل' });

  const [pwHash, secHash] = await Promise.all([
    bcrypt.hash(password, 10),
    bcrypt.hash(secAnswer.toLowerCase().trim(), 10)
  ]);

  const result = db.prepare(`
    INSERT INTO accounts (name,email,phone,apple,pw_hash,sec_q,sec_a_hash,role)
    VALUES (?,?,?,?,?,?,?,'admin')
  `).run(name, email || null, phone || null, apple || null, pwHash, secQuestion, secHash);

  req.session.userId = result.lastInsertRowid;
  res.json({ id: result.lastInsertRowid, name, email: email || '', phone: phone || '', apple: apple || '', role: 'admin' });
});

// ── PROFILE UPDATE ───────────────────────────
router.put('/profile', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'غير مسجل' });
  const { name, email, phone, apple, password } = req.body;
  if (!name) return res.status(400).json({ error: 'الاسم مطلوب' });
  if (password && password.length < 4)
    return res.status(400).json({ error: 'كلمة المرور قصيرة' });

  let query = 'UPDATE accounts SET name=?,email=?,phone=?,apple=?';
  const params = [name, email || null, phone || null, apple || null];
  if (password) { query += ',pw_hash=?'; params.push(await bcrypt.hash(password, 10)); }
  query += ' WHERE id=?';
  params.push(req.session.userId);
  db.prepare(query).run(...params);

  const acct = db.prepare('SELECT id,name,email,phone,apple,role FROM accounts WHERE id=?').get(req.session.userId);
  res.json(acct);
});

function maskEmail(email) {
  if (!email) return '';
  const [local, domain] = email.split('@');
  return local[0] + '*'.repeat(Math.max(local.length - 1, 3)) + '@' + domain;
}

// ── FORGOT — step 1: find account ─────────────
router.post('/forgot/find', (req, res) => {
  const { identifier } = req.body;
  if (!identifier) return res.status(400).json({ error: 'يرجى إدخال المعرف' });
  const acct = findAccount(identifier);
  if (!acct) return res.status(404).json({ error: 'لا يوجد حساب بهذا المعرف' });
  if (!acct.sec_q) return res.status(400).json({ error: 'هذا الحساب لا يملك سؤال أمان — تواصل مع المسؤول' });
  res.json({
    accountId: acct.id,
    accountName: acct.name,
    secQuestion: acct.sec_q,
    hasEmail: !!acct.email,
    maskedEmail: maskEmail(acct.email)
  });
});

// ── FORGOT — step 2: verify answer ────────────
router.post('/forgot/verify', async (req, res) => {
  const { accountId, answer } = req.body;
  if (!accountId || !answer) return res.status(400).json({ error: 'بيانات ناقصة' });
  const acct = db.prepare('SELECT * FROM accounts WHERE id=?').get(accountId);
  if (!acct) return res.status(404).json({ error: 'حساب غير موجود' });
  const ok = await bcrypt.compare(answer.toLowerCase().trim(), acct.sec_a_hash);
  if (!ok) return res.status(401).json({ error: 'الإجابة غير صحيحة' });
  const token = Date.now().toString(36) + Math.random().toString(36).slice(2);
  forgotTokens.set(token, { accountId: acct.id, expires: Date.now() + 15 * 60 * 1000 });
  res.json({ token });
});

// ── FORGOT — step 3: reset password ──────────
router.post('/forgot/reset', async (req, res) => {
  const { token, password } = req.body;
  const entry = forgotTokens.get(token);
  if (!entry || Date.now() > entry.expires)
    return res.status(401).json({ error: 'انتهت صلاحية الرمز، أعد المحاولة' });
  if (!password || password.length < 4)
    return res.status(400).json({ error: 'كلمة المرور قصيرة' });
  db.prepare('UPDATE accounts SET pw_hash=? WHERE id=?').run(
    await bcrypt.hash(password, 10), entry.accountId
  );
  forgotTokens.delete(token);
  res.json({ ok: true });
});

// ── FORGOT — send OTP code to email ──────────
router.post('/forgot/send-code', async (req, res) => {
  const { accountId } = req.body;
  if (!accountId) return res.status(400).json({ error: 'بيانات ناقصة' });
  const acct = db.prepare('SELECT * FROM accounts WHERE id=?').get(accountId);
  if (!acct) return res.status(404).json({ error: 'حساب غير موجود' });
  if (!acct.email) return res.status(400).json({ error: 'لا يوجد بريد إلكتروني مرتبط بهذا الحساب' });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  otpCodes.set(String(accountId), { code, expires: Date.now() + 10 * 60 * 1000 });

  try {
    await sendCodeEmail(acct.email, code);
    res.json({ sent: true, maskedEmail: maskEmail(acct.email) });
  } catch (e) {
    if (e.message === 'SMTP_NOT_CONFIGURED') {
      return res.status(503).json({ error: 'البريد الإلكتروني غير مُهيّأ — يرجى إعداد ملف .env أولاً' });
    }
    console.error('Email error:', e.message);
    res.status(500).json({ error: 'فشل إرسال البريد — تحقق من إعدادات SMTP' });
  }
});

// ── FORGOT — verify OTP code ─────────────────
router.post('/forgot/verify-code', (req, res) => {
  const { accountId, code } = req.body;
  if (!accountId || !code) return res.status(400).json({ error: 'بيانات ناقصة' });
  const entry = otpCodes.get(String(accountId));
  if (!entry) return res.status(401).json({ error: 'لم يتم إرسال كود لهذا الحساب' });
  if (Date.now() > entry.expires) {
    otpCodes.delete(String(accountId));
    return res.status(401).json({ error: 'انتهت صلاحية الكود — أعد الإرسال' });
  }
  if (entry.code !== code.trim()) return res.status(401).json({ error: 'الكود غير صحيح' });
  otpCodes.delete(String(accountId));
  const token = Date.now().toString(36) + Math.random().toString(36).slice(2);
  forgotTokens.set(token, { accountId: parseInt(accountId), expires: Date.now() + 15 * 60 * 1000 });
  res.json({ token });
});

module.exports = router;

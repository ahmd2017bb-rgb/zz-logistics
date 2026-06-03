require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ahmadalreefai2021@gmail.com';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 }
}));

const otpStore = new Map();

function createOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

app.post('/api/send-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return res.status(400).json({ ok: false, message: 'هذا البريد غير مسموح له بالدخول' });
    }

    const code = createOtp();
    otpStore.set(email.toLowerCase(), {
      code,
      expires: Date.now() + 10 * 60 * 1000
    });

    const transporter = getTransporter();

    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'رمز دخول Z&Z Logistics',
      html: `
        <div style="font-family:Arial;direction:rtl;text-align:right">
          <h2>رمز الدخول</h2>
          <p>رمز الدخول الخاص بك هو:</p>
          <h1 style="letter-spacing:4px">${code}</h1>
          <p>الرمز صالح لمدة 10 دقائق.</p>
        </div>
      `
    });

    res.json({ ok: true, message: 'تم إرسال الرمز إلى بريدك' });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: 'فشل إرسال البريد. تأكد من إعدادات SMTP في ملف .env'
    });
  }
});

app.post('/api/verify-code', (req, res) => {
  const { email, code } = req.body;
  const record = otpStore.get(String(email || '').toLowerCase());

  if (!record) {
    return res.status(400).json({ ok: false, message: 'لا يوجد رمز لهذا البريد' });
  }

  if (Date.now() > record.expires) {
    otpStore.delete(email.toLowerCase());
    return res.status(400).json({ ok: false, message: 'انتهت صلاحية الرمز' });
  }

  if (record.code !== String(code || '').trim()) {
    return res.status(400).json({ ok: false, message: 'الرمز غير صحيح' });
  }

  req.session.user = email.toLowerCase();
  otpStore.delete(email.toLowerCase());
  res.json({ ok: true, message: 'تم تسجيل الدخول' });
});

app.get('/api/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ ok: false });
  res.json({ ok: true, email: req.session.user });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.listen(PORT, () => {
  console.log(`ZZ Logistics website running on port ${PORT}`);
});
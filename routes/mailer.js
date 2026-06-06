const nodemailer = require('nodemailer');

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass || user === 'your@gmail.com') return null;
  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
  return _transporter;
}

async function sendCodeEmail(to, code) {
  const t = getTransporter();
  if (!t) throw new Error('SMTP_NOT_CONFIGURED');
  await t.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: 'كود استرجاع حساب Z&Z Logistics',
    text: `كود التحقق الخاص بك هو: ${code}\n\nصالح لمدة 10 دقائق.\n\nإذا لم تطلب هذا الكود، تجاهل هذه الرسالة.`,
    html: `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:400px;margin:0 auto;padding:30px;border:1px solid #e2e8f0;border-radius:12px">
        <div style="text-align:center;margin-bottom:20px">
          <div style="background:#0b1f3a;color:#f59e0b;font-weight:900;font-size:22px;width:56px;height:56px;border-radius:14px;display:inline-flex;align-items:center;justify-content:center">Z&Z</div>
        </div>
        <h2 style="text-align:center;color:#0b1f3a;margin-bottom:8px">كود استرجاع الحساب</h2>
        <p style="text-align:center;color:#64748b;font-size:14px">أدخل هذا الكود في التطبيق لإعادة تعيين كلمة المرور</p>
        <div style="background:#f8fafc;border:2px solid #f59e0b;border-radius:12px;padding:20px;text-align:center;margin:24px 0">
          <span style="font-size:36px;font-weight:900;letter-spacing:10px;color:#0b1f3a">${code}</span>
        </div>
        <p style="text-align:center;color:#94a3b8;font-size:13px">صالح لمدة <b>10 دقائق</b></p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0">
        <p style="text-align:center;color:#cbd5e1;font-size:12px">إذا لم تطلب هذا الكود، تجاهل هذه الرسالة</p>
      </div>`
  });
}

module.exports = { sendCodeEmail };

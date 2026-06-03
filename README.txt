Z&Z Logistics - Real Website with Email Login

هذا ليس HTML فقط. هذه نسخة موقع حقيقي فيها:
- Node.js Backend
- تسجيل دخول برمز يصل إلى البريد
- جلسة دخول
- موقع شركة Z&Z

طريقة التشغيل على الكمبيوتر:
1. ثبت Node.js
2. افتح Terminal داخل المجلد
3. اكتب:
   npm install
4. انسخ .env.example إلى .env
5. ضع بيانات SMTP
6. شغل:
   npm start
7. افتح:
   http://localhost:3000

مهم جداً:
لإرسال البريد من Gmail تحتاج App Password وليس كلمة سر Gmail العادية.

للنشر على الإنترنت:
- ارفع المشروع إلى Render أو Railway أو VPS.
- ضع نفس متغيرات .env في إعدادات الاستضافة.

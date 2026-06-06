@echo off
title ZZ Logistics Server
cd /d "%~dp0"
echo.
echo  ====================================
echo   ZZ Logistics - جاري التشغيل...
echo  ====================================
echo.

if not exist node_modules (
  echo  جاري تثبيت المكتبات لاول مرة...
  npm install
  echo.
)

echo  السيرفر يعمل على: http://localhost:3000
echo  افتح المتصفح على هذا الرابط
echo.
echo  لايقاف السيرفر اضغط Ctrl+C
echo.
node server.js
pause

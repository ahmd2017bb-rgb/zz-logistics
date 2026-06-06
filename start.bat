@echo off
title Z&Z Logistics
echo.
echo  ============================================
echo   Z^&Z Logistics - جاري التشغيل...
echo  ============================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo  [!] Node.js غير مثبت على جهازك
    echo.
    echo  افتح هذا الرابط وثبت Node.js:
    echo  https://nodejs.org
    echo.
    pause
    exit
)

REM Install packages if node_modules missing
if not exist "node_modules\" (
    echo  [*] تثبيت المكتبات - انتظر قليلاً...
    npm install
    echo.
)

REM Start server in background and open browser
echo  [*] جاري تشغيل السيرفر...
start "" http://localhost:3000
npm start

#!/bin/bash
echo ""
echo " ============================================"
echo "  Z&Z Logistics - جاري التشغيل..."
echo " ============================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo " [!] Node.js غير مثبت - حمّله من: https://nodejs.org"
    exit 1
fi

# Install if needed
if [ ! -d "node_modules" ]; then
    echo " [*] تثبيت المكتبات..."
    npm install
fi

# Open browser and start server
echo " [*] جاري تشغيل السيرفر..."
(sleep 2 && open "http://localhost:3000" 2>/dev/null || xdg-open "http://localhost:3000" 2>/dev/null) &
npm start

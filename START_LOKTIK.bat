@echo off
title LOKTIK TICKETING PLATFORM - 1-CLICK LAUNCHER
color 0A
echo =================================================================
echo        LOKTIK.WEB.ID - EVENT TICKETING DIRECT LAUNCHER
echo =================================================================
echo.
echo [1/3] Menjalankan Server WhatsApp Bot (whatsapp-web.js - Port 5000)...
start "LOKTIK-WA-BOT" cmd /k "npm run bot"

echo.
echo [2/3] Menjalankan Server Web Frontend Vite (Port 3000)...
start "LOKTIK-VITE-WEB" cmd /k "npm run dev"

echo.
echo [3/3] Membuka Website LokTik di Browser...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo =================================================================
echo  [SUCCESS] LokTik Berhasil Dijalankan!
echo  - Frontend Web: http://localhost:3000
echo  - Akses Mobile (HP): http://192.168.1.7:3000
echo  - WA Bot Server: http://localhost:5000
echo =================================================================
echo.
pause

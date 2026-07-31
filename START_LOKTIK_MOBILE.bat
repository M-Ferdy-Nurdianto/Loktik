@echo off
title LOKTIK TICKETING PLATFORM - HP / MOBILE HTTPS LAUNCHER
color 0B
echo =================================================================
echo        LOKTIK.WEB.ID - HP / MOBILE HTTPS SECURE LAUNCHER
echo =================================================================
echo.
echo [1/3] Menjalankan Server WhatsApp Bot (Port 5000)...
start "LOKTIK-WA-BOT" cmd /k "npm run bot"

echo.
echo [2/3] Menjalankan Server Web Frontend Vite (Port 3000)...
start "LOKTIK-VITE-WEB" cmd /k "npm run dev"

echo.
echo [3/3] Menjalankan Cloudflare HTTPS Tunnel untuk Akses Kamera HP...
timeout /t 3 /nobreak >nul
start "LOKTIK-HTTPS-TUNNEL" cmd /k "echo Menyiapkan URL HTTPS untuk HP... && npm run tunnel"

echo.
echo =================================================================
echo  [SUCCESS] LokTik HP HTTPS Mode Berhasil Dijalankan!
echo  -----------------------------------------------------------------
echo  1. Buka jendela terminal "LOKTIK-HTTPS-TUNNEL".
echo  2. Salin URL HTTPS yang muncul (contoh: https://xxxx.trycloudflare.com).
echo  3. Buka URL HTTPS tersebut di Browser HP (Chrome / Safari).
echo  4. Izin Kamera & Fitur Scan Barcode Gate POS berjalan 100%% Lancar!
echo =================================================================
echo.
pause

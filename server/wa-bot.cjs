/**
 * LOKTIK AUTOMATIC WHATSAPP BOT SERVER (whatsapp-web.js)
 * CommonJS format (.cjs) with Automatic Local Chrome/Edge detection for Windows
 */

const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.WA_BOT_PORT || 5000;

// Auto-detect local Chrome / Edge / Brave executable on Windows
function findLocalExecutablePath() {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome-stable',
  ];

  for (const path of possiblePaths) {
    if (fs.existsSync(path)) {
      console.log(`📌 Bot WA Menggunakan Browser: ${path}`);
      return path;
    }
  }
  return process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
}

const executablePath = findLocalExecutablePath();

// Inisialisasi WhatsApp Client
const clientOptions = {
  authStrategy: new LocalAuth({ dataPath: './wa-session' }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
};

if (executablePath) {
  clientOptions.puppeteer.executablePath = executablePath;
}

const client = new Client(clientOptions);

client.on('qr', (qr) => {
  console.log('\n====================================================');
  console.log('SCAN QR CODE DIPERLUKAN UNTUK MENGHUBUNGKAN BOT WA LOKTIK:');
  console.log('====================================================\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ BOT WHATSAPP LOKTIK TERHUBUNG & SIAP MENGIRIM TIKET!');
});

client.on('authenticated', () => {
  console.log('🔑 Sesi WhatsApp Berhasil Diterima.');
});

client.on('auth_failure', (msg) => {
  console.error('❌ Gagal Autentikasi WhatsApp Bot:', msg);
});

// API Endpoint untuk Kirim Tiket + Gambar QR Code Otomatis
app.post('/api/send-ticket-wa', async (req, res) => {
  try {
    const { waNumber, guestName, eventName, orderId, totalPrice, ticketQrUrl, ticketCount, ticketDetails } = req.body;

    if (!waNumber) {
      return res.status(400).json({ success: false, message: 'Nomor WhatsApp wajib diisi.' });
    }

    const cleanNum = waNumber.replace(/[^0-9]/g, '');
    const chatId = cleanNum.startsWith('62') ? `${cleanNum}@c.us` : `62${cleanNum.substring(1)}@c.us`;

    const qtyText = ticketCount && Number(ticketCount) > 1 
      ? `- Jumlah Tiket: *${ticketCount} Tiket* (${ticketDetails || 'Tiket'})\n⚠️ *PENTING:* Kode / QR Code ini dapat di-scan sebanyak *${ticketCount}x* di gate venue (bisa sekaligus atau bertahap).`
      : `- Kategori Tiket: *${ticketDetails || 'Tiket Standard'}*`;

    const captionText = `Halo Kak *${guestName}*,

Tiket pesanan Anda untuk event *${eventName}* telah *LUNAS & DIVERIFIKASI!*

📋 *DETAIL TIKET:*
- Kode Tiket / Barcode: \`${orderId || 'LOKTIK'}\`
${qtyText}
- Total Bayar: Rp ${totalPrice ? Number(totalPrice).toLocaleString('id-ID') : 0}
- Status: LUNAS (Verified)

Gunakan gambar QR Code terlampir di pintu masuk venue saat penukaran gelang.

Terima Kasih!
- Panitia ${eventName} via LokTik.web.id`;

    if (ticketQrUrl) {
      const media = await MessageMedia.fromUrl(ticketQrUrl, { unsafeMime: true });
      await client.sendMessage(chatId, media, { caption: captionText });
    } else {
      await client.sendMessage(chatId, captionText);
    }

    console.log(`✉️ Tiket otomatis terkirim via whatsapp-web.js ke: ${chatId}`);
    return res.json({ success: true, message: 'Tiket berhasil terkirim via Bot WhatsApp!' });
  } catch (err) {
    console.error('⚠️ Gagal mengirim pesan WA:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    botState: client.info ? 'connected' : 'connecting',
    pushname: client.info?.pushname || null,
  });
});

client.on('disconnected', (reason) => {
  console.log('⚠️ WA Bot terputus, mencoba menghubungkan kembali... Alasan:', reason);
  client.initialize();
});

// Periodic Heartbeat ke Supabase DB 1 & DB 2 (setiap 6 jam)
const pingSupabaseKeepAlive = async () => {
  try {
    const db1Url = process.env.VITE_SUPABASE_URL || 'https://wptfkymsjrtrwyamsrhi.supabase.co';
    const db1Key = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwdGZreW1zanJ0cnd5YW1zcmhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwODM4ODksImV4cCI6MjEwMDY1OTg4OX0.M2H0mmzZ8V2JhCKL55o1BSIE7Y_ZPG0xzJZz1EEm61I';

    const db2Url = process.env.VITE_SUPABASE_ARCHIVE_URL || 'https://uvajdscwcojcvgbqvpig.supabase.co';
    const db2Key = process.env.VITE_SUPABASE_ARCHIVE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2YWpkc2N3Y29qY3ZnYnF2cGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0OTg4MDYsImV4cCI6MjEwMTA3NDgwNn0.YSGXdusLwS2ZmfkqHLEGpAaveIl-3D9_RtKV-t8pwjw';

    await fetch(`${db1Url}/rest/v1/system_keep_alive?select=id`, { headers: { apikey: db1Key, Authorization: `Bearer ${db1Key}` } });
    await fetch(`${db2Url}/rest/v1/system_keep_alive?select=id`, { headers: { apikey: db2Key, Authorization: `Bearer ${db2Key}` } });
    console.log('💓 Heartbeat Supabase DB 1 & DB 2 dari WA Bot Server sukses!');
  } catch (e) {
    console.warn('Keep-alive ping notice:', e.message);
  }
};

setInterval(pingSupabaseKeepAlive, 6 * 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`🚀 LokTik WhatsApp Bot Server berjalan di http://localhost:${PORT}`);
  pingSupabaseKeepAlive();
});

client.initialize();

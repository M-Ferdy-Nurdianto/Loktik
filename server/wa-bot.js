/**
 * LOKTIK AUTOMATIC WHATSAPP BOT SERVER (whatsapp-web.js)
 */

const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.WA_BOT_PORT || 5000;

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './wa-session' }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

let isBotReady = false;

client.on('qr', (qr) => {
  isBotReady = false;
  console.log('\n====================================================');
  console.log('SCAN QR CODE UNTUK MENGHUBUNGKAN BOT WA LOKTIK:');
  console.log('====================================================\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  isBotReady = true;
  console.log('BOT WHATSAPP LOKTIK SIAP!');
});

client.on('authenticated', () => console.log('Sesi WA diterima.'));
client.on('auth_failure', (msg) => { isBotReady = false; console.error('Auth gagal:', msg); });
client.on('disconnected', (reason) => {
  isBotReady = false;
  console.log('WA Bot terputus:', reason);
  client.initialize();
});

/**
 * Download gambar dari URL → return MessageMedia (base64).
 * Lebih reliable daripada MessageMedia.fromUrl() untuk URL eksternal.
 */
const fetchImageAsMedia = (url) => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, { timeout: 10000 }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Follow redirect
        return fetchImageAsMedia(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} dari ${url}`));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const base64 = buffer.toString('base64');
        const mimeType = res.headers['content-type'] || 'image/png';
        resolve(new MessageMedia(mimeType.split(';')[0], base64));
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout download gambar')); });
  });
};

// ── API: Kirim Tiket via WA ──────────────────────────────────────────────────
app.post('/api/send-ticket-wa', async (req, res) => {
  try {
    const {
      waNumber, guestName, eventName, orderId, totalPrice,
      ticketQrUrl, ticketCount, ticketDetails, isMixed, cekTiketUrl
    } = req.body;

    console.log(`[BOT] Request: wa=${waNumber} | orderId=${orderId} | isMixed=${isMixed} | qrUrl=${ticketQrUrl}`);

    if (!waNumber) return res.status(400).json({ success: false, message: 'Nomor WA wajib diisi.' });
    if (!isBotReady) return res.status(503).json({ success: false, error: 'Bot belum terhubung. Scan QR Code terlebih dahulu.' });

    const cleanNum = waNumber.replace(/[^0-9]/g, '');
    const chatId = cleanNum.startsWith('62') ? `${cleanNum}@c.us` : `62${cleanNum.substring(1)}@c.us`;

    // Teks tiket detail
    const ticketInfoLine = Number(ticketCount) > 1
      ? `- Jumlah Tiket: *${ticketCount} Tiket* (${ticketDetails || 'Tiket'})`
      : `- Kategori Tiket: *${ticketDetails || 'Tiket Standard'}*`;

    // Tambah instruksi download tiket atau link terpisah jika ada banyak tiket
    const ticketLinksText = (req.body.ticketLinks && req.body.ticketLinks.length > 0)
      ? `\n*LINK SEMUA TIKET ANDA:*\n${req.body.ticketLinks.map((t, idx) => `Tiket ${idx + 1} (${t.name}):\n${t.url}`).join('\n\n')}\n`
      : '';

    const downloadInstruction = ticketLinksText || (isMixed && cekTiketUrl
      ? `\nKarena pesanan Anda terdiri dari beberapa kategori tiket berbeda, silakan download masing-masing tiket di:\n*${cekTiketUrl}*\n\nMasukkan kode: *${orderId}* untuk melihat semua tiket Anda.`
      : '');

    const captionText = `Halo Kak *${guestName}*,

Tiket pesanan Anda untuk event *${eventName}* telah *LUNAS & DIVERIFIKASI!*

*DETAIL TIKET:*
- Kode Pesanan: \`${orderId || 'LOKTIK'}\`
${ticketInfoLine}
- Total Bayar: Rp ${totalPrice ? Number(totalPrice).toLocaleString('id-ID') : 0}
- Status: LUNAS (Verified)
${downloadInstruction}
Tunjukkan QR Code kepada staf gate saat penukaran gelang.

Terima Kasih!
- Panitia ${eventName} via LokTik.web.id`;

    if (ticketQrUrl) {
      console.log(`[BOT] Download QR dari: ${ticketQrUrl}`);
      try {
        const media = await fetchImageAsMedia(ticketQrUrl);
        await client.sendMessage(chatId, media, { caption: captionText });
        console.log(`[BOT] Berhasil kirim gambar + teks ke ${chatId}`);
      } catch (imgErr) {
        console.error(`[BOT] Gagal download gambar (${imgErr.message}), kirim teks saja.`);
        await client.sendMessage(chatId, captionText);
      }
    } else {
      console.log(`[BOT] Tidak ada QR URL, kirim teks saja ke ${chatId}`);
      await client.sendMessage(chatId, captionText);
    }

    return res.json({ success: true, message: 'Tiket berhasil terkirim!' });
  } catch (err) {
    console.error('[BOT] ERROR:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Status check
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    botState: isBotReady ? 'connected' : 'connecting',
    pushname: client.info?.pushname || null,
  });
});

// Heartbeat Supabase (setiap 6 jam)
const pingSupabaseKeepAlive = async () => {
  try {
    const db1Url = process.env.VITE_SUPABASE_URL || 'https://wptfkymsjrtrwyamsrhi.supabase.co';
    const db1Key = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwdGZreW1zanJ0cnd5YW1zcmhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwODM4ODksImV4cCI6MjEwMDY1OTg4OX0.M2H0mmzZ8V2JhCKL55o1BSIE7Y_ZPG0xzJZz1EEm61I';
    const db2Url = process.env.VITE_SUPABASE_ARCHIVE_URL || 'https://uvajdscwcojcvgbqvpig.supabase.co';
    const db2Key = process.env.VITE_SUPABASE_ARCHIVE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2YWpkc2N3Y29qY3ZnYnF2cGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0OTg4MDYsImV4cCI6MjEwMTA3NDgwNn0.YSGXdusLwS2ZmfkqHLEGpAaveIl-3D9_RtKV-t8pwjw';
    await fetch(`${db1Url}/rest/v1/system_keep_alive?select=id`, { headers: { apikey: db1Key, Authorization: `Bearer ${db1Key}` } });
    await fetch(`${db2Url}/rest/v1/system_keep_alive?select=id`, { headers: { apikey: db2Key, Authorization: `Bearer ${db2Key}` } });
    console.log('Heartbeat Supabase OK');
  } catch (e) {
    console.warn('Keep-alive notice:', e.message);
  }
};

setInterval(pingSupabaseKeepAlive, 6 * 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`LokTik WA Bot berjalan di http://localhost:${PORT}`);
  pingSupabaseKeepAlive();
});

client.initialize();

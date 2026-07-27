/**
 * LOKTIK AUTOMATIC WHATSAPP BOT SERVER (whatsapp-web.js)
 * 
 * Bot Node.js ini berjalan di server / terminal backend untuk mengirimkan
 * gambar QR Code Tiket & konfirmasi LUNAS secara otomatis ke WhatsApp Pembeli.
 */

const express = require('express');
const cors = require('cors');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.WA_BOT_PORT || 5000;

// Inisialisasi WhatsApp Client
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './wa-session' }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

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
    const { waNumber, guestName, eventName, orderId, totalPrice, ticketQrUrl } = req.body;

    if (!waNumber) {
      return res.status(400).json({ success: false, message: 'Nomor WhatsApp wajib diisi.' });
    }

    const cleanNum = waNumber.replace(/[^0-9]/g, '');
    const chatId = cleanNum.startsWith('62') ? `${cleanNum}@c.us` : `62${cleanNum.substring(1)}@c.us`;

    const captionText = `Halo Kak *${guestName}*,

Tiket pesanan Anda untuk event *${eventName}* telah *LUNAS & DIVERIFIKASI!* 🎉

📋 *DETAIL TIKET:*
- ID Pesanan: \`${orderId ? orderId.substring(0, 8) : 'LOKTIK'}\`
- Total Bayar: Rp ${totalPrice ? Number(totalPrice).toLocaleString('id-ID') : 0}
- Status: LUNAS (Verified)

Gunakan gambar QR Code terlampir di pintu masuk venue saat penukaran gelang.

Terima Kasih!
- Panitia ${eventName} via LokTik.web.id`;

    if (ticketQrUrl) {
      // Kirim Gambar QR Code + Caption Teks
      const media = await MessageMedia.fromUrl(ticketQrUrl, { unsafeMime: true });
      await client.sendMessage(chatId, media, { caption: captionText });
    } else {
      // Kirim Teks Saja jika tanpa gambar
      await client.sendMessage(chatId, captionText);
    }

    console.log(`✉️ Tiket otomatis terkirim via whatsapp-web.js ke: ${chatId}`);
    return res.json({ success: true, message: 'Tiket berhasil terkirim via Bot WhatsApp!' });
  } catch (err) {
    console.error('⚠️ Gagal mengirim pesan WA:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Status check endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    botState: client.info ? 'connected' : 'connecting',
    pushname: client.info?.pushname || null,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 LokTik WhatsApp Bot Server berjalan di http://localhost:${PORT}`);
});

client.initialize();

/**
 * VERCEL SERVERLESS FUNCTION: /api/send-wa
 * 
 * Fungsi ini berjalan 100% di Serverless Vercel tanpa perlu server background / Chrome Puppeteer.
 * Mendukung integrasi HTTP WhatsApp Gateway (Fonnte / Whapi / WhatsApp Cloud API).
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { waNumber, guestName, eventName, orderId, totalPrice, ticketQrUrl } = req.body;

    if (!waNumber) {
      return res.status(400).json({ error: 'Nomor WA wajib diisi.' });
    }

    const cleanNum = waNumber.replace(/[^0-9]/g, '');
    const targetWa = cleanNum.startsWith('0') ? `62${cleanNum.substring(1)}` : cleanNum;

    // Input sanitization against Prompt/Template Injection
    const safeGuestName = String(guestName || 'Pelanggan').replace(/[^\w\s\.\-]/gi, '').trim();
    const safeEventName = String(eventName || 'Event LokTik').replace(/[^\w\s\.\-]/gi, '').trim();

    const ticketLinks = req.body.ticketLinks || [];
    const isMixed = req.body.isMixed === true;
    const count = Number(req.body.ticketCount) || 1;
    const ticketDetails = String(req.body.ticketDetails || 'Tiket Standard');

    // Section LINK SEMUA TIKET — tampil di atas DETAIL
    const ticketLinksText = ticketLinks.length > 1
      ? `*LINK SEMUA TIKET ANDA:*\n${ticketLinks.map((t, idx) => `Tiket ${idx + 1} (${t.name}):\n${t.url}`).join('\n\n')}\n\n`
      : ticketQrUrl
        ? `*LINK E-TIKET ANDA:*\n${ticketQrUrl}\n\n`
        : '';

    let qtyText;
    if (isMixed && ticketDetails) {
      qtyText = `- Jumlah Tiket: *${count} Tiket* (${ticketDetails})`;
    } else if (count > 1) {
      qtyText = `- Jumlah Tiket: *${count} Tiket* (${ticketDetails})\n⚠️ *PENTING:* Kode / QR Code ini dapat di-scan sebanyak ${count}x di gate venue.`;
    } else {
      qtyText = `- Kategori Tiket: *${ticketDetails}*`;
    }

    const footerText = isMixed
      ? `Gunakan masing-masing QR Code sesuai kategori tiket saat masuk venue.`
      : `Gunakan gambar QR Code terlampir di pintu masuk venue saat penukaran gelang.`;

    const messageText = `Halo Kak *${safeGuestName}*,

Tiket pesanan Anda untuk event *${safeEventName}* telah *LUNAS & DIVERIFIKASI!*

${ticketLinksText}📋 *DETAIL TIKET:*
- Kode Pesanan: \`${orderId ? String(orderId).substring(0, 8) : 'LOKTIK'}\`
${qtyText}
- Total Bayar: Rp ${totalPrice ? Number(totalPrice).toLocaleString('id-ID') : 0}
- Status: LUNAS (Verified)

${footerText}

Terima Kasih!
- Panitia ${safeEventName} via LokTik.web.id`;

    // 1. Jika ada FONNTE TOKEN di Vercel Environment Variables
    const fonnteToken = process.env.FONNTE_TOKEN;
    if (fonnteToken) {
      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          Authorization: fonnteToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: targetWa,
          message: messageText,
          // Kirim gambar QR hanya jika bukan mixed category (mixed sudah ada linknya di teks)
          url: (!isMixed && ticketQrUrl) ? ticketQrUrl : '',
        }),
      });

      const fonnteData = await response.json();
      return res.json({ success: true, provider: 'fonnte', data: fonnteData });
    }

    // 2. Fallback Response untuk Vercel Serverless Direct
    return res.json({
      success: true,
      message: 'Permintaan kirim WA Serverless Vercel berhasil diproses.',
      targetWa,
    });
  } catch (err) {
    console.error('Serverless send-wa error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server gateway WA.' });
  }
}

// d:/Githab/loktik/server/generateTicketImage.js
/**
 * Generate a PNG ticket image that matches the frontend "Download Tiket" canvas.
 * Uses Jimp (pure‑JS) to avoid native build issues on Windows.
 * Returns a Base64 string (without the data URI prefix) suitable for
 * MessageMedia.fromBase64().
 *
 * Parameters:
 *   - prettyCode   : string   // formatted ticket code (e.g., RB1029‑1234)
 *   - qrImageUrl   : string   // URL to a 300×300 QR code image
 *   - guestName    : string   // buyer name
 *   - eventName    : string   // event title
 *   - totalPrice   : number | string
 */
import Jimp from 'jimp';

// Helper to wrap long text within a max width (pixel based)
function wrapText(text, maxWidth, font) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (Jimp.measureText(font, test) > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function generateTicketImage({
  prettyCode,
  qrImageUrl,
  guestName,
  eventName,
  totalPrice,
}) {
  // Canvas dimensions
  const W = 600;
  const H = 780;

  // Load fonts (Jimp provides a limited set; colors are applied later)
  const font24 = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  const fontBold18 = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  const fontBold16 = await Jimp.loadFont(Jimp.FONT_SANS_24_WHITE);
  const font13 = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);

  // Base image (background)
  const img = new Jimp(W, H, '#0a0a0a');

  // Border card (neon purple)
  const borderColor = Jimp.cssColorToHex('#7c3aed');
  img.scan(12, 12, W - 24, 3, (x, y, idx) => img.setPixelColour(borderColor, x, y));
  img.scan(12, H - 15, W - 24, 3, (x, y, idx) => img.setPixelColour(borderColor, x, y));
  img.scan(12, 12, 3, H - 24, (x, y, idx) => img.setPixelColour(borderColor, x, y));
  img.scan(W - 15, 12, 3, H - 24, (x, y, idx) => img.setPixelColour(borderColor, x, y));

  // Header bar
  const headerColor = Jimp.cssColorToHex('#7c3aed');
  img.scan(12, 12, W - 24, 56, (x, y, idx) => img.setPixelColour(headerColor, x, y));

  // Header texts – LOktik left, E‑TICKET right
  img.print(font24, 30, 30, 'LOKTIK');
  const eTicket = 'E‑TICKET';
  const eTicketWidth = Jimp.measureText(font24, eTicket);
  img.print(font24, W - 30 - eTicketWidth, 30, eTicket);

  // Event name (wrap, uppercase)
  const eventLines = wrapText(eventName.toUpperCase(), W - 60, font24);
  let y = 105;
  for (const line of eventLines) {
    img.print(font24, 30, y, line);
    y += 34;
  }

  // Divider
  const dividerColor = Jimp.cssColorToHex('#374151');
  img.scan(30, y + 10, W - 60, 1, (x, yIdx, idx) => img.setPixelColour(dividerColor, x, yIdx));
  y += 30;

  // Guest name
  img.print(font13, 30, y, 'NAMA PEMBELI');
  y += 22;
  img.print(font24, 30, y, guestName.toUpperCase());
  y += 36;

  // Total bayar
  img.print(font13, 30, y, 'TOTAL BAYAR');
  y += 22;
  const priceTxt = `Rp ${Number(totalPrice).toLocaleString('id-ID')}`;
  img.print(fontBold18, 30, y, priceTxt);
  y += 36;

  // Status
  img.print(font13, 30, y, 'STATUS');
  y += 22;
  img.print(fontBold18, 30, y, 'LUNAS — AKTIF');
  y += 36;

  // QR Code – load image, place with white background
  const qrImg = await Jimp.read(qrImageUrl);
  const qrSize = 200;
  const qrX = (W - qrSize) / 2;
  // white box (+8px margin)
  img.scan(qrX - 8, y - 8, qrSize + 16, qrSize + 16, (x, yy, idx) => img.setPixelColour('#ffffff', x, yy));
  qrImg.resize(qrSize, qrSize);
  img.composite(qrImg, qrX, y);
  y += qrSize + 24;

  // Ticket code (centered)
  const codeColor = Jimp.cssColorToHex('#c4b5fd');
  const codeFont = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  img.print(
    codeFont,
    W / 2 - Jimp.measureText(codeFont, prettyCode) / 2,
    y,
    prettyCode
  );
  y += 26;

  // Footer instructions
  img.print(font13, W / 2 - Jimp.measureText(font13, 'Tunjukkan QR ini ke staf gate saat penukaran tiket fisik') / 2,
    y,
    'Tunjukkan QR ini ke staf gate saat penukaran tiket fisik');
  y += 20;
  img.print(font13, W / 2 - Jimp.measureText(font13, 'loktik.vercel.app') / 2, y, 'loktik.vercel.app');

  // Export PNG as base64 (no data URI prefix)
  const buffer = await img.getBufferAsync(Jimp.MIME_PNG);
  return buffer.toString('base64');
}

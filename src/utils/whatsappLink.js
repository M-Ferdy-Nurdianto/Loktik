/**
 * buildWhatsAppUrl — build link WhatsApp yang berfungsi di semua perangkat.
 *
 * Masalah lama: `https://wa.me/<nomor>` di desktop di-redirect ke
 * api.whatsapp.com lalu mencoba meluncurkan protocol handler `whatsapp://`.
 * Kalau WhatsApp Desktop/Android app tidak terdaftar sebagai handler di OS,
 * browser gagal dengan "Failed to launch 'whatsapp://...' because the scheme
 * does not have a registered handler" dan link tidak terbuka.
 *
 * Solusi: mobile pakai wa.me (buka app langsung), desktop pakai
 * web.whatsapp.com/send (buka di browser, tidak butuh protocol handler).
 *
 * @param {string} phone  Nomor internasional tanpa "+" (contoh: 6285765907580)
 * @param {string} [text] Teks pesan awal (opsional)
 * @returns {string}
 */
export const buildWhatsAppUrl = (phone, text = '') => {
  const cleanPhone = String(phone || '').replace(/[^0-9]/g, '');
  const isMobile = /Android|iPhone|iPad|iPod|webOS|Windows Phone/i.test(navigator.userAgent || '');
  const textQuery = text ? `text=${encodeURIComponent(text)}` : '';

  if (isMobile) {
    return `https://wa.me/${cleanPhone}${textQuery ? `?${textQuery}` : ''}`;
  }
  return `https://web.whatsapp.com/send/?phone=${cleanPhone}${textQuery ? `&${textQuery}` : ''}`;
};

/**
 * Formats a numeric value into Indonesian Rupiah (IDR) currency format.
 */
export const formatRupiah = (amount) => {
  if (amount === null || amount === undefined) return 'Rp0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Formats an ISO date string into Indonesian readable format.
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

/**
 * Formats ISO date string into short time string (e.g. 19:00 WIB).
 */
export const formatTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }) + ' WIB';
};

/**
 * Formats ISO date string into full timestamp string (e.g. 27 Jul 2026, 10:48 WIB).
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${formattedDate}, ${formattedTime} WIB`;
};

/**
 * Generates a clean 4-digit cantik redeem code based on event initials (e.g. RB1029).
 */
export const generatePrettyRedeemCode = (eventName, seed = null) => {
  const cleanName = (eventName || 'LT').trim().toUpperCase();
  const words = cleanName.split(/\s+/).filter(Boolean);

  let prefix = 'LT';
  if (words.length >= 2) {
    prefix = `${words[0][0]}${words[1][0]}`;
  } else if (cleanName.length >= 2) {
    prefix = cleanName.substring(0, 2);
  }

  const cleanPrefix = prefix.replace(/[^A-Z]/g, 'L');
  
  // Use seed if provided, or generate a clean 4-digit number between 1000 and 9999
  const num = seed ? Math.abs(seed) % 9000 + 1000 : Math.floor(1000 + Math.random() * 9000);
  return `${cleanPrefix}${num}`;
};

/**
 * Formats per-ticket barcode UUID into a short gate-friendly code.
 */
export const formatTicketUnitCode = (barcodeUuid, fallbackId = null) => {
  if (barcodeUuid) {
    return String(barcodeUuid).replace(/-/g, '').substring(0, 7).toUpperCase();
  }

  if (fallbackId) {
    return `TK-${String(fallbackId).replace(/-/g, '').slice(-4).toUpperCase()}`;
  }

  return 'TIKET';
};

/**
 * Normalizes payment method labels so reports can group equivalent values reliably.
 */
export const normalizePaymentMethod = (paymentMethod, options = {}) => {
  const { isOts = false, fallback = null } = options;
  const raw = String(paymentMethod || '').trim();

  if (!raw) {
    if (fallback) return fallback;
    return isOts ? 'OTS (Tunai/QRIS)' : 'Tidak Tercatat';
  }

  const normalized = raw.toLowerCase();

  if (normalized.includes('qris')) return 'QRIS';
  if (normalized === 'tf' || normalized.includes('transfer') || normalized.includes('bank')) return 'Transfer Bank';
  if (normalized.includes('cash') || normalized.includes('tunai')) return 'CASH';

  return raw;
};

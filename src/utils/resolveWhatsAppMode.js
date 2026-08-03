/**
 * resolveWhatsAppMode — SINGLE SOURCE OF TRUTH untuk mode pengiriman WhatsApp.
 *
 * Business Rule:
 *   BOT AKTIF (botAccessBonus = true):
 *     → 'bot'   — unlimited, tidak cek kuota, tidak kurangi kuota
 *
 *   BOT TIDAK AKTIF + wa_quota > 0:
 *     → 'quota' — gunakan sistem kuota, kurangi setiap kirim
 *
 *   BOT TIDAK AKTIF + wa_quota = 0:
 *     → 'manual' — fallback ke WA manual
 *
 * Source of truth HANYA dari session user yang dipass langsung.
 * TIDAK membaca localStorage sebagai fallback — data sesi EO harus selalu
 * up-to-date saat login. Jika session stale, EO wajib re-login.
 *
 * @param {object|null} user  — user object dari useAuth()
 * @returns {'bot'|'quota'|'manual'}
 */
export const resolveWhatsAppMode = (user) => {
  if (!user) return 'manual';

  // Admin selalu punya akses penuh (bypass semua cek)
  if (user.role === 'admin') return 'bot';

  // Staff tidak mengirim WA langsung
  if (user.role !== 'eo') return 'manual';

  // Baca dari session — ini SATU-SATUNYA source of truth
  if (user.botAccessBonus === true) return 'bot';
  if ((user.wa_quota ?? 0) > 0) return 'quota';

  return 'manual';
};

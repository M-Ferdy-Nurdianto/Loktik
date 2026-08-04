/**
 * resolveWhatsAppMode — SINGLE SOURCE OF TRUTH untuk mode pengiriman WhatsApp.
 *
 * Business Rule:
 *
 *   BOT AKTIF (botAccessBonus = true) + wa_quota = 0:
 *     → 'bot'    — unlimited, tidak cek kuota, tidak kurangi kuota.
 *                  Admin set bot aktif tanpa mengisi kuota numerik.
 *
 *   BOT AKTIF (botAccessBonus = true) + wa_quota > 0:
 *     → 'quota'  — bot aktif DENGAN kuota terbatas. Kuota dikurangi setiap kirim.
 *                  Admin set bot aktif + top-up kuota numerik.
 *
 *   BOT TIDAK AKTIF + wa_quota > 0:
 *     → 'quota'  — sistem kuota saja, kurangi setiap kirim.
 *
 *   BOT TIDAK AKTIF + wa_quota = 0:
 *     → 'manual' — fallback ke WA manual.
 *
 * Dengan kata lain:
 *   - 'bot' (unlimited) = botAccessBonus AND kuota = 0
 *   - 'quota'           = ada kuota numerik (wa_quota > 0), dengan atau tanpa bot flag
 *   - 'manual'          = tidak ada bot, tidak ada kuota
 *
 * Source of truth HANYA dari session user yang dipass langsung.
 *
 * @param {object|null} user  — user object dari useAuth()
 * @returns {'bot'|'quota'|'manual'}
 */
export const resolveWhatsAppMode = (user) => {
  if (!user) return 'manual';

  // Admin selalu punya akses penuh
  if (user.role === 'admin') return 'bot';

  // Staff tidak mengirim WA langsung
  if (user.role !== 'eo') return 'manual';

  const hasBot   = user.botAccessBonus === true;
  const hasQuota = (user.wa_quota ?? 0) > 0;

  // Kuota numerik selalu menang — menunjukkan mode berbayar terbatas
  if (hasQuota) return 'quota';

  // Bot aktif tapi tidak ada kuota numerik → unlimited
  if (hasBot) return 'bot';

  return 'manual';
};

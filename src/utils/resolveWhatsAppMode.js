/**
 * resolveWhatsAppMode — SINGLE SOURCE OF TRUTH untuk mode pengiriman WhatsApp.
 *
 * Business Rule (semua bot berbasis kuota — tidak ada unlimited):
 *
 *   bot_access_bonus = true + wa_quota > 0:
 *     → 'quota'  — bot aktif dengan kuota. Kuota dikurangi setiap kirim.
 *
 *   bot_access_bonus = true + wa_quota = 0:
 *     → 'manual' — bot tidak bisa digunakan karena kuota habis. Fallback ke WA manual.
 *
 *   bot_access_bonus = false + wa_quota > 0:
 *     → 'quota'  — sistem kuota saja, kurangi setiap kirim.
 *
 *   bot_access_bonus = false + wa_quota = 0:
 *     → 'manual' — fallback ke WA manual.
 *
 * Dengan kata lain: bot WAJIB ada kuota untuk bisa beroperasi.
 * Mode 'bot' (unlimited) dihapus — tidak digunakan lagi.
 *
 * Source of truth HANYA dari session user yang dipass langsung.
 *
 * @param {object|null} user  — user object dari useAuth()
 * @returns {'quota'|'manual'}
 */
export const resolveWhatsAppMode = (user) => {
  if (!user) return 'manual';

  // Admin selalu punya akses penuh (pakai quota mode)
  if (user.role === 'admin') return 'quota';

  // Staff tidak mengirim WA langsung
  if (user.role !== 'eo') return 'manual';

  const hasQuota = (user.wa_quota ?? 0) > 0;

  // Bot aktif hanya jika ada kuota — tidak ada mode unlimited
  if (hasQuota) return 'quota';

  return 'manual';
};

import { supabase } from './supabase';

/**
 * apiEo.js — SINGLE SOURCE OF TRUTH untuk manajemen akun EO.
 *
 * Semua operasi CRUD akun EO dilakukan ke tabel `eo_accounts` di Supabase.
 * TIDAK ada localStorage sebagai primary store — localStorage hanya untuk session cache.
 */

/**
 * Ambil semua akun EO dari Supabase.
 * @returns {Promise<Array>}
 */
export const getAllEoAccounts = async () => {
  const { data, error } = await supabase
    .from('eo_accounts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

/**
 * Buat akun EO baru di Supabase.
 * @param {Object} payload
 * @returns {Promise<Object>} EO yang baru dibuat.
 */
export const createEoAccount = async (payload) => {
  const cleanUsername = (payload.name || '').trim().toLowerCase();

  // Cek duplikat username
  const { data: existing } = await supabase
    .from('eo_accounts')
    .select('id')
    .ilike('name', cleanUsername)
    .maybeSingle();

  if (existing) {
    throw new Error(`Username EO "${payload.name}" sudah terdaftar! Gunakan nama lain.`);
  }

  const newEo = {
    name: payload.name.trim(),
    wa: (payload.wa || '').replace(/[^0-9]/g, ''),
    password: payload.password.trim(),
    status: 'active',
    subscription_plan: payload.subscriptionPlan || '1_month',
    subscription_expires_at: payload.subscriptionExpiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    bot_access_bonus: false,
    wa_quota: 0,
    wa_messages_sent: 0,
  };

  const { data, error } = await supabase
    .from('eo_accounts')
    .insert([newEo])
    .select()
    .single();

  if (error) throw new Error(error.message || 'Gagal membuat akun EO.');
  return data;
};

/**
 * Update status EO (active / suspended).
 * @param {string} eoId
 * @param {'active'|'suspended'} newStatus
 * @returns {Promise<Object>}
 */
export const updateEoStatus = async (eoId, newStatus) => {
  const { data, error } = await supabase
    .from('eo_accounts')
    .update({ status: newStatus })
    .eq('id', eoId)
    .select()
    .single();

  if (error) throw new Error(error.message || 'Gagal mengubah status EO.');
  return data;
};

/**
 * Toggle bot_access_bonus untuk EO.
 * @param {string} eoId
 * @param {boolean} enable
 * @returns {Promise<Object>}
 */
export const toggleEoBotBonus = async (eoId, enable) => {
  const { data, error } = await supabase
    .from('eo_accounts')
    .update({ bot_access_bonus: enable })
    .eq('id', eoId)
    .select()
    .single();

  if (error) throw new Error(error.message || 'Gagal mengubah status bot EO.');
  return data;
};

/**
 * Top-up kuota WA EO via RPC (atomic).
 * Juga otomatis set bot_access_bonus = true saat top-up pertama.
 * @param {string} eoId
 * @param {number} quotaAmount
 * @returns {Promise<Object>}
 */
export const topUpEoWaQuota = async (eoId, quotaAmount) => {
  if (!eoId) return { success: false, message: 'EO ID required' };
  try {
    const { data, error } = await supabase.rpc('top_up_wa_quota', {
      target_eo_id: eoId,
      quota_amount: parseInt(quotaAmount, 10) || 0,
    });
    if (error) throw error;
    const res = Array.isArray(data) ? data[0] : data;
    return {
      success: res?.success ?? true,
      newQuota: res?.new_quota ?? 0,
      message: res?.message || 'Top-up kuota berhasil',
    };
  } catch (err) {
    console.error('topUpEoWaQuota error:', err);
    return { success: false, message: err.message };
  }
};

/**
 * Update paket langganan EO.
 * @param {string} eoId
 * @param {string} newPlan
 * @param {string} newExpiresAt  ISO date string
 * @returns {Promise<Object>}
 */
export const updateEoSubscription = async (eoId, newPlan, newExpiresAt) => {
  const { data, error } = await supabase
    .from('eo_accounts')
    .update({
      subscription_plan: newPlan,
      subscription_expires_at: newExpiresAt,
    })
    .eq('id', eoId)
    .select()
    .single();

  if (error) throw new Error(error.message || 'Gagal memperbarui paket EO.');
  return data;
};

/**
 * Hapus akun EO permanen dari Supabase.
 * @param {string} eoId
 * @returns {Promise<boolean>}
 */
export const deleteEoAccount = async (eoId) => {
  const { error } = await supabase
    .from('eo_accounts')
    .delete()
    .eq('id', eoId);

  if (error) throw new Error(error.message || 'Gagal menghapus akun EO.');
  return true;
};

/**
 * Potong kuota WA EO secara atomik di Supabase setelah bot berhasil kirim pesan.
 * Menggunakan tabel eo_accounts (bukan eo_profiles).
 * @param {string} eoId  — UUID dari eo_accounts.id
 * @param {number} count — jumlah pesan yang dikirim (default 1)
 * @returns {Promise<{success: boolean, remainingQuota: number, totalSent: number, message: string}>}
 */
export const deductWaQuota = async (eoId, count = 1) => {
  if (!eoId) return { success: false, message: 'EO ID required' };
  try {
    const { data, error } = await supabase.rpc('deduct_wa_quota_accounts', {
      target_eo_id: eoId,
      messages_count: count,
    });
    if (error) throw error;
    const res = Array.isArray(data) ? data[0] : data;
    return {
      success: res?.success ?? false,
      remainingQuota: res?.remaining_quota ?? 0,
      totalSent: res?.total_sent ?? 0,
      message: res?.message || '',
    };
  } catch (err) {
    console.error('deductWaQuota error:', err);
    return { success: false, message: err.message };
  }
};

/**
 * Reset kuota WA EO ke 0 (wa_quota = 0, wa_messages_sent tidak diubah).
 * Dipakai admin jika top-up kepencet atau EO batal bayar.
 * @param {string} eoId
 * @returns {Promise<Object>} row yang diupdate
 */
export const resetEoWaQuota = async (eoId) => {
  const { data, error } = await supabase
    .from('eo_accounts')
    .update({ wa_quota: 0 })
    .eq('id', eoId)
    .select()
    .single();

  if (error) throw new Error(error.message || 'Gagal mereset kuota WA EO.');
  return data;
};

/**
 * Autentikasi EO dari Supabase berdasarkan username + password.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{success: boolean, eo?: Object, message?: string}>}
 */
export const authenticateEo = async (username, password) => {
  const cleanUsername = (username || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  const { data, error } = await supabase
    .from('eo_accounts')
    .select('*')
    .ilike('name', cleanUsername)
    .maybeSingle();

  if (error) {
    console.error('authenticateEo DB error:', error.message);
    return { success: false, message: 'Terjadi kesalahan sistem. Coba lagi.' };
  }

  if (!data) {
    return { success: false, message: 'Username / Password salah!' };
  }

  const passwordMatch =
    data.password.trim() === cleanPassword ||
    data.password.trim().toLowerCase() === cleanPassword.toLowerCase();

  if (!passwordMatch) {
    return { success: false, message: 'Username / Password salah!' };
  }

  if (data.status === 'suspended') {
    return { success: false, message: 'Akun EO Anda saat ini sedang di-Soft Lock oleh Admin Platform.' };
  }

  return { success: true, eo: data };
};

// Legacy export untuk backward compatibility dengan apiAdmin.js
export const toggleBot = toggleEoBotBonus;

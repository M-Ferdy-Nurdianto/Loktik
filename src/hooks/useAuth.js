import { useState, useEffect } from 'react';
import { authenticateStaff } from '../services/apiStaff';
import { authenticateEo } from '../services/apiEo';

/**
 * useAuth — SINGLE SOURCE OF TRUTH untuk autentikasi seluruh role.
 *
 * Role hierarchy:
 *   admin  → hardcoded platform owner (tidak ada di DB)
 *   eo     → dari tabel eo_accounts di Supabase
 *   staff  → dari tabel staff_accounts di Supabase
 *
 * Session storage:
 *   loktik_admin_session  → hanya admin platform owner
 *   loktik_eo_session     → EO dan Staff (role field membedakan)
 *
 * TIDAK ADA localStorage sebagai primary data store untuk akun EO.
 * loktik_eo_accounts TIDAK digunakan sebagai auth source of truth.
 */

const SESSION_KEYS = {
  admin: 'loktik_admin_session',
  eo: 'loktik_eo_session',
};

const readSession = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    localStorage.removeItem(key);
    return null;
  }
};

const resolveActiveSession = () => {
  let currentUser = null;
  let latestTime = 0;

  for (const key of Object.values(SESSION_KEYS)) {
    const parsed = readSession(key);
    if (parsed) {
      const time = new Date(parsed.loggedInAt || 0).getTime();
      if (time > latestTime) {
        currentUser = parsed;
        latestTime = time;
      }
    }
  }

  return currentUser;
};

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(resolveActiveSession());
    setLoading(false);
  }, []);

  const refreshUser = () => {
    setUser(resolveActiveSession());
  };

  /**
   * Login universal — mencoba secara berurutan:
   * 1. Admin platform owner (hardcoded, satu akun)
   * 2. Staff accounts dari Supabase (PIN 4-digit atau username/password)
   * 3. EO accounts dari Supabase
   */
  const login = async (username, password) => {
    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    // ── 1. Admin Platform Owner ──────────────────────────────────────────────
    if (cleanUsername === 'broferadm' && cleanPassword === 'FerADM') {
      const adminData = {
        id: 'admin-01',
        username: 'BroFerADM',
        role: 'admin',
        name: 'Bro Ferdy Admin (Platform Owner)',
        loggedInAt: new Date().toISOString(),
      };
      localStorage.setItem(SESSION_KEYS.admin, JSON.stringify(adminData));
      setUser(adminData);
      return { success: true, role: 'admin', redirectTo: '/admin/dashboard' };
    }

    // ── 2. Staff Accounts dari Supabase ──────────────────────────────────────
    // Dicek SEBELUM EO agar PIN 4-digit staf tidak ter-intercept oleh EO auth
    const staffAuthRes = await authenticateStaff(cleanUsername, cleanPassword);
    if (staffAuthRes.success && staffAuthRes.staff) {
      const staff = staffAuthRes.staff;
      const staffData = {
        id: staff.id,
        username: staff.username,
        name: staff.name,
        role: 'staff',
        eo_username: staff.eo_username,
        event_id: staff.event_id,
        event_slug: staff.event_slug,
        permissions: staff.permissions,
        loggedInAt: new Date().toISOString(),
      };
      localStorage.setItem(SESSION_KEYS.eo, JSON.stringify(staffData));
      setUser(staffData);

      let targetSlug = staff.event_slug;
      if (!targetSlug || targetSlug === 'all-events' || targetSlug === 'all') {
        targetSlug = 'nama-fest-2026-0260';
      }

      return {
        success: true,
        role: 'staff',
        redirectTo: `/gate/${targetSlug}`,
      };
    }

    // ── 3. EO Accounts dari Supabase ─────────────────────────────────────────
    const eoAuthRes = await authenticateEo(cleanUsername, cleanPassword);
    if (eoAuthRes.success && eoAuthRes.eo) {
      const eo = eoAuthRes.eo;
      const eoData = {
        id: eo.id,
        username: eo.name,
        name: eo.name,
        role: 'eo',
        wa: eo.wa,
        subscriptionPlan: eo.subscription_plan || '1_month',
        subscriptionStatus: eo.status,
        subscriptionExpiresAt: eo.subscription_expires_at || null,
        botAccessBonus: Boolean(eo.bot_access_bonus),
        wa_quota: eo.wa_quota ?? 0,
        wa_messages_sent: eo.wa_messages_sent ?? 0,
        loggedInAt: new Date().toISOString(),
      };
      localStorage.setItem(SESSION_KEYS.eo, JSON.stringify(eoData));
      setUser(eoData);
      return { success: true, role: 'eo', redirectTo: '/eo/dashboard' };
    }

    if (eoAuthRes.message) {
      return { success: false, message: eoAuthRes.message };
    }

    return {
      success: false,
      message: 'Username / Password salah! Gunakan akun EO atau Akun Staf.',
    };
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEYS.admin);
    localStorage.removeItem(SESSION_KEYS.eo);
    // Bersihkan key lama jika masih ada
    localStorage.removeItem('loktik_user_session');
    setUser(null);
  };

  return { user, loading, login, logout, refreshUser };
};

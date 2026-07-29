import { useState, useEffect } from 'react';
import { authenticateStaff } from '../services/apiStaff';

/**
 * Custom Hook supporting Admin, Dynamic EO, and Staff Accounts Login
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('loktik_user_session');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('loktik_user_session');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();
    const cleanPasswordLower = cleanPassword.toLowerCase();

    // 1. Check Admin Credentials (BroFerADM / FerADM)
    if (cleanUsername === 'broferadm' && (cleanPassword === 'FerADM' || cleanPasswordLower === 'feradm')) {
      const adminData = {
        id: 'admin-01',
        username: 'BroFerADM',
        role: 'admin',
        name: 'Bro Ferdy Admin (Platform Owner)',
        loggedInAt: new Date().toISOString(),
      };
      localStorage.setItem('loktik_user_session', JSON.stringify(adminData));
      setUser(adminData);
      return { success: true, role: 'admin', redirectTo: '/admin/dashboard' };
    }

    // 2. Check Staff Accounts created by EO (Prioritized)
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
      localStorage.setItem('loktik_user_session', JSON.stringify(staffData));
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

    // 3. Check Fixed EO Credentials (eo_lokal / password123 & abin / 1234)
    if (
      (cleanUsername === 'eo_lokal' && (cleanPassword === 'password123' || cleanPasswordLower === 'password123')) ||
      (cleanUsername === 'abin' && (cleanPassword === '1234' || cleanPasswordLower === '1234'))
    ) {
      const eoUserData = {
        id: cleanUsername === 'abin' ? 'eo-abin' : 'eo-demo',
        username: cleanUsername === 'abin' ? 'abin' : 'eo_lokal',
        role: 'eo',
        name: cleanUsername === 'abin' ? 'Abin Event Panitia' : 'EO Komunitas Lokal',
        subscriptionStatus: 'active',
        loggedInAt: new Date().toISOString(),
      };
      localStorage.setItem('loktik_user_session', JSON.stringify(eoUserData));
      setUser(eoUserData);
      return { success: true, role: 'eo', redirectTo: '/eo/dashboard' };
    }

    // 4. Check Dynamic EO Accounts created in Admin Dashboard
    const dynamicAccounts = JSON.parse(localStorage.getItem('loktik_eo_accounts') || '[]');
    const matchedEo = dynamicAccounts.find(
      (acc) =>
        (acc.name || '').trim().toLowerCase() === cleanUsername ||
        (acc.id || '').trim().toLowerCase() === cleanUsername
    );

    if (matchedEo && ((matchedEo.password || '').trim() === cleanPassword || (matchedEo.password || '').trim().toLowerCase() === cleanPasswordLower)) {
      if (matchedEo.status === 'suspended') {
        return {
          success: false,
          message: 'Akun EO Anda saat ini sedang di-Soft Lock oleh Admin Platform.',
        };
      }

      const eoUserData = {
        id: matchedEo.id,
        username: matchedEo.name,
        role: 'eo',
        name: matchedEo.name,
        wa: matchedEo.wa,
        subscriptionStatus: matchedEo.status,
        expiresAt: matchedEo.expiresAt || null,
        loggedInAt: new Date().toISOString(),
      };
      localStorage.setItem('loktik_user_session', JSON.stringify(eoUserData));
      setUser(eoUserData);
      return { success: true, role: 'eo', redirectTo: '/eo/dashboard' };
    }

    return {
      success: false,
      message: 'Username / Password salah! Gunakan akun EO atau Akun Staf.',
    };
  };

  const logout = () => {
    localStorage.removeItem('loktik_user_session');
    setUser(null);
  };

  return { user, loading, login, logout };
};

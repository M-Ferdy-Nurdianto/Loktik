import { useState, useEffect } from 'react';

/**
 * Custom Hook supporting Admin and Dynamic EO Login across all devices (Desktop & Mobile)
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

  const login = (username, password) => {
    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    // 1. Check Admin Credentials (BroFerADM / FerADM)
    if (cleanUsername === 'broferadm' && cleanPassword === 'FerADM') {
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

    // 2. Check EO Credentials (eo_lokal / password123 & abin / 1234)
    if (
      (cleanUsername === 'eo_lokal' && cleanPassword === 'password123') ||
      (cleanUsername === 'abin' && cleanPassword === '1234')
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

    // 3. Check Dynamic EO Accounts created in Admin Dashboard
    const dynamicAccounts = JSON.parse(localStorage.getItem('loktik_eo_accounts') || '[]');
    const matchedEo = dynamicAccounts.find(
      (acc) =>
        acc.name.trim().toLowerCase() === cleanUsername ||
        acc.id.trim().toLowerCase() === cleanUsername
    );

    if (matchedEo && matchedEo.password === cleanPassword) {
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
        loggedInAt: new Date().toISOString(),
      };
      localStorage.setItem('loktik_user_session', JSON.stringify(eoUserData));
      setUser(eoUserData);
      return { success: true, role: 'eo', redirectTo: '/eo/dashboard' };
    }

    return {
      success: false,
      message: 'Username / Password salah! Gunakan tombol "LOGIN EO / PANITIA" di atas.',
    };
  };

  const logout = () => {
    localStorage.removeItem('loktik_user_session');
    setUser(null);
  };

  return { user, loading, login, logout };
};

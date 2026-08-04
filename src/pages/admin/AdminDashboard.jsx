import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Trash2, Power, MessageSquare, Plus, Inbox, Eye, EyeOff, KeyRound, CreditCard, X, Zap, Database, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { formatDate } from '../../utils/formatters';
import { topUpEoWaQuotaInDb } from '../../services/apiAdmin';
import {
  getAllEoAccounts,
  createEoAccount,
  updateEoStatus,
  deleteEoAccount,
  resetEoWaQuota,
} from '../../services/apiEo';
import { FactoryResetView } from '../../components/admin/FactoryResetView';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const getOneMonthExpiry = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // ── State: EO list — diambil dari Supabase, bukan localStorage ──────────
  const [eoAccounts, setEoAccounts] = useState([]);
  const [isLoadingEo, setIsLoadingEo] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // ── Fetch EO list dari Supabase ─────────────────────────────────────────
  const fetchEoAccounts = useCallback(async () => {
    console.log('[AdminDashboard] fetchEoAccounts: mulai fetch dari Supabase...');
    setIsLoadingEo(true);
    setLoadError(null);
    try {
      const data = await getAllEoAccounts();
      console.log('[AdminDashboard] fetchEoAccounts: berhasil, count =', data.length);
      // Normalise field names dari snake_case Supabase ke camelCase UI
      const normalised = data.map((row) => ({
        id: row.id,
        name: row.name,
        wa: row.wa,
        password: row.password,
        status: row.status,
        subscriptionPlan: row.subscription_plan || '1_month',
        subscriptionExpiresAt: row.subscription_expires_at || getOneMonthExpiry(),
        botAccessBonus: Boolean(row.bot_access_bonus),
        wa_quota: row.wa_quota ?? 0,
        wa_messages_sent: row.wa_messages_sent ?? 0,
      }));
      setEoAccounts(normalised);
      // Sync ke localStorage hanya sebagai cache — bukan source of truth
      localStorage.setItem('loktik_eo_accounts', JSON.stringify(normalised));
    } catch (err) {
      console.error('[AdminDashboard] fetchEoAccounts ERROR:', err);
      setLoadError(err.message || 'Gagal memuat daftar EO dari server.');
    } finally {
      setIsLoadingEo(false);
    }
  }, []);

  useEffect(() => {
    fetchEoAccounts();
  }, [fetchEoAccounts]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newEo, setNewEo] = useState({ name: '', wa: '', password: '', plan: '1_month' });
  const [showPasswords, setShowPasswords] = useState({});
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [selectedEo, setSelectedEo] = useState(null);
  const [topUpPackage, setTopUpPackage] = useState('1000');

  // ── State: delete confirmation modal ────────────────────────────────────
  const [deleteModal, setDeleteModal] = useState({ open: false, eoId: null, eoName: '', isDeleting: false, error: null });

  // ── State: reset kuota modal ─────────────────────────────────────────────
  const [resetQuotaModal, setResetQuotaModal] = useState({ open: false, eoId: null, eoName: '', currentQuota: 0, isResetting: false, error: null });

  const waPackages = [
    { value: '900',  label: 'PAKET UP TO 900 PESAN',   quota: 900,  price: 'Rp50.000' },
    { value: '9000', label: 'PAKET UP TO 9.000 PESAN',  quota: 9000, price: 'Rp70.000' },
  ];

  // Factory Reset Page View State
  const [showResetModal, setShowResetModal] = useState(false);

  const planOptions = [
    { value: 'test', label: 'TEST (1 HARI / MANUAL WA)' },
    { value: 'event_pass', label: 'EVENT PASS (Rp149RB / 1 EVENT + H+7)' },
    { value: '1_month', label: '1 BULAN (Rp199RB / MANUAL WA)' },
    { value: '3_months', label: '3 BULAN (Rp349RB / MANUAL WA)' },
    { value: '6_months', label: '6 BULAN PRO (Rp599RB / MANUAL WA)' },
  ];

  const calculateExpiryDate = (plan) => {
    const now = Date.now();
    let days = 30;
    if (plan === 'test') days = 1;
    else if (plan === 'event_pass') days = 30;
    else if (plan === '1_month') days = 30;
    else if (plan === '3_months') days = 90;
    else if (plan === '6_months') days = 180;
    return new Date(now + days * 24 * 60 * 60 * 1000).toISOString();
  };

  const handleToggleStatus = async (eoId) => {
    const acc = eoAccounts.find((a) => a.id === eoId);
    if (!acc) return;
    const nextStatus = acc.status === 'active' ? 'suspended' : 'active';
    console.log('[AdminDashboard] handleToggleStatus:', eoId, '->', nextStatus);

    // Optimistic UI update
    setEoAccounts((prev) =>
      prev.map((a) => (a.id === eoId ? { ...a, status: nextStatus } : a))
    );

    try {
      await updateEoStatus(eoId, nextStatus);
      console.log('[AdminDashboard] handleToggleStatus: berhasil update Supabase');
    } catch (err) {
      console.error('[AdminDashboard] handleToggleStatus ERROR:', err);
      // Rollback optimistic update
      setEoAccounts((prev) =>
        prev.map((a) => (a.id === eoId ? { ...a, status: acc.status } : a))
      );
      alert(`Gagal mengubah status EO: ${err.message}`);
    }
  };

  // ── Buka modal konfirmasi delete ────────────────────────────────────────
  const handleDeleteEo = (eoId) => {
    const acc = eoAccounts.find((a) => a.id === eoId);
    if (!acc) return;
    console.log('[AdminDashboard] handleDeleteEo: membuka modal konfirmasi untuk', eoId, acc.name);
    setDeleteModal({ open: true, eoId, eoName: acc.name, isDeleting: false, error: null });
  };

  // ── Eksekusi delete setelah konfirmasi ──────────────────────────────────
  const confirmDeleteEo = async () => {
    const { eoId, eoName } = deleteModal;
    console.log('[AdminDashboard] confirmDeleteEo: mulai hapus EO', eoId, eoName);

    setDeleteModal((prev) => ({ ...prev, isDeleting: true, error: null }));

    try {
      // 1. Hapus dari Supabase (source of truth)
      console.log('[AdminDashboard] confirmDeleteEo: memanggil deleteEoAccount(', eoId, ')...');
      await deleteEoAccount(eoId);
      console.log('[AdminDashboard] confirmDeleteEo: Supabase DELETE berhasil');

      // 2. Update React state — hapus dari daftar UI
      setEoAccounts((prev) => {
        const updated = prev.filter((acc) => acc.id !== eoId);
        // 3. Sync cache localStorage
        localStorage.setItem('loktik_eo_accounts', JSON.stringify(updated));
        console.log('[AdminDashboard] confirmDeleteEo: state dan localStorage diperbarui, sisa:', updated.length);
        return updated;
      });

      // 4. Invalidate session EO yang baru dihapus jika sedang login
      try {
        const savedSession = localStorage.getItem('loktik_eo_session');
        if (savedSession) {
          const parsedSession = JSON.parse(savedSession);
          const sessionMatchById = parsedSession.id === eoId;
          const sessionMatchByName = (parsedSession.username || parsedSession.name || '').toLowerCase() === eoName.toLowerCase();
          if (sessionMatchById || sessionMatchByName) {
            localStorage.removeItem('loktik_eo_session');
            console.log('[AdminDashboard] confirmDeleteEo: session EO yang dihapus dibersihkan dari localStorage');
          }
        }
      } catch (_) {}

      // 5. Tutup modal
      setDeleteModal({ open: false, eoId: null, eoName: '', isDeleting: false, error: null });
      console.log('[AdminDashboard] confirmDeleteEo: selesai, modal ditutup');

    } catch (err) {
      console.error('[AdminDashboard] confirmDeleteEo ERROR:', err);
      setDeleteModal((prev) => ({
        ...prev,
        isDeleting: false,
        error: err.message || 'Gagal menghapus akun EO. Coba lagi.',
      }));
    }
  };

  // ── Buka modal reset kuota ───────────────────────────────────────────────
  const handleResetQuota = (eoId) => {
    const acc = eoAccounts.find((a) => a.id === eoId);
    if (!acc) return;
    setResetQuotaModal({ open: true, eoId, eoName: acc.name, currentQuota: acc.wa_quota || 0, isResetting: false, error: null });
  };

  // ── Eksekusi reset kuota ─────────────────────────────────────────────────
  const confirmResetQuota = async () => {
    const { eoId, eoName } = resetQuotaModal;
    setResetQuotaModal((prev) => ({ ...prev, isResetting: true, error: null }));
    try {
      await resetEoWaQuota(eoId);
      // Update state lokal
      setEoAccounts((prev) => {
        const updated = prev.map((acc) =>
          acc.id === eoId ? { ...acc, wa_quota: 0 } : acc
        );
        localStorage.setItem('loktik_eo_accounts', JSON.stringify(updated));
        return updated;
      });
      // Invalidate session EO jika sedang login agar kuota di EO dashboard ikut terupdate
      try {
        const savedSession = localStorage.getItem('loktik_eo_session');
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          const isMatch = parsed.id === eoId ||
            (parsed.username || parsed.name || '').toLowerCase() === eoName.toLowerCase();
          if (isMatch) {
            localStorage.setItem('loktik_eo_session', JSON.stringify({ ...parsed, wa_quota: 0 }));
          }
        }
      } catch (_) {}
      setResetQuotaModal({ open: false, eoId: null, eoName: '', currentQuota: 0, isResetting: false, error: null });
    } catch (err) {
      setResetQuotaModal((prev) => ({ ...prev, isResetting: false, error: err.message || 'Gagal mereset kuota.' }));
    }
  };

  const handleAddEoSubmit = async (e) => {
    e.preventDefault();
    if (!newEo.name || !newEo.wa || !newEo.password) return;
    console.log('[AdminDashboard] handleAddEoSubmit: membuat EO baru', newEo.name);

    try {
      const created = await createEoAccount({
        name: newEo.name.trim(),
        wa: newEo.wa,
        password: newEo.password.trim(),
        subscriptionPlan: newEo.plan,
        subscriptionExpiresAt: calculateExpiryDate(newEo.plan),
      });
      console.log('[AdminDashboard] handleAddEoSubmit: EO berhasil dibuat, id =', created.id);

      const normalised = {
        id: created.id,
        name: created.name,
        wa: created.wa,
        password: created.password,
        status: created.status,
        subscriptionPlan: created.subscription_plan || '1_month',
        subscriptionExpiresAt: created.subscription_expires_at || getOneMonthExpiry(),
        botAccessBonus: Boolean(created.bot_access_bonus),
        wa_quota: created.wa_quota ?? 0,
        wa_messages_sent: created.wa_messages_sent ?? 0,
      };

      setEoAccounts((prev) => {
        const updated = [normalised, ...prev];
        localStorage.setItem('loktik_eo_accounts', JSON.stringify(updated));
        return updated;
      });
      setNewEo({ name: '', wa: '', password: '', plan: '1_month' });
      setShowAddModal(false);
    } catch (err) {
      console.error('[AdminDashboard] handleAddEoSubmit ERROR:', err);
      alert(err.message || 'Gagal membuat akun EO.');
    }
  };

  const togglePasswordVisibility = (eoId) => {
    setShowPasswords((prev) => ({ ...prev, [eoId]: !prev[eoId] }));
  };

  const openTopUpModal = (eo) => {
    setSelectedEo(eo);
    setTopUpPackage('900');
    setTopUpModalOpen(true);
  };

  const closeTopUpModal = () => {
    setTopUpModalOpen(false);
    setSelectedEo(null);
  };

  const handleTopUpSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEo) return;

    const selectedPackage = waPackages.find(p => p.value === topUpPackage);
    const quotaToAdd = selectedPackage ? selectedPackage.quota : parseInt(topUpPackage);

    try {
      // Jalankan RPC top-up ke Supabase — await agar tahu berhasil/gagal
      const result = await topUpEoWaQuotaInDb(selectedEo.id, quotaToAdd);
      if (!result.success) {
        alert(`Gagal top up: ${result.message}`);
        return;
      }

      const newQuota = result.newQuota ?? (selectedEo.wa_quota || 0) + quotaToAdd;

      // Update React state dengan nilai aktual dari DB
      // PENTING: tidak auto-set botAccessBonus=true agar tidak override keputusan admin
      setEoAccounts((prev) => {
        const updated = prev.map((acc) => {
          if (acc.id !== selectedEo.id) return acc;
          const updatedEo = {
            ...acc,
            wa_quota: newQuota,
            // botAccessBonus TIDAK diubah di sini — biarkan state sesuai DB
          };
          // Sync session EO yang sedang login — hanya update kuota, bukan botAccessBonus
          try {
            const savedUser = localStorage.getItem('loktik_eo_session');
            if (savedUser) {
              const parsedUser = JSON.parse(savedUser);
              const isMatch =
                parsedUser.id === acc.id ||
                (parsedUser.username || '').toLowerCase() === (acc.name || '').toLowerCase();
              if (isMatch) {
                localStorage.setItem(
                  'loktik_eo_session',
                  JSON.stringify({
                    ...parsedUser,
                    wa_quota: newQuota,
                    wa_messages_sent: updatedEo.wa_messages_sent || 0,
                    // botAccessBonus tidak diubah — ikuti nilai yang sudah ada di session
                  })
                );
              }
            }
          } catch (_) {}
          return updatedEo;
        });
        localStorage.setItem('loktik_eo_accounts', JSON.stringify(updated));
        return updated;
      });

      closeTopUpModal();
    } catch (err) {
      console.error('[AdminDashboard] handleTopUpSubmit ERROR:', err);
      alert(`Gagal top up kuota: ${err.message}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Modal JSX helpers — didefinisikan sebagai variabel bukan nested component
  // agar tidak menyebabkan React unmount/remount setiap render (stale closure bug di production)
  const deleteConfirmModalJsx = deleteModal.open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#111111] border border-brand-red/40 rounded-xl shadow-[0_0_60px_rgba(239,68,68,0.2)]">
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-red/20 border border-brand-red/40 rounded-lg">
              <Trash2 className="w-4 h-4 text-brand-red" />
            </div>
            <h3 className="text-sm font-black uppercase text-white tracking-tight">Hapus Akun EO</h3>
          </div>
          {!deleteModal.isDeleting && (
            <button
              type="button"
              onClick={() => setDeleteModal({ open: false, eoId: null, eoName: '', isDeleting: false, error: null })}
              className="p-1.5 text-neutral-500 hover:text-brand-red transition-colors rounded-lg hover:bg-brand-red/10"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-neutral-300 leading-relaxed">
            Apakah Anda yakin ingin menghapus akun EO{' '}
            <span className="font-black text-white">"{deleteModal.eoName}"</span> secara permanen?
          </p>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Akun akan dihapus dari database. Data event, order, staff, dan tiket yang dimiliki EO ini mungkin perlu dihapus secara terpisah via Factory Reset.
          </p>
          {deleteModal.error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-brand-red/10 border border-brand-red/30">
              <AlertCircle className="w-4 h-4 text-brand-red shrink-0 mt-0.5" />
              <p className="text-xs text-brand-red font-medium">{deleteModal.error}</p>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              size="md"
              fullWidth
              onClick={() => setDeleteModal({ open: false, eoId: null, eoName: '', isDeleting: false, error: null })}
              disabled={deleteModal.isDeleting}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="red"
              size="md"
              fullWidth
              onClick={confirmDeleteEo}
              disabled={deleteModal.isDeleting}
              className="font-black justify-center"
            >
              {deleteModal.isDeleting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menghapus...</>
              ) : (
                <><Trash2 className="w-4 h-4 mr-2" /> Ya, Hapus Permanen</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  const resetQuotaModalJsx = resetQuotaModal.open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#111111] border border-brand-yellow/40 rounded-xl shadow-[0_0_60px_rgba(234,179,8,0.15)]">
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-yellow/20 border border-brand-yellow/40 rounded-lg">
              <Zap className="w-4 h-4 text-brand-yellow" />
            </div>
            <h3 className="text-sm font-black uppercase text-white tracking-tight">Reset Kuota WA</h3>
          </div>
          {!resetQuotaModal.isResetting && (
            <button
              type="button"
              onClick={() => setResetQuotaModal({ open: false, eoId: null, eoName: '', currentQuota: 0, isResetting: false, error: null })}
              className="p-1.5 text-neutral-500 hover:text-white transition-colors rounded-lg hover:bg-neutral-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-neutral-300 leading-relaxed">
            Reset kuota WA untuk EO{' '}
            <span className="font-black text-white">"{resetQuotaModal.eoName}"</span>?
          </p>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900 border border-neutral-800">
            <div className="text-center flex-1">
              <p className="text-[9px] font-bold uppercase text-neutral-500 mb-1">Kuota saat ini</p>
              <p className="text-xl font-black font-mono text-brand-blue">
                {(resetQuotaModal.currentQuota || 0).toLocaleString('id-ID')}
              </p>
            </div>
            <div className="text-neutral-600 font-black text-lg">→</div>
            <div className="text-center flex-1">
              <p className="text-[9px] font-bold uppercase text-neutral-500 mb-1">Setelah reset</p>
              <p className="text-xl font-black font-mono text-brand-red">0</p>
            </div>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Kuota akan diset ke 0. Histori pesan terkirim tidak berubah. Gunakan jika top-up kepencet atau EO batal bayar.
          </p>
          {resetQuotaModal.error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-brand-red/10 border border-brand-red/30">
              <AlertCircle className="w-4 h-4 text-brand-red shrink-0 mt-0.5" />
              <p className="text-xs text-brand-red font-medium">{resetQuotaModal.error}</p>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              size="md"
              fullWidth
              onClick={() => setResetQuotaModal({ open: false, eoId: null, eoName: '', currentQuota: 0, isResetting: false, error: null })}
              disabled={resetQuotaModal.isResetting}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="yellow"
              size="md"
              fullWidth
              onClick={confirmResetQuota}
              disabled={resetQuotaModal.isResetting}
              className="font-black justify-center"
            >
              {resetQuotaModal.isResetting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mereset...</>
              ) : (
                <><Zap className="w-4 h-4 mr-2" /> Reset ke 0</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  if (showResetModal) {
    return (
      <div className="min-h-screen bg-[#050505]">
        <FactoryResetView onCloseView={() => setShowResetModal(false)} currentAdminUser={user} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Top Admin Bar */}
      <div className="border-b border-neutral-800 bg-[#0d0d0d] px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="green">PLATFORM OWNER ADMIN</Badge>
            <div className="h-4 w-px bg-neutral-700" />
            <h1 className="text-xl font-black tracking-tight text-white uppercase flex items-center">
              <KeyRound className="w-6 h-6 mr-3 text-brand-blue" /> MASTER ADMIN DASHBOARD
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowResetModal(true)}
              className="font-bold border-brand-red text-brand-red hover:bg-brand-red hover:text-white"
            >
              <Database className="w-4 h-4 mr-2" /> FACTORY RESET
            </Button>
            <Button variant="outline" onClick={logout} className="font-bold border-neutral-800 hover:bg-brand-red hover:text-white hover:border-brand-red">
              <LogOut className="w-4 h-4 mr-2" /> LOGOUT
            </Button>
          </div>
        </div>
      </div>


      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8 text-left">
      {/* Page Title */}
      <div className="space-y-1 pb-6 border-b border-neutral-800">
        <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
          Dasbor Utama
        </h1>
        <p className="text-sm text-neutral-500 font-medium">Platform Loktik — Manajemen Akun EO & Statistik</p>
      </div>

      {/* Admin Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total EO */}
        <div className="bg-[#121212] border border-neutral-800 rounded-xl p-5 space-y-3 hover:border-neutral-700 transition-colors">
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Total EO</p>
          <div>
            <p className="text-3xl font-black text-white leading-none">{eoAccounts.length}</p>
            <p className="text-xs font-bold text-neutral-500 mt-1">Terdaftar</p>
          </div>
        </div>
        {/* EO Aktif */}
        <div className="bg-[#121212] border border-brand-green/20 rounded-xl p-5 space-y-3 hover:border-brand-green/40 transition-colors">
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">EO Aktif</p>
          <div>
            <p className="text-3xl font-black text-brand-green leading-none">{eoAccounts.filter((a) => a.status === 'active').length}</p>
            <p className="text-xs font-bold text-neutral-500 mt-1">Berlangganan</p>
          </div>
        </div>
        {/* Soft-Locked */}
        <div className="bg-[#121212] border border-brand-red/20 rounded-xl p-5 space-y-3 hover:border-brand-red/30 transition-colors">
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Soft-Locked</p>
          <div>
            <p className="text-3xl font-black text-brand-red leading-none">{eoAccounts.filter((a) => a.status === 'suspended').length}</p>
            <p className="text-xs font-bold text-neutral-500 mt-1">Dinonaktifkan</p>
          </div>
        </div>
        {/* Kuota WA */}
        <div className="bg-[#121212] border border-brand-blue/20 rounded-xl p-5 space-y-3 hover:border-brand-blue/40 transition-colors">
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Kuota WA</p>
          <div>
            <p className="text-3xl font-black text-brand-blue leading-none">{eoAccounts.reduce((sum, a) => sum + (a.wa_quota || 0), 0).toLocaleString('id-ID')}</p>
            <p className="text-xs font-bold text-neutral-500 mt-1">Pesan tersisa</p>
          </div>
        </div>
        {/* Pesan Terkirim */}
        <div className="bg-[#121212] border border-brand-purple/20 rounded-xl p-5 space-y-3 hover:border-brand-purple/40 transition-colors">
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Terkirim</p>
          <div>
            <p className="text-3xl font-black text-brand-purple leading-none">{eoAccounts.reduce((sum, a) => sum + (a.wa_messages_sent || 0), 0).toLocaleString('id-ID')}</p>
            <p className="text-xs font-bold text-neutral-500 mt-1">Total pesan WA</p>
          </div>
        </div>
      </div>

      {/* Account Management Section */}
      <div className="bg-[#121212] border border-neutral-800 rounded-xl text-left overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-neutral-800 px-6 py-5 gap-3">
          <div>
            <h3 className="text-base font-black uppercase text-white tracking-tight">Manajemen Akun EO / Panitia</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Buat akun EO baru, tentukan durasi langganan &amp; soft lock akun.</p>
          </div>
          <Button variant="green" size="sm" onClick={() => setShowAddModal(!showAddModal)}>
            <Plus className="w-4 h-4 mr-1" /> {showAddModal ? 'Batal' : 'Tambah EO Baru'}
          </Button>
        </div>
        <div className="p-6 space-y-6">

        {/* Add EO Form */}
        {showAddModal && (
          <form onSubmit={handleAddEoSubmit} className="p-5 bg-neutral-900/60 rounded-xl border border-neutral-700 space-y-5">
            <h4 className="text-xs font-black uppercase text-brand-green tracking-widest flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              Buat Akun &amp; Password EO Baru
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Input
                label="Nama EO / Panitia *"
                required
                placeholder="Username / Nama EO..."
                value={newEo.name}
                onChange={(e) => setNewEo({ ...newEo, name: e.target.value })}
              />
              <Input
                label="No. WhatsApp EO *"
                required
                type="tel"
                inputMode="numeric"
                placeholder="Nomor WhatsApp..."
                value={newEo.wa}
                onChange={(e) => setNewEo({ ...newEo, wa: e.target.value.replace(/[^0-9]/g, '') })}
              />
              <Input
                label="Password untuk EO *"
                type="password"
                required
                placeholder="Password login..."
                value={newEo.password}
                onChange={(e) => setNewEo({ ...newEo, password: e.target.value })}
              />
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 block mb-1.5">Paket Langganan *</label>
                <CustomSelect
                  options={planOptions}
                  value={newEo.plan}
                  onChange={(val) => setNewEo({ ...newEo, plan: val })}
                  accentColor="green"
                />
              </div>
            </div>
            <Button type="submit" variant="green" size="sm" className="font-bold uppercase">
              Simpan &amp; Buat Akun EO
            </Button>
          </form>
        )}

        {/* EO List — card layout, no horizontal scroll */}
        {isLoadingEo ? (
          <div className="py-20 flex flex-col items-center gap-3 text-neutral-500">
            <Loader2 className="w-7 h-7 animate-spin" />
            <p className="text-xs font-bold uppercase tracking-wider">Memuat daftar EO...</p>
          </div>
        ) : loadError ? (
          <div className="py-10 flex flex-col items-center gap-3">
            <div className="flex items-start gap-2 p-4 rounded-xl bg-brand-red/10 border border-brand-red/30 max-w-md w-full">
              <AlertCircle className="w-4 h-4 text-brand-red shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-xs font-bold text-brand-red">{loadError}</p>
                <button
                  type="button"
                  onClick={fetchEoAccounts}
                  className="text-[11px] font-black uppercase text-brand-red underline hover:no-underline"
                >
                  Coba Lagi
                </button>
              </div>
            </div>
          </div>
        ) : eoAccounts.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto">
              <Inbox className="w-8 h-8 text-neutral-600" />
            </div>
            <div className="space-y-1">
              <p className="font-extrabold text-sm text-neutral-300 uppercase">Belum ada akun EO terdaftar</p>
              <p className="text-xs text-neutral-500 font-medium">Klik tombol "Tambah EO Baru" di atas untuk mendaftarkan akun.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {eoAccounts.map((eo) => {
              const hasQuota = (eo.wa_quota || 0) > 0;
              const planLabel =
                eo.subscriptionPlan === '6_months' ? '6 BULAN PRO' :
                eo.subscriptionPlan === '3_months' ? '3 BULAN' :
                eo.subscriptionPlan === 'event_pass' ? 'EVENT PASS' :
                eo.subscriptionPlan === 'test' ? 'TEST' : '1 BULAN';
              const planColor =
                eo.subscriptionPlan === '6_months' ? 'text-brand-blue' :
                eo.subscriptionPlan === '3_months' ? 'text-brand-purple' :
                eo.subscriptionPlan === 'event_pass' ? 'text-brand-blue' :
                eo.subscriptionPlan === 'test' ? 'text-neutral-400' : 'text-brand-yellow';
              const planBorder =
                eo.subscriptionPlan === '6_months' ? 'border-brand-blue/30' :
                eo.subscriptionPlan === '3_months' ? 'border-brand-purple/30' :
                eo.subscriptionPlan === 'event_pass' ? 'border-brand-blue/30' :
                eo.subscriptionPlan === 'test' ? 'border-neutral-700' : 'border-brand-yellow/30';

              return (
                <div key={eo.id} className={`bg-neutral-900/70 border rounded-xl p-4 space-y-3 transition-colors hover:bg-neutral-900 ${planBorder}`}>
                  {/* Row 1: ID + Nama + Status + Bot badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-brand-purple font-bold shrink-0">{eo.id}</span>
                        <span className="text-sm font-black text-white truncate">{eo.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[11px] font-mono text-brand-yellow font-bold">
                          {showPasswords[eo.id] ? eo.password : '••••••••'}
                        </span>
                        <button type="button" onClick={() => togglePasswordVisibility(eo.id)} className="text-neutral-500 hover:text-white transition-colors">
                          {showPasswords[eo.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant={eo.status === 'active' ? 'green' : 'red'} className="text-[9px] whitespace-nowrap">
                        {eo.status === 'active' ? 'AKTIF' : 'LOCKED'}
                      </Badge>
                      {hasQuota && (
                        <Badge variant="blue" className="text-[9px] whitespace-nowrap">BOT AKTIF</Badge>
                      )}
                    </div>
                  </div>

                  {/* Row 2: info grid 4-kolom */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* Paket */}
                    <div className="bg-neutral-950 rounded-lg p-2.5 space-y-0.5">
                      <p className="text-[9px] font-bold uppercase text-neutral-500">Paket</p>
                      <p className={`text-xs font-black uppercase ${planColor}`}>{planLabel}</p>
                      <p className="text-[9px] text-neutral-600 font-mono">
                        {eo.subscriptionPlan === '6_months' || eo.subscriptionPlan === '3_months' ? 'Event ∞' : 'Max 1 Event'}
                      </p>
                    </div>

                    {/* Kuota WA: terkirim / up-to total */}
                    <div className="bg-neutral-950 rounded-lg p-2.5 space-y-0.5">
                      <p className="text-[9px] font-bold uppercase text-neutral-500">Kuota WA</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[8px] font-bold text-neutral-600 uppercase mr-0.5">Up To</span>
                        <span className="text-xs font-black font-mono text-neutral-300">
                          {((eo.wa_quota || 0) + (eo.wa_messages_sent || 0)).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <p className="text-[9px] text-neutral-600">
                        Terpakai: <span className="text-brand-blue font-bold">{(eo.wa_messages_sent || 0).toLocaleString('id-ID')}</span>
                        {' · '}Sisa: <span className="text-brand-green font-bold">{(eo.wa_quota || 0).toLocaleString('id-ID')}</span>
                      </p>
                    </div>

                    {/* Expired */}
                    <div className="bg-neutral-950 rounded-lg p-2.5 space-y-0.5">
                      <p className="text-[9px] font-bold uppercase text-neutral-500">Expired</p>
                      <p className="text-[11px] font-mono font-bold text-brand-yellow leading-snug">
                        {formatDate(eo.subscriptionExpiresAt || getOneMonthExpiry())}
                      </p>
                    </div>

                    {/* No. WA */}
                    <div className="bg-neutral-950 rounded-lg p-2.5 space-y-0.5">
                      <p className="text-[9px] font-bold uppercase text-neutral-500">No. WA</p>
                      <a href={`https://wa.me/${eo.wa}`} target="_blank" rel="noreferrer"
                        className="text-brand-green font-bold font-mono text-[11px] hover:underline flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 shrink-0" />{eo.wa}
                      </a>
                    </div>
                  </div>

                  {/* Row 3: tombol aksi */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-neutral-800/60">
                    <Button variant="blue" size="sm" onClick={() => openTopUpModal(eo)}
                      className="font-black text-[10px] uppercase whitespace-nowrap">
                      <Zap className="w-3 h-3 mr-1 shrink-0" /> Top Up Kuota
                    </Button>
                    {(eo.wa_quota || 0) > 0 && (
                      <Button variant="yellow" size="sm" onClick={() => handleResetQuota(eo.id)}
                        className="font-black text-[10px] uppercase whitespace-nowrap">
                        <X className="w-3 h-3 mr-1 shrink-0" /> Reset Kuota
                      </Button>
                    )}
                    <Button variant={eo.status === 'active' ? 'yellow' : 'green'} size="sm"
                      onClick={() => handleToggleStatus(eo.id)}
                      className="font-black text-[10px] uppercase whitespace-nowrap">
                      <Power className="w-3 h-3 mr-1 shrink-0" />
                      {eo.status === 'active' ? 'Lock' : 'Unlock'}
                    </Button>
                    <Button variant="red" size="sm" onClick={() => handleDeleteEo(eo.id)}
                      className="font-black text-[10px] uppercase whitespace-nowrap ml-auto">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>

      {deleteConfirmModalJsx}
      {resetQuotaModalJsx}

      {topUpModalOpen && selectedEo && (        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[#111111] border border-brand-blue/40 rounded-xl shadow-[0_0_60px_rgba(6,182,212,0.2)] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-blue/20 border border-brand-blue/40 rounded-lg">
                  <Zap className="w-5 h-5 text-brand-blue" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-tight">Top Up Kuota Bot WA</h3>
                  <p className="text-[10px] font-mono text-neutral-500 uppercase">Tambah kuota pesan untuk EO</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeTopUpModal}
                className="p-2 text-neutral-500 hover:text-brand-red transition-colors rounded-lg hover:bg-brand-red/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTopUpSubmit} className="p-6 space-y-5">
              <div className="p-4 bg-neutral-900/60 rounded-xl border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-neutral-500 tracking-widest">Nama EO / Panitia</span>
                  <Badge variant="purple" className="text-[8px] px-1.5 py-0">{selectedEo.id}</Badge>
                </div>
                <p className="text-base font-black text-white">{selectedEo.name}</p>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-neutral-800">
                  <div>
                    <p className="text-[9px] font-bold uppercase text-neutral-500 mb-1">Kuota Saat Ini</p>
                    <p className="text-xl font-mono font-black text-brand-blue">
                      {(selectedEo.wa_quota || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase text-neutral-500 mb-1">Total Terkirim</p>
                    <p className="text-xl font-mono font-black text-brand-purple">
                      {(selectedEo.wa_messages_sent || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">
                  Pilih Paket Kuota Bot WA
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {waPackages.map((pkg) => (
                    <label
                      key={pkg.value}
                      className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 ${
                        topUpPackage === pkg.value
                          ? 'bg-brand-blue/10 border-brand-blue'
                          : 'bg-neutral-900/60 border-neutral-700 hover:border-neutral-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="waPackage"
                        value={pkg.value}
                        checked={topUpPackage === pkg.value}
                        onChange={(e) => setTopUpPackage(e.target.value)}
                        className="sr-only"
                      />
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Badge variant="blue" className="text-[8px] px-1.5 py-0">ADD-ON</Badge>
                          {topUpPackage === pkg.value && (
                            <Badge variant="green" className="text-[8px] px-1.5 py-0">Dipilih</Badge>
                          )}
                        </div>
                        <p className="text-xs font-black uppercase text-white tracking-tight">{pkg.label}</p>
                        <div className="flex items-baseline justify-between pt-1">
                          <span className="text-xl font-black font-mono text-brand-blue">{pkg.price}</span>
                          <CreditCard className="w-4 h-4 text-neutral-500" />
                        </div>
                        <p className="text-[10px] font-mono text-neutral-400">
                          +{pkg.quota.toLocaleString('id-ID')} Pesan WA
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-brand-green/10 border border-brand-green/30 rounded-xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase text-brand-green">Kuota Setelah Top Up</span>
                  <span className="font-mono font-black text-brand-green text-xl">
                    {(
                      (selectedEo.wa_quota || 0) +
                      (waPackages.find(p => p.value === topUpPackage)?.quota || 0)
                    ).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={closeTopUpModal}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="blue"
                  size="md"
                  fullWidth
                  className="justify-center"
                >
                  <Zap className="w-4 h-4 mr-1.5" /> Konfirmasi Top Up
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};

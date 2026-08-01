import React, { useState, useEffect } from 'react';
import { UserPlus, Copy, Trash2, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { getAllEventsForEo } from '../../services/apiEvents';
import { getAllStaffForEo, createStaffAccount, deleteStaffAccount, updateStaffAccount } from '../../services/apiStaff';
import { StaffFormModal } from './StaffFormModal';
import { useToast } from '../../context/ToastContext';
import { getPlanLimits, PLAN_LABELS } from '../../utils/planLimits';

export const StaffManagerTab = () => {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const eoUsername = user?.username || user?.name || '';

  const [staffList, setStaffList] = useState([]);
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async (username) => {
    if (!username) return;
    try {
      setIsLoading(true);
      const staffData = await getAllStaffForEo(username);
      setStaffList(staffData);
      setEvents(await getAllEventsForEo(username));
    } catch (err) {
      console.warn('Gagal memuat data staf:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    const username = user?.username || user?.name || '';
    if (!username) return;
    loadData(username);
  }, [authLoading, user]);

  const handleFormSubmit = async (formData) => {
    // --- LIMIT CHECK: max staf per paket ---
    const userPlan = user?.subscriptionPlan || '1_month';
    const { maxStaff } = getPlanLimits(userPlan);
    if (maxStaff !== Infinity && staffList.length >= maxStaff) {
      showToast(
        `${PLAN_LABELS[userPlan] || 'Paket Anda'} hanya mengizinkan maksimal ${maxStaff} akun staf. ` +
        `Hapus staf yang tidak aktif atau upgrade ke Paket 3/6 Bulan untuk lebih banyak staf.`,
        'eo'
      );
      return;
    }
    // --- END LIMIT CHECK ---

    try {
      await createStaffAccount({
        name: formData.name,
        username: formData.username,
        password: formData.password,
        eo_username: eoUsername,
        event_id: formData.assignedEvent ? formData.assignedEvent.id : 'all',
        event_slug: formData.assignedEvent ? formData.assignedEvent.slug : 'indie-music-fest-2026',
        permissions: formData.permissions,
      });

      setToastMsg(`AKUN STAF "${formData.username.toUpperCase()}" BERHASIL DIBUAT!`);
      setShowForm(false);
      loadData(eoUsername);
      setTimeout(() => setToastMsg(''), 4000);
    } catch (err) {
      showToast(err.message || 'Gagal membuat akun staf.', 'eo');
    }
  };

  const handleDelete = async (id, staffName) => {
    if (window.confirm(`Hapus akun staf "${staffName}"?`)) {
      try {
        await deleteStaffAccount(id);
        loadData(eoUsername);
        setToastMsg('AKUN STAF BERHASIL DIHAPUS!');
        setTimeout(() => setToastMsg(''), 3000);
      } catch (err) {
        showToast(err.message || 'Gagal menghapus staf', 'eo');
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await updateStaffAccount(id, { status: currentStatus === 'active' ? 'suspended' : 'active' });
      loadData(eoUsername);
    } catch (err) {
      showToast(err.message || 'Gagal mengubah status staf', 'eo');
    }
  };

  const handleCopyCredentials = (staf) => {
    const targetSlug = staf.event_slug || 'indie-music-fest-2026';
    const loginLink = `${window.location.origin}/gate/${targetSlug}`;
    const text = `INFORMASI AKUN STAF LOKTIK\nStaf: ${staf.name}\nUsername: ${staf.username}\nPassword: ${staf.password}\nLink Gate: ${loginLink}`;
    navigator.clipboard.writeText(text);
    setToastMsg('INFO AKUN STAF DISALIN KE CLIPBOARD!');
    setTimeout(() => setToastMsg(''), 3000);
  };

  return (
    <div className="space-y-5 text-left">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#121212] p-5 rounded border border-neutral-800">
        <div>
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <Badge variant="green" className="text-[9px] px-2 py-0.5">TIM VENUE EO</Badge>
            <span className="text-xs text-neutral-400 font-mono">TOTAL: {staffList.length} STAF</span>
            {(() => {
              const userPlan = user?.subscriptionPlan || '1_month';
              const { maxStaff } = getPlanLimits(userPlan);
              if (maxStaff === Infinity) return <Badge variant="blue" className="text-[9px] px-2 py-0.5">UNLIMITED STAF</Badge>;
              const remaining = maxStaff - staffList.length;
              return (
                <Badge variant={remaining <= 0 ? 'red' : remaining === 1 ? 'yellow' : 'purple'} className="text-[9px] px-2 py-0.5">
                  {remaining <= 0 ? `LIMIT ${maxStaff} STAF TERCAPAI` : `SISA SLOT: ${remaining}/${maxStaff}`}
                </Badge>
              );
            })()}
          </div>
          <h2 className="text-xl font-black uppercase text-white tracking-tight mt-1">
            AKUN STAF & PERAN AKSES
          </h2>
          <p className="text-xs text-neutral-400 font-bold uppercase mt-0.5">
            KELOLA AKSES KHUSUS STAF (SCANNER, KASIR OTS, LIHAT ORDER)
          </p>
        </div>

        <Button
          variant="green"
          onClick={() => setShowForm(!showForm)}
          className="font-black text-xs uppercase py-2.5 px-4"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          <span>{showForm ? 'BATAL' : 'TAMBAH STAF BARU'}</span>
        </Button>
      </div>

      {toastMsg && (
        <div className="p-3 bg-brand-green/20 border border-brand-green text-brand-green font-bold text-xs rounded flex items-center space-x-2 uppercase">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {showForm && (
        <StaffFormModal
          events={events}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* STAFF LIST */}
      <div className="space-y-3">
        {staffList.length === 0 ? (
          <div className="p-8 text-center bg-[#121212] border border-neutral-800 rounded text-neutral-500 font-bold text-xs uppercase">
            BELUM ADA AKUN STAF DIBUAT. KLIK "TAMBAH STAF BARU" DI ATAS.
          </div>
        ) : (
          staffList.map((staf) => (
            <div
              key={staf.id}
              className="p-4 bg-[#121212] border border-neutral-800 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-black text-sm uppercase text-white">{staf.name}</span>
                  <Badge variant={staf.status === 'active' ? 'green' : 'red'} className="text-[9px] px-1.5 py-0">
                    {staf.status === 'active' ? 'AKTIF' : 'SUSPENDED'}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-neutral-400">
                  <span>USER: <strong className="text-white">{staf.username}</strong></span>
                  <span>PASS: <strong className="text-white">{staf.password}</strong></span>
                  <span>EVENT: <strong className="text-brand-green uppercase">{staf.event_slug || 'ALL'}</strong></span>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[9px] font-bold uppercase text-neutral-500">HAK AKSES:</span>
                  {staf.permissions?.canScan && <Badge variant="purple" className="text-[8px] py-0 px-1">SCANNER</Badge>}
                  {staf.permissions?.canOts && <Badge variant="green" className="text-[8px] py-0 px-1">KASIR OTS</Badge>}
                  {staf.permissions?.canViewOrders && <Badge variant="blue" className="text-[8px] py-0 px-1">LIHAT ORDER</Badge>}
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => handleCopyCredentials(staf)} className="text-xs font-bold uppercase text-brand-green border-neutral-700">
                  <Copy className="w-3.5 h-3.5 mr-1" /> SALIN INFO
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleToggleStatus(staf.id, staf.status)} className="text-xs font-bold uppercase border-neutral-700 text-neutral-300">
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(staf.id, staf.name)} className="text-xs font-bold uppercase text-brand-red border-neutral-700 hover:bg-brand-red/10">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

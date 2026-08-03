import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Trash2, Power, MessageSquare, Plus, Inbox, Eye, EyeOff, KeyRound, Calendar, Bot, CreditCard, X, Zap } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { formatDate } from '../../utils/formatters';
import { toggleBot } from '../../services/apiEo';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const getOneMonthExpiry = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const [eoAccounts, setEoAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem('loktik_eo_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          return parsed.map(acc => ({
            ...acc,
            wa_quota: acc.wa_quota ?? 0,
            wa_messages_sent: acc.wa_messages_sent ?? 0,
          }));
        }
      }
      return [
        {
          id: 'EO-101',
          name: 'eo_lokal',
          wa: '085765907580',
          password: 'password123',
          status: 'active',
          subscriptionPlan: '1_month',
          subscriptionExpiresAt: getOneMonthExpiry(),
          botAccessBonus: false,
          wa_quota: 0,
          wa_messages_sent: 0,
        },
        {
          id: 'EO-102',
          name: 'abin',
          wa: '081234567890',
          password: '1234',
          status: 'active',
          subscriptionPlan: '1_month',
          subscriptionExpiresAt: getOneMonthExpiry(),
          botAccessBonus: false,
          wa_quota: 0,
          wa_messages_sent: 0,
        },
      ];
    } catch (e) {
      return [];
    }
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newEo, setNewEo] = useState({ name: '', wa: '', password: '', plan: '1_month' });
  const [showPasswords, setShowPasswords] = useState({});
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [selectedEo, setSelectedEo] = useState(null);
  const [topUpPackage, setTopUpPackage] = useState('1000');

  const waPackages = [
    { value: '1000', label: 'PAKET 1.000 PESAN', quota: 1000, price: 'Rp50.000' },
    { value: '10000', label: 'PAKET 10.000 PESAN', quota: 10000, price: 'Rp70.000' },
  ];

  useEffect(() => {
    localStorage.setItem('loktik_eo_accounts', JSON.stringify(eoAccounts));
  }, [eoAccounts]);

  const planOptions = [
    { value: 'test', label: 'TEST (1 HARI / MANUAL WA)' },
    { value: '1_month', label: '1 BULAN (Rp199RB / MANUAL WA)' },
    { value: '3_months', label: '3 BULAN (Rp349RB / MANUAL WA)' },
    { value: '6_months', label: '6 BULAN PRO (Rp599RB / MANUAL WA)' },
  ];

  const calculateExpiryDate = (plan) => {
    const now = Date.now();
    let days = 30;
    if (plan === 'test') days = 1;
    else if (plan === '1_month') days = 30;
    else if (plan === '3_months') days = 90;
    else if (plan === '6_months') days = 180;
    return new Date(now + days * 24 * 60 * 60 * 1000).toISOString();
  };

  const handleToggleStatus = (eoId) => {
    setEoAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === eoId) {
          const nextStatus = acc.status === 'active' ? 'suspended' : 'active';
          return { ...acc, status: nextStatus };
        }
        return acc;
      })
    );
  };

  const handleToggleBotBonus = async (eoId) => {
  // Find current EO and toggle flag
  const acc = eoAccounts.find((a) => a.id === eoId);
  if (!acc) return;
  const nextBonus = !acc.botAccessBonus;
  try {
    await toggleBot(eoId, nextBonus);
  } catch (err) {
    console.error('Failed to toggle bot flag', err);
    return;
  }
  // Update state
  setEoAccounts((prev) =>
    prev.map((a) => (a.id === eoId ? { ...a, botAccessBonus: nextBonus } : a))
  );
  // Sync to current session if this EO is logged in
  try {
    const savedUser = localStorage.getItem('loktik_user_session');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      const isMatch =
        parsedUser.id === acc.id ||
        (parsedUser.username || '').toLowerCase() === (acc.name || '').toLowerCase();
      if (isMatch) {
        localStorage.setItem(
          'loktik_user_session',
          JSON.stringify({ ...parsedUser, botAccessBonus: nextBonus })
        );
      }
    }
  } catch (e) {}
};

  const handleDeleteEo = (eoId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus akun EO ini secara permanen?')) {
      setEoAccounts((prev) => prev.filter((acc) => acc.id !== eoId));
    }
  };

  const togglePasswordVisibility = (eoId) => {
    setShowPasswords((prev) => ({ ...prev, [eoId]: !prev[eoId] }));
  };

  const handleAddEoSubmit = (e) => {
    e.preventDefault();
    if (!newEo.name || !newEo.wa || !newEo.password) return;

    // Cek duplikat username
    const duplicate = eoAccounts.find(
      (acc) => (acc.name || '').trim().toLowerCase() === newEo.name.trim().toLowerCase()
    );
    if (duplicate) {
      alert(`Username EO "${newEo.name}" sudah terdaftar! Gunakan nama lain.`);
      return;
    }

    const createdEo = {
      id: `EO-${Math.floor(100 + Math.random() * 900)}`,
      name: newEo.name.trim(),
      wa: newEo.wa.replace(/[^0-9]/g, ''),
      password: newEo.password.trim(),
      status: 'active',
      subscriptionPlan: newEo.plan,
      subscriptionExpiresAt: calculateExpiryDate(newEo.plan),
      botAccessBonus: false,
      wa_quota: 0,
      wa_messages_sent: 0,
    };

    setEoAccounts((prev) => [createdEo, ...prev]);
    setNewEo({ name: '', wa: '', password: '', plan: '1_month' });
    setShowAddModal(false);
  };

  const openTopUpModal = (eo) => {
    setSelectedEo(eo);
    setTopUpPackage('1000');
    setTopUpModalOpen(true);
  };

  const closeTopUpModal = () => {
    setTopUpModalOpen(false);
    setSelectedEo(null);
  };

  const handleTopUpSubmit = (e) => {
    e.preventDefault();
    if (!selectedEo) return;

    const selectedPackage = waPackages.find(p => p.value === topUpPackage);
    const quotaToAdd = selectedPackage ? selectedPackage.quota : parseInt(topUpPackage);

    setEoAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === selectedEo.id) {
          const updatedEo = {
            ...acc,
            wa_quota: (acc.wa_quota || 0) + quotaToAdd,
            // Auto-set botAccessBonus = true saat top up pertama kali
            botAccessBonus: true,
          };
          // Sync ke session aktif jika EO ini sedang login
          try {
            const savedUser = localStorage.getItem('loktik_user_session');
            if (savedUser) {
              const parsedUser = JSON.parse(savedUser);
              const isMatch =
                parsedUser.id === acc.id ||
                (parsedUser.username || '').toLowerCase() === (acc.name || '').toLowerCase();
              if (isMatch) {
                localStorage.setItem(
                  'loktik_user_session',
                  JSON.stringify({
                    ...parsedUser,
                    wa_quota: updatedEo.wa_quota,
                    wa_messages_sent: updatedEo.wa_messages_sent || 0,
                    botAccessBonus: true,
                  })
                );
              }
            }
          } catch (err) {}
          return updatedEo;
        }
        return acc;
      })
    );
    closeTopUpModal();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Top Admin Bar */}
      <div className="border-b border-neutral-800 bg-[#0d0d0d] px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="green">PLATFORM OWNER ADMIN</Badge>
            <div className="h-4 w-px bg-neutral-700" />
            <span className="text-[11px] font-mono text-neutral-400 font-bold">
              LOGGED IN: <span className="text-brand-green">BroFerADM (Ferdy)</span>
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="border-brand-red/40 text-brand-red hover:bg-brand-red/10 hover:border-brand-red hover:text-brand-red shrink-0">
            <LogOut className="w-3.5 h-3.5 mr-1.5" /> LOGOUT
          </Button>
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
        {eoAccounts.length === 0 ? (
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
              const hasBot = Boolean(eo.botAccessBonus);
              const planLabel =
                eo.subscriptionPlan === '6_months' ? '6 BULAN PRO' :
                eo.subscriptionPlan === '3_months' ? '3 BULAN' :
                eo.subscriptionPlan === 'test' ? 'TEST' : '1 BULAN';
              const planColor =
                eo.subscriptionPlan === '6_months' ? 'text-brand-blue' :
                eo.subscriptionPlan === '3_months' ? 'text-brand-purple' :
                eo.subscriptionPlan === 'test' ? 'text-neutral-400' : 'text-brand-yellow';
              const planBorder =
                eo.subscriptionPlan === '6_months' ? 'border-brand-blue/30' :
                eo.subscriptionPlan === '3_months' ? 'border-brand-purple/30' :
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
                      {hasBot && (
                        <Badge variant="blue" className="text-[9px] whitespace-nowrap">BOT ON</Badge>
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

                    {/* Kuota WA: terkirim / total */}
                    <div className="bg-neutral-950 rounded-lg p-2.5 space-y-0.5">
                      <p className="text-[9px] font-bold uppercase text-neutral-500">Kuota WA</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-black font-mono text-brand-blue">
                          {(eo.wa_messages_sent || 0).toLocaleString('id-ID')}
                        </span>
                        <span className="text-[9px] text-neutral-600">/</span>
                        <span className="text-xs font-black font-mono text-neutral-300">
                          {((eo.wa_quota || 0) + (eo.wa_messages_sent || 0)).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <p className="text-[9px] text-neutral-600">Sisa: {(eo.wa_quota || 0).toLocaleString('id-ID')}</p>
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
                    <button
                      type="button"
                      onClick={() => handleToggleBotBonus(eo.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase whitespace-nowrap transition-all ${
                        hasBot
                          ? 'bg-brand-green/15 border border-brand-green/60 text-brand-green'
                          : 'bg-neutral-800/60 border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white'
                      }`}
                    >
                      <Bot className="w-3.5 h-3.5 shrink-0" />
                      {hasBot ? '✓ Bot Aktif' : '+ Aktifkan Bot'}
                    </button>
                    <Button variant="blue" size="sm" onClick={() => openTopUpModal(eo)}
                      className="font-black text-[10px] uppercase whitespace-nowrap">
                      <Zap className="w-3 h-3 mr-1 shrink-0" /> Top Up
                    </Button>
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

      {topUpModalOpen && selectedEo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
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

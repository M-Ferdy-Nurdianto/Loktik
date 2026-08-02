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

  const handleToggleBotBonus = (eoId) => {
    setEoAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === eoId) {
          const nextBonus = !acc.botAccessBonus;
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
                  JSON.stringify({ ...parsedUser, botAccessBonus: nextBonus })
                );
              }
            }
          } catch (e) {}
          return { ...acc, botAccessBonus: nextBonus };
        }
        return acc;
      })
    );
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
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8 text-left bg-[#0a0a0a]">
      {/* Admin Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-800 pb-4 gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Badge variant="green">PLATFORM OWNER ADMIN</Badge>
            <span className="text-xs font-mono text-brand-green font-bold">
              LOGGED IN: BroFerADM (Ferdy)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
            DASBOR UTAMA PLATFORM LOKTIK
          </h1>
        </div>

        <Button variant="outline" size="sm" onClick={handleLogout} className="self-start sm:self-auto">
          <LogOut className="w-4 h-4 mr-1 text-brand-red" /> LOGOUT
        </Button>
      </div>

      {/* Admin Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card variant="dark" className="p-4 sm:p-5 space-y-1.5 border-neutral-800">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">TOTAL EO TERDAFTAR</p>
          <p className="text-2xl font-black text-white">{eoAccounts.length} <span className="text-base font-bold text-neutral-500">EO</span></p>
        </Card>
        <Card variant="dark" className="p-4 sm:p-5 space-y-1.5 border-neutral-800">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">EO AKTIF</p>
          <p className="text-2xl font-black text-brand-green">{eoAccounts.filter((a) => a.status === 'active').length} <span className="text-base font-bold text-neutral-500">EO</span></p>
        </Card>
        <Card variant="dark" className="p-4 sm:p-5 space-y-1.5 border-neutral-800">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">SOFT-LOCKED</p>
          <p className="text-2xl font-black text-brand-red">{eoAccounts.filter((a) => a.status === 'suspended').length} <span className="text-base font-bold text-neutral-500">EO</span></p>
        </Card>
        <Card variant="dark" className="p-4 sm:p-5 space-y-1.5 border-neutral-800">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">KUOTA WA AKTIF</p>
          <p className="text-2xl font-black text-brand-blue">{eoAccounts.reduce((sum, a) => sum + (a.wa_quota || 0), 0).toLocaleString('id-ID')}</p>
        </Card>
        <Card variant="dark" className="p-4 sm:p-5 space-y-1.5 border-neutral-800">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">PESAN TERKIRIM</p>
          <p className="text-2xl font-black text-brand-purple">{eoAccounts.reduce((sum, a) => sum + (a.wa_messages_sent || 0), 0).toLocaleString('id-ID')}</p>
        </Card>
      </div>

      {/* Account Management Section */}
      <Card variant="dark" className="p-6 space-y-6 text-left border-neutral-800">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-neutral-800 pb-3 gap-3">
          <div>
            <h3 className="text-lg font-black uppercase text-white">MANAJEMEN AKUN EO / PANITIA</h3>
            <p className="text-xs text-neutral-400">Buat akun EO baru, tentukan durasi langganan &amp; soft lock akun.</p>
          </div>
          <Button variant="green" size="sm" onClick={() => setShowAddModal(!showAddModal)}>
            <Plus className="w-4 h-4 mr-1" /> {showAddModal ? 'BATAL' : 'TAMBAH EO BARU'}
          </Button>
        </div>

        {/* Add EO Form */}
        {showAddModal && (
          <form onSubmit={handleAddEoSubmit} className="p-5 bg-neutral-900 rounded-md border border-neutral-800 space-y-4">
            <h4 className="text-xs font-black uppercase text-brand-green tracking-widest flex items-center space-x-1">
              <KeyRound className="w-4 h-4" />
              <span>BUAT AKUN &amp; PASSWORD EO BARU</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Input
                label="NAMA EO / PANITIA *"
                required
                placeholder="Masukkan Username / Nama EO..."
                value={newEo.name}
                onChange={(e) => setNewEo({ ...newEo, name: e.target.value })}
              />
              <Input
                label="NO. WHATSAPP EO *"
                required
                type="tel"
                inputMode="numeric"
                placeholder="Masukkan Nomor WhatsApp..."
                value={newEo.wa}
                onChange={(e) => setNewEo({ ...newEo, wa: e.target.value.replace(/[^0-9]/g, '') })}
              />
              <Input
                label="PASSWORD UNTUK EO *"
                type="password"
                required
                placeholder="Password login..."
                value={newEo.password}
                onChange={(e) => setNewEo({ ...newEo, password: e.target.value })}
              />
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 block mb-1.5">PAKET LANGGANAN *</label>
                <CustomSelect
                  options={planOptions}
                  value={newEo.plan}
                  onChange={(val) => setNewEo({ ...newEo, plan: val })}
                  accentColor="green"
                />
              </div>
            </div>
            <Button type="submit" variant="green" size="sm" className="font-bold uppercase">
              SIMPAN &amp; BUAT AKUN EO
            </Button>
          </form>
        )}

        {/* EO Table */}
        {eoAccounts.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Inbox className="w-12 h-12 text-neutral-600 mx-auto" />
            <p className="font-extrabold text-sm text-neutral-400 uppercase">BELUM ADA AKUN EO TERDAFTAR</p>
            <p className="text-xs text-neutral-500 font-medium">Klik tombol "TAMBAH EO BARU" di atas untuk mendaftarkan akun &amp; password EO.</p>
          </div>
        ) : (
          <>
            {/* ── MOBILE: card per EO (dedicated, bukan shrink dari tabel) ── */}
            <div className="block lg:hidden space-y-3">
              {eoAccounts.map((eo) => {
                const hasBot = Boolean(eo.botAccessBonus);
                const quotaLow = (eo.wa_quota || 0) <= 0;
                const quotaMedium = (eo.wa_quota || 0) > 0 && (eo.wa_quota || 0) <= 100;
                const planLabel =
                  eo.subscriptionPlan === '6_months' ? '6 BULAN PRO' :
                  eo.subscriptionPlan === '3_months' ? '3 BULAN' :
                  eo.subscriptionPlan === 'test' ? 'TEST' : '1 BULAN';
                const planColor =
                  eo.subscriptionPlan === '6_months' ? 'text-brand-blue' :
                  eo.subscriptionPlan === '3_months' ? 'text-brand-purple' :
                  eo.subscriptionPlan === 'test' ? 'text-neutral-400' : 'text-brand-yellow';
                const limitText =
                  `${eo.subscriptionPlan === '6_months' || eo.subscriptionPlan === '3_months' ? 'Event ∞' : 'Max 1 Event'} · ` +
                  `${eo.subscriptionPlan === '6_months' ? 'Staf ∞' : eo.subscriptionPlan === '3_months' ? 'Max 5 Staf' : eo.subscriptionPlan === 'test' ? 'Max 1 Staf' : 'Max 2 Staf'}`;

                return (
                  <div key={eo.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
                    {/* Row 1: ID + nama + status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono text-brand-purple font-bold">{eo.id}</p>
                        <p className="text-sm font-black text-white truncate">{eo.name}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[11px] font-mono text-brand-yellow font-bold">
                            {showPasswords[eo.id] ? eo.password : '••••••••'}
                          </span>
                          <button type="button" onClick={() => togglePasswordVisibility(eo.id)} className="text-neutral-500 hover:text-white">
                            {showPasswords[eo.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                      <Badge variant={eo.status === 'active' ? 'green' : 'red'} className="shrink-0 whitespace-nowrap text-[10px]">
                        {eo.status === 'active' ? 'AKTIF' : 'LOCKED'}
                      </Badge>
                    </div>

                    {/* Row 2: detail info grid */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-neutral-950 rounded-lg p-2.5 space-y-0.5">
                        <p className="text-neutral-500 font-bold uppercase text-[9px]">Paket</p>
                        <p className={`font-black uppercase ${planColor}`}>{planLabel}</p>
                        <p className="text-neutral-500 font-mono text-[9px]">{limitText}</p>
                      </div>
                      <div className="bg-neutral-950 rounded-lg p-2.5 space-y-0.5">
                        <p className="text-neutral-500 font-bold uppercase text-[9px]">Expired</p>
                        <p className="font-mono font-bold text-brand-yellow text-[11px] leading-snug">
                          {formatDate(eo.subscriptionExpiresAt || getOneMonthExpiry())}
                        </p>
                      </div>
                      <div className="bg-neutral-950 rounded-lg p-2.5 space-y-0.5">
                        <p className="text-neutral-500 font-bold uppercase text-[9px]">Kuota WA</p>
                        <p className={`font-mono font-black text-sm ${quotaLow ? 'text-brand-red' : quotaMedium ? 'text-brand-yellow' : 'text-brand-blue'}`}>
                          {(eo.wa_quota || 0).toLocaleString('id-ID')}
                        </p>
                        {quotaLow && <span className="text-[9px] text-brand-red font-bold">HABIS</span>}
                      </div>
                      <div className="bg-neutral-950 rounded-lg p-2.5 space-y-0.5">
                        <p className="text-neutral-500 font-bold uppercase text-[9px]">WA</p>
                        <a href={`https://wa.me/${eo.wa}`} target="_blank" rel="noreferrer"
                          className="text-brand-green font-bold font-mono text-[11px] hover:underline flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 shrink-0" />{eo.wa}
                        </a>
                      </div>
                    </div>

                    {/* Row 3: tombol aksi */}
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-neutral-800">
                      <Button variant={hasBot ? 'green' : 'outline'} size="sm"
                        onClick={() => handleToggleBotBonus(eo.id)}
                        className="font-black text-[10px] uppercase whitespace-nowrap flex-1 justify-center">
                        <Bot className="w-3 h-3 mr-1 shrink-0" />
                        {hasBot ? '✓ Bot Aktif' : '+ Bot'}
                      </Button>
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
                        className="font-black text-[10px] uppercase whitespace-nowrap">
                        <Trash2 className="w-3 h-3 shrink-0" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── DESKTOP: tabel (lg ke atas) ── */}
            <div className="hidden lg:block overflow-x-auto rounded-lg border border-neutral-800">
              <table className="w-full text-left table-fixed" style={{ minWidth: '1160px' }}>
                <thead className="bg-neutral-900 text-neutral-400 font-bold uppercase border-b border-neutral-800">
                  <tr>
                    <th className="px-4 py-3 w-[72px] text-[9px] tracking-wider whitespace-nowrap">ID EO</th>
                    <th className="px-4 py-3 w-[145px] text-[9px] tracking-wider whitespace-nowrap">NAMA EO</th>
                    <th className="px-4 py-3 w-[130px] text-[9px] tracking-wider whitespace-nowrap">NO. WA</th>
                    <th className="px-4 py-3 w-[120px] text-[9px] tracking-wider whitespace-nowrap">PAKET</th>
                    <th className="px-4 py-3 w-[95px] text-[9px] tracking-wider whitespace-nowrap">KUOTA WA</th>
                    <th className="px-4 py-3 w-[90px] text-[9px] tracking-wider whitespace-nowrap">TERKIRIM</th>
                    <th className="px-4 py-3 w-[105px] text-[9px] tracking-wider whitespace-nowrap">EXPIRED</th>
                    <th className="px-4 py-3 w-[90px] text-[9px] tracking-wider whitespace-nowrap">STATUS</th>
                    <th className="px-4 py-3 w-[130px] text-[9px] tracking-wider whitespace-nowrap">BOT WA</th>
                    <th className="px-4 py-3 w-[200px] text-[9px] tracking-wider whitespace-nowrap text-right">KONTROL AKSES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 font-medium text-neutral-200">
                  {eoAccounts.map((eo) => {
                    const hasBot = Boolean(eo.botAccessBonus);
                    const quotaLow = (eo.wa_quota || 0) <= 0;
                    const quotaMedium = (eo.wa_quota || 0) > 0 && (eo.wa_quota || 0) <= 100;
                    return (
                      <tr key={eo.id} className="hover:bg-neutral-900/50 align-middle">

                        {/* ID */}
                        <td className="px-4 py-3 font-mono font-bold text-brand-purple text-xs whitespace-nowrap">
                          {eo.id}
                        </td>

                        {/* Nama + password */}
                        <td className="px-4 py-3">
                          <span className="font-extrabold text-white text-sm block truncate leading-snug">
                            {eo.name}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[10px] font-mono text-brand-yellow font-bold">
                              {showPasswords[eo.id] ? eo.password : '••••••••'}
                            </span>
                            <button type="button" onClick={() => togglePasswordVisibility(eo.id)}
                              className="text-neutral-500 hover:text-white transition-colors shrink-0">
                              {showPasswords[eo.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>
                        </td>

                        {/* WhatsApp */}
                        <td className="px-4 py-3">
                          <a href={`https://wa.me/${eo.wa}`} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 text-brand-green font-bold hover:underline text-xs">
                            <MessageSquare className="w-3 h-3 shrink-0" />
                            <span className="font-mono truncate">{eo.wa}</span>
                          </a>
                        </td>

                        {/* Paket */}
                        <td className="px-4 py-3">
                          <span className={`text-xs font-black uppercase block leading-snug ${
                            eo.subscriptionPlan === '6_months' ? 'text-brand-blue' :
                            eo.subscriptionPlan === '3_months' ? 'text-brand-purple' :
                            eo.subscriptionPlan === 'test' ? 'text-neutral-400' : 'text-brand-yellow'
                          }`}>
                            {eo.subscriptionPlan === '6_months' ? '6 BLN PRO' :
                             eo.subscriptionPlan === '3_months' ? '3 BULAN' :
                             eo.subscriptionPlan === 'test' ? 'TEST' : '1 BULAN'}
                          </span>
                          <span className="text-[9px] text-neutral-500 font-mono block mt-1 leading-tight">
                            {eo.subscriptionPlan === '6_months' || eo.subscriptionPlan === '3_months' ? 'Event ∞' : 'Max 1 Event'}
                            {' · '}
                            {eo.subscriptionPlan === '6_months' ? 'Staf ∞' :
                             eo.subscriptionPlan === '3_months' ? 'Max 5 Staf' :
                             eo.subscriptionPlan === 'test' ? 'Max 1 Staf' : 'Max 2 Staf'}
                          </span>
                        </td>

                        {/* Kuota WA */}
                        <td className="px-4 py-3">
                          <span className={`font-mono font-black text-sm block leading-snug ${
                            quotaLow ? 'text-brand-red' : quotaMedium ? 'text-brand-yellow' : 'text-brand-blue'
                          }`}>
                            {(eo.wa_quota || 0).toLocaleString('id-ID')}
                          </span>
                          {quotaLow ? (
                            <span className="text-[9px] text-brand-red font-black uppercase mt-0.5 block">HABIS</span>
                          ) : quotaMedium ? (
                            <span className="text-[9px] text-brand-yellow font-black uppercase mt-0.5 block">SEDIKIT</span>
                          ) : null}
                        </td>

                        {/* Pesan terkirim */}
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-sm text-brand-purple block leading-snug">
                            {(eo.wa_messages_sent || 0).toLocaleString('id-ID')}
                          </span>
                          <span className="text-[9px] font-mono text-neutral-500 uppercase">pesan</span>
                        </td>

                        {/* Expired */}
                        <td className="px-4 py-3 font-mono text-brand-yellow font-bold text-[11px] leading-tight">
                          {formatDate(eo.subscriptionExpiresAt || getOneMonthExpiry())}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <Badge variant={eo.status === 'active' ? 'green' : 'red'} className="whitespace-nowrap px-2.5 py-0.5 text-[10px]">
                            {eo.status === 'active' ? 'AKTIF' : 'LOCKED'}
                          </Badge>
                        </td>

                        {/* Bot WA — lebar cukup, tidak overflow ke kolom berikutnya */}
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleToggleBotBonus(eo.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase whitespace-nowrap w-full justify-center transition-colors ${
                              hasBot
                                ? 'bg-brand-green/20 border border-brand-green text-brand-green shadow-[0_0_10px_rgba(57,255,20,0.2)]'
                                : 'bg-neutral-800 border border-neutral-700 text-neutral-300 hover:border-neutral-500'
                            }`}
                          >
                            <Bot className="w-3.5 h-3.5 shrink-0" />
                            <span>{hasBot ? '✓ Bot Aktif' : '+ Aktifkan'}</span>
                          </button>
                        </td>

                        {/* Kontrol Akses — gap konsisten, tidak wrap */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="blue" size="sm" onClick={() => openTopUpModal(eo)}
                              className="font-black text-[10px] uppercase whitespace-nowrap px-3">
                              <Zap className="w-3 h-3 mr-1 shrink-0" /> Top Up
                            </Button>
                            <Button variant={eo.status === 'active' ? 'yellow' : 'green'} size="sm"
                              onClick={() => handleToggleStatus(eo.id)}
                              className="font-black text-[10px] uppercase whitespace-nowrap px-3">
                              <Power className="w-3 h-3 mr-1 shrink-0" />
                              {eo.status === 'active' ? 'Lock' : 'Unlock'}
                            </Button>
                            <Button variant="red" size="sm" onClick={() => handleDeleteEo(eo.id)}
                              className="font-black text-[10px] uppercase whitespace-nowrap px-3">
                              <Trash2 className="w-3 h-3 shrink-0" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {topUpModalOpen && selectedEo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0a0a0a] border-2 border-brand-blue/60 rounded-md shadow-[0_0_40px_rgba(6,182,212,0.25)] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-neutral-800 p-5">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-brand-blue/20 border border-brand-blue/50 rounded-md">
                  <Zap className="w-5 h-5 text-brand-blue" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-tight">TOP UP KUOTA BOT WA</h3>
                  <p className="text-[10px] font-mono text-neutral-500 uppercase">Tambah kuota pesan untuk EO</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeTopUpModal}
                className="p-2 text-neutral-500 hover:text-brand-red transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTopUpSubmit} className="p-5 space-y-5">
              <div className="p-4 bg-neutral-900 rounded-md border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                  <span className="text-neutral-500">NAMA EO / PANITIA</span>
                  <Badge variant="purple" className="text-[8px] px-1.5 py-0">{selectedEo.id}</Badge>
                </div>
                <p className="text-base font-black text-white">{selectedEo.name}</p>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-800/80">
                  <div>
                    <p className="text-[9px] font-bold uppercase text-neutral-500">KUOTA SAAT INI</p>
                    <p className="text-lg font-mono font-black text-brand-blue">
                      {(selectedEo.wa_quota || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase text-neutral-500">TOTAL TERKIRIM</p>
                    <p className="text-lg font-mono font-black text-brand-purple">
                      {(selectedEo.wa_messages_sent || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-300 block">
                  PILIH PAKET KUOTA BOT WA
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {waPackages.map((pkg) => (
                    <label
                      key={pkg.value}
                      className={`cursor-pointer p-4 rounded-md border-2 transition-all duration-200 ${
                        topUpPackage === pkg.value
                          ? 'bg-brand-blue/10 border-brand-blue shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                          : 'bg-neutral-900 border-neutral-700 hover:border-neutral-600'
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
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Badge variant="blue" className="text-[8px] px-1.5 py-0">ADD-ON</Badge>
                          {topUpPackage === pkg.value && (
                            <Badge variant="green" className="text-[8px] px-1.5 py-0">DIPILIH</Badge>
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

              <div className="p-3.5 bg-brand-green/10 border border-brand-green/40 rounded-md">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase text-brand-green">KUOTA SETELAH TOP UP</span>
                  <span className="font-mono font-black text-brand-green text-lg">
                    {(
                      (selectedEo.wa_quota || 0) +
                      (waPackages.find(p => p.value === topUpPackage)?.quota || 0)
                    ).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={closeTopUpModal}
                >
                  BATAL
                </Button>
                <Button
                  type="submit"
                  variant="blue"
                  size="md"
                  fullWidth
                  className="justify-center"
                >
                  <Zap className="w-4 h-4 mr-1.5" /> KONFIRMASI TOP UP
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

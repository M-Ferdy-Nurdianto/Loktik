import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Trash2, Power, MessageSquare, Plus, Inbox, Eye, EyeOff, KeyRound, Calendar } from 'lucide-react';
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

  // Load EO Accounts from localStorage so accounts persist and are accessible for login
  const [eoAccounts, setEoAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem('loktik_eo_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
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
        },
        {
          id: 'EO-102',
          name: 'abin',
          wa: '081234567890',
          password: '1234',
          status: 'active',
          subscriptionPlan: '1_month',
          subscriptionExpiresAt: getOneMonthExpiry(),
        },
      ];
    } catch (e) {
      return [];
    }
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newEo, setNewEo] = useState({ name: '', wa: '', password: '', plan: '1_month' });
  const [showPasswords, setShowPasswords] = useState({});

  useEffect(() => {
    localStorage.setItem('loktik_eo_accounts', JSON.stringify(eoAccounts));
  }, [eoAccounts]);

  const planOptions = [
    { value: 'test', label: 'TEST (1 HARI / TEST TRIAL)' },
    { value: '1_month', label: '1 BULAN (TRIAL / BASIC)' },
    { value: '3_months', label: '3 BULAN (REGULER)' },
    { value: '1_year', label: '1 TAHUN (PROMO / ANNUAL)' },
  ];

  const calculateExpiryDate = (plan) => {
    const now = Date.now();
    let days = 30;
    if (plan === 'test') days = 1;
    else if (plan === '1_month') days = 30;
    else if (plan === '3_months') days = 90;
    else if (plan === '1_year') days = 365;
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

    const createdEo = {
      id: `EO-${Math.floor(100 + Math.random() * 900)}`,
      name: newEo.name.trim(),
      wa: newEo.wa.replace(/[^0-9]/g, ''),
      password: newEo.password.trim(),
      status: 'active',
      subscriptionPlan: newEo.plan,
      subscriptionExpiresAt: calculateExpiryDate(newEo.plan),
    };

    setEoAccounts((prev) => [createdEo, ...prev]);
    setNewEo({ name: '', wa: '', password: '', plan: '1_month' });
    setShowAddModal(false);
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="dark" className="p-5 space-y-1 border-neutral-800">
          <p className="text-[10px] font-bold text-neutral-400 uppercase">TOTAL EO TERDAFTAR</p>
          <p className="text-2xl font-black text-white">{eoAccounts.length} EO</p>
        </Card>
        <Card variant="dark" className="p-5 space-y-1 border-neutral-800">
          <p className="text-[10px] font-bold text-neutral-400 uppercase">EO STATUS AKTIF</p>
          <p className="text-2xl font-black text-brand-green">
            {eoAccounts.filter((a) => a.status === 'active').length} EO
          </p>
        </Card>
        <Card variant="dark" className="p-5 space-y-1 border-neutral-800">
          <p className="text-[10px] font-bold text-neutral-400 uppercase">AKUN SOFT-LOCKED</p>
          <p className="text-2xl font-black text-brand-red">
            {eoAccounts.filter((a) => a.status === 'suspended').length} EO
          </p>
        </Card>
        <Card variant="dark" className="p-5 space-y-1 border-neutral-800">
          <p className="text-[10px] font-bold text-neutral-400 uppercase">PAKET LANGGANAN</p>
          <p className="text-2xl font-black text-brand-purple">ACTIVE</p>
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
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-900 text-neutral-400 font-bold uppercase border-b border-neutral-800">
                <tr>
                  <th className="p-3">ID EO</th>
                  <th className="p-3">NAMA EO (USERNAME)</th>
                  <th className="p-3">NO. WHATSAPP</th>
                  <th className="p-3">PASSWORD</th>
                  <th className="p-3">S/D EXPIRED</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3 text-right">KONTROL AKSES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 font-medium text-neutral-200">
                {eoAccounts.map((eo) => (
                  <tr key={eo.id} className="hover:bg-neutral-900/50">
                    <td className="p-3 font-mono font-bold text-brand-purple">{eo.id}</td>
                    <td className="p-3 font-extrabold text-white">{eo.name}</td>
                    <td className="p-3">
                      <a
                        href={`https://wa.me/${eo.wa}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1.5 text-brand-green font-bold hover:underline"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{eo.wa}</span>
                      </a>
                    </td>
                    <td className="p-3 font-mono">
                      <div className="flex items-center space-x-2">
                        <span className="text-brand-yellow font-bold">
                          {showPasswords[eo.id] ? eo.password : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(eo.id)}
                          className="text-neutral-400 hover:text-white"
                        >
                          {showPasswords[eo.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-brand-yellow font-bold">
                      {formatDate(eo.subscriptionExpiresAt || getOneMonthExpiry())}
                    </td>
                    <td className="p-3">
                      <Badge variant={eo.status === 'active' ? 'green' : 'red'}>
                        {eo.status === 'active' ? 'AKTIF' : 'SOFT-LOCKED'}
                      </Badge>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <Button
                        variant={eo.status === 'active' ? 'yellow' : 'green'}
                        size="sm"
                        onClick={() => handleToggleStatus(eo.id)}
                      >
                        <Power className="w-3.5 h-3.5 mr-1" />
                        {eo.status === 'active' ? 'SOFT LOCK' : 'AKTIFKAN'}
                      </Button>
                      
                      <Button
                        variant="red"
                        size="sm"
                        onClick={() => handleDeleteEo(eo.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> HAPUS EO
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LogOut, ShoppingBag, User, MessageSquare, PlusCircle, List, Users, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { OverviewStats } from '../../components/dashboard/OverviewStats';
import { MyEventsTab } from '../../components/dashboard/MyEventsTab';
import { CreateEventTab } from '../../components/dashboard/CreateEventTab';
import { OrderManagerTab } from '../../components/dashboard/OrderManagerTab';
import { StaffManagerTab } from '../../components/dashboard/StaffManagerTab';
import { getAllEventsForEo } from '../../services/apiEvents';
import { getLiveOrdersForEo } from '../../services/apiOrders';

export const EODashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout } = useAuth();
  
  const activeTab = searchParams.get('tab') || 'my-events';
  const setActiveTab = (tab) => {
    setSearchParams({ tab }, { replace: true });
  };

  const [stats, setStats] = useState({
    totalEvents: '0 Event',
    totalOrders: '0 Tiket',
    pendingOrders: '0 Pesanan',
    totalRevenue: 0,
  });

  const [waStats, setWaStats] = useState({
    wa_quota: 0,
    wa_messages_sent: 0,
  });

  const eoName = user?.name || user?.username || 'Panitia EO';
  const eoUsername = user?.username || user?.name || 'eo_lokal';
  const eoWa = user?.wa || '081234567890';

  const fetchLiveStats = async () => {
    try {
      const [eventsList, ordersList] = await Promise.all([
        getAllEventsForEo(eoUsername),
        getLiveOrdersForEo(eoUsername),
      ]);

      const activeEventsCount = eventsList.length;
      const pendingCount = ordersList.filter((o) => o.status === 'pending').length;
      
      const paidOrders = ordersList.filter((o) => o.status === 'paid');
      const totalRev = paidOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
      
      const totalTicketsSold = paidOrders.reduce((sum, o) => {
        const tCount = o.tickets ? o.tickets.length : 1;
        return sum + tCount;
      }, 0);

      setStats({
        totalEvents: `${activeEventsCount} Event`,
        totalOrders: `${totalTicketsSold} Tiket`,
        pendingOrders: `${pendingCount} Pesanan`,
        totalRevenue: totalRev,
      });

      let latestWaQuota = user?.wa_quota ?? 0;
      let latestWaSent = user?.wa_messages_sent ?? 0;
      try {
        const savedAccs = JSON.parse(localStorage.getItem('loktik_eo_accounts') || '[]');
        const matchedAcc = savedAccs.find(
          a => (a.id && user?.id && a.id === user.id) || (a.name && user?.username && a.name.toLowerCase() === user.username.toLowerCase())
        );
        if (matchedAcc) {
          latestWaQuota = matchedAcc.wa_quota ?? latestWaQuota;
          latestWaSent = matchedAcc.wa_messages_sent ?? latestWaSent;
        }
      } catch (e) {}
      setWaStats({
        wa_quota: latestWaQuota,
        wa_messages_sent: latestWaSent,
      });
    } catch (e) {
      console.warn('Gagal memuat ringkasan stats dashboard');
    }
  };

  useEffect(() => {
    fetchLiveStats();
  }, [activeTab, eoUsername, user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getSubExpiryInfo = () => {
    // Baca dari subscriptionExpiresAt (field standar yang disimpan di session)
    const expDate = user?.subscriptionExpiresAt || user?.expiresAt;
    if (!expDate) {
      // Fallback: anggap 30 hari dari sekarang jika tidak ada data
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return {
        dateStr: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        diffDays: 30,
      };
    }
    try {
      const target = new Date(expDate);
      if (isNaN(target.getTime())) throw new Error('Invalid date');
      const today = new Date();
      const diffTime = target - today;
      const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      const dateStr = target.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      return { dateStr, diffDays };
    } catch (e) {
      return { dateStr: '30 Hari', diffDays: 30 };
    }
  };

  const { dateStr: subExpiryDate, diffDays: remainingDays } = getSubExpiryInfo();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col md:flex-row text-left">
      {/* LEFT SIDEBAR (FIXED STICKY FOR DESKTOP) */}
      <aside className="w-full md:w-64 bg-[#121212] border-r border-neutral-800 p-5 flex flex-col justify-between shrink-0 space-y-6 md:sticky md:top-0 md:h-screen md:overflow-y-auto no-scrollbar">
        <div className="space-y-6">
          {/* EO Profile Card */}
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg space-y-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-brand-green/20 text-brand-green rounded-md border border-brand-green/40">
                <User className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <Badge variant="green" className="text-[9px] px-1.5 py-0">AKUN EO / PANITIA</Badge>
                <h3 className="text-base font-black uppercase text-white truncate">{eoName}</h3>
              </div>
            </div>

            {/* EO WhatsApp Contact */}
            <div className="p-2 bg-neutral-950 rounded border border-neutral-800 space-y-0.5">
              <p className="text-[10px] font-bold text-neutral-400 uppercase">NO. WHATSAPP EO:</p>
              <div className="flex items-center space-x-1.5 text-brand-green font-mono font-bold text-xs">
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span>{eoWa}</span>
              </div>
            </div>

            {/* Subscription Expiry Timer Card */}
            <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800 space-y-2 text-left">
              <div className="flex items-center justify-between gap-1 text-[10px]">
                <span className="text-neutral-500 font-bold uppercase shrink-0">PAKET:</span>
                <span className="text-brand-blue font-black uppercase font-mono tracking-tight text-right truncate">
                  {user?.subscriptionPlan === '6_months'
                    ? '6 BULAN PRO'
                    : user?.subscriptionPlan === '3_months'
                    ? '3 BULAN REGULER'
                    : user?.subscriptionPlan === 'test'
                    ? 'TEST 1 HARI'
                    : '1 BULAN BASIC'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1 text-[10px] border-t border-neutral-800/80 pt-1.5">
                <span className="text-neutral-500 font-bold uppercase shrink-0">BOT WA:</span>
                <span className={`font-black uppercase font-mono text-right ${
                  user?.botAccessBonus ? 'text-brand-green' : 'text-neutral-400'
                }`}>
                  {user?.botAccessBonus ? '✓ AKTIF (ADD-ON)' : 'ADD-ON (TERPISAH)'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1 text-[10px] border-t border-neutral-800/80 pt-1.5">
                <span className="text-neutral-500 font-bold uppercase shrink-0">STATUS:</span>
                <span className="text-brand-green font-black uppercase font-mono text-right">SUBSCRIBED</span>
              </div>
              <div className="border-t border-neutral-800/80 pt-1.5 space-y-0.5 text-[10px] font-mono">
                <div className="flex items-center justify-between text-neutral-500 font-bold uppercase">
                  <span>EXPIRED:</span>
                  <span className="text-brand-yellow font-black">{remainingDays} HARI LAGI</span>
                </div>
                <div className="text-[9px] text-neutral-400 font-bold text-right">
                  {subExpiryDate}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Menu Items */}
          <nav className="space-y-1.5">
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-2 mb-2">MENU UTAMA EO</p>

            <button
              onClick={() => setActiveTab('my-events')}
              className={`w-full px-3.5 py-2.5 rounded-md text-xs font-black uppercase tracking-wider flex items-center space-x-3 transition-colors ${
                activeTab === 'my-events'
                  ? 'bg-brand-green text-black font-black'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <List className="w-4 h-4 shrink-0" />
              <span className="truncate">MY EVENTS</span>
            </button>

            <button
              onClick={() => setActiveTab('create-event')}
              className={`w-full px-3.5 py-2.5 rounded-md text-xs font-black uppercase tracking-wider flex items-center space-x-3 transition-colors ${
                activeTab === 'create-event'
                  ? 'bg-brand-green text-black font-black'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span className="truncate">CREATE EVENT</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full px-3.5 py-2.5 rounded-md text-xs font-black uppercase tracking-wider flex items-center space-x-3 transition-colors ${
                activeTab === 'orders'
                  ? 'bg-brand-green text-black font-black'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span className="truncate">ORDERS</span>
            </button>

            <button
              onClick={() => setActiveTab('staff-manager')}
              className={`w-full px-3.5 py-2.5 rounded-md text-xs font-black uppercase tracking-wider flex items-center space-x-3 transition-colors ${
                activeTab === 'staff-manager'
                  ? 'bg-brand-green text-black font-black'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className="truncate">STAFF GATE</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Logout */}
        <div className="pt-4 border-t border-neutral-800">
          <Button variant="outline" size="sm" fullWidth onClick={handleLogout} className="justify-center">
            <LogOut className="w-4 h-4 mr-2 text-brand-red" /> LOGOUT EO
          </Button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <main className="flex-1 p-5 md:p-6 space-y-5 overflow-y-auto">
        {/* COMPACT SLEEK HEADER BAR */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-black uppercase text-white tracking-tight">
              DASBOR KELOLA TIKET
            </span>
            <span className="text-neutral-600 font-mono text-xs">•</span>
            <span className="text-xs font-bold text-brand-green font-mono uppercase">
              PANITIA: {eoName}
            </span>
          </div>
          <Badge variant="green" className="text-[10px] py-0.5 px-2">● LIVE ONLINE</Badge>
        </div>

        {/* Data Retention Warning Card */}
        <Card variant="dark" className="p-4 border-2 border-brand-red/60 bg-gradient-to-br from-[#1a0a0a] via-[#1a130a] to-[#0a0a0a] space-y-3 text-left shadow-[0_0_25px_rgba(255,51,51,0.12)]">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-brand-red/20 border border-brand-red/60 rounded-md shrink-0 mt-0.5 shadow-[0_0_12px_rgba(255,51,51,0.25)]">
              <AlertTriangle className="w-5 h-5 text-brand-red" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="red" className="text-[9px] px-2 py-0.5 font-black tracking-wider">
                  ⚠️ PERINGATAN KRITIS
                </Badge>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wide text-white">
                  PENTING: ATURAN RETENSI DATA EVENT (OTOMATIS HAPUS 7 HARI)
                </h3>
              </div>
              <p className="text-[11px] sm:text-xs text-neutral-300 font-medium leading-relaxed pl-0.5">
                Setiap data event, daftar transaksi pesanan, tiket QR Code, dan bukti bayar yang sudah selesai akan <strong className="text-brand-red underline decoration-wavy decoration-brand-red/60 underline-offset-2">otomatis dibersihkan &amp; dihapus oleh sistem 7 hari (1 minggu) setelah tanggal event berakhir</strong>. Harap segera lakukan ekspor/rekapan data penjualan sebelum batas waktu tersebut (tombol <strong className="text-brand-green">EXPORT EXCEL</strong> &amp; <strong className="text-brand-green">EXPORT PDF</strong> tersedia di Manajemen Pesanan).
              </p>
            </div>
          </div>
        </Card>

        {/* Overview Stats: Render ONLY on 'my-events' and 'orders' tabs */}
        {(activeTab === 'my-events' || activeTab === 'orders') && (
          <OverviewStats stats={stats} waStats={waStats} />
        )}

        {/* Dynamic Tab Body */}
        <div>
          {activeTab === 'my-events' && <MyEventsTab onNavigateToCreate={() => setActiveTab('create-event')} />}
          {activeTab === 'create-event' && <CreateEventTab onEventCreated={() => setActiveTab('my-events')} />}
          {activeTab === 'orders' && <OrderManagerTab />}
          {activeTab === 'staff-manager' && <StaffManagerTab />}
        </div>
      </main>
    </div>
  );
};

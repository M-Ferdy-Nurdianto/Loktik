import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LogOut, ShoppingBag, User, MessageSquare, PlusCircle, List, Users, AlertTriangle, Menu, X, HelpCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { OverviewStats } from '../../components/dashboard/OverviewStats';
import { MyEventsTab } from '../../components/dashboard/MyEventsTab';
import { CreateEventTab } from '../../components/dashboard/CreateEventTab';
import { OrderManagerTab } from '../../components/dashboard/OrderManagerTab';
import { StaffManagerTab } from '../../components/dashboard/StaffManagerTab';
import { EoGuideTab } from '../../components/dashboard/EoGuideTab';
import { getAllEventsForEo } from '../../services/apiEvents';
import { getLiveOrdersForEo } from '../../services/apiOrders';
import { resolveWhatsAppMode } from '../../utils/resolveWhatsAppMode';
import { supabase } from '../../services/supabase';

export const EODashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout } = useAuth();

  const activeTab = searchParams.get('tab') || 'my-events';
  const setActiveTab = (tab) => {
    setSearchParams({ tab }, { replace: true });
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // liveEoData: data terbaru dari DB (bukan session cache)
  // Dipakai untuk resolveWhatsAppMode agar tidak stale
  const [liveEoData, setLiveEoData]   = useState(null);
  const [liveEoLoading, setLiveEoLoading] = useState(true);

  const eoName     = user?.name || user?.username || 'Panitia EO';
  const eoUsername = user?.username || user?.name || 'eo_lokal';
  const eoWa       = user?.wa || '';

  // Merge user session dengan data live dari DB
  // liveEoData menang atas session untuk field wa_quota dan bot_access_bonus
  const effectiveUser = liveEoData
    ? {
        ...user,
        wa_quota:         liveEoData.wa_quota         ?? user?.wa_quota         ?? 0,
        wa_messages_sent: liveEoData.wa_messages_sent ?? user?.wa_messages_sent ?? 0,
        botAccessBonus:   liveEoData.bot_access_bonus ?? user?.botAccessBonus   ?? false,
      }
    : user;

  // resolveWhatsAppMode — pakai effectiveUser agar dapat data terbaru dari DB
  const waMode      = resolveWhatsAppMode(effectiveUser);
  const hasBotAddon = waMode === 'bot' || waMode === 'quota';

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

      // Fetch data EO terbaru dari Supabase — override session yang mungkin stale
      if (user?.id) {
        try {
          const { data: eoRow } = await supabase
            .from('eo_accounts')
            .select('wa_quota, wa_messages_sent, bot_access_bonus')
            .eq('id', user.id)
            .maybeSingle();

          if (eoRow) {
            setLiveEoData(eoRow);
            setWaStats({
              wa_quota:         eoRow.wa_quota         ?? 0,
              wa_messages_sent: eoRow.wa_messages_sent ?? 0,
            });
          } else {
            setWaStats({
              wa_quota:         user?.wa_quota         ?? 0,
              wa_messages_sent: user?.wa_messages_sent ?? 0,
            });
          }
        } catch (_) {
          setWaStats({
            wa_quota:         user?.wa_quota         ?? 0,
            wa_messages_sent: user?.wa_messages_sent ?? 0,
          });
        } finally {
          setLiveEoLoading(false);
        }
      } else {
        setLiveEoLoading(false);
      }
    } catch (e) {
      console.warn('Gagal memuat ringkasan stats dashboard');
      setLiveEoLoading(false);
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
    const expDate = user?.subscriptionExpiresAt || user?.expiresAt;
    if (!expDate) {
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

  // Nav tabs config
  const navTabs = [
    { id: 'my-events', label: 'MY EVENTS', icon: <List className="w-4 h-4" /> },
    { id: 'create-event', label: 'CREATE', icon: <PlusCircle className="w-4 h-4" /> },
    { id: 'orders', label: 'ORDERS', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'staff-manager', label: 'STAFF GATE', icon: <Users className="w-4 h-4" /> },
    { id: 'guide', label: 'PANDUAN', icon: <HelpCircle className="w-4 h-4" /> },
  ];

  const SidebarContent = () => (
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

        {/* Subscription & Bot WA Info */}
        <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800 space-y-2 text-left">
          <div className="flex items-center justify-between gap-1 text-[10px]">
            <span className="text-neutral-500 font-bold uppercase shrink-0">PAKET:</span>
            <span className="text-brand-blue font-black uppercase font-mono tracking-tight text-right truncate">
              {user?.subscriptionPlan === '6_months'
                ? '6 BULAN PRO'
                : user?.subscriptionPlan === '3_months'
                ? '3 BULAN REGULER'
                : user?.subscriptionPlan === 'event_pass'
                ? 'EVENT PASS'
                : user?.subscriptionPlan === 'test'
                ? 'TEST 1 HARI'
                : '1 BULAN BASIC'}
            </span>
          </div>

          {/* BOT WA — hanya tampil info status, tidak menampilkan warning/error jika tidak aktif */}
          <div className="flex items-center justify-between gap-1 text-[10px] border-t border-neutral-800/80 pt-1.5">
            <span className="text-neutral-500 font-bold uppercase shrink-0">BOT WA:</span>
            <span className={`font-black uppercase font-mono text-right ${
              hasBotAddon ? 'text-brand-green' : 'text-neutral-500'
            }`}>
              {waMode === 'bot' ? 'AKTIF (∞)' : waMode === 'quota' ? `AKTIF (${(waStats?.wa_quota ?? 0).toLocaleString('id-ID')})` : 'TIDAK AKTIF'}
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
        {navTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
            className={`w-full px-3.5 py-2.5 rounded-md text-xs font-black uppercase tracking-wider flex items-center space-x-3 transition-colors ${
              activeTab === tab.id
                ? 'bg-brand-green text-black font-black'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <span className="shrink-0">{tab.icon}</span>
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col md:flex-row text-left">
      {/* MOBILE: overlay sidebar drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR — desktop sticky, mobile drawer */}
      <aside className={`
        fixed top-0 left-0 h-full z-50 w-72 bg-[#121212] border-r border-neutral-800 p-5 flex flex-col justify-between
        transition-transform duration-300 ease-in-out no-scrollbar overflow-y-auto
        md:sticky md:w-64 md:translate-x-0 md:top-0 md:h-screen md:shrink-0 md:z-auto
        ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        {/* Mobile close button */}
        <button
          className="md:hidden absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>

        <SidebarContent />

        {/* Sidebar Footer Logout */}
        <div className="pt-4 border-t border-neutral-800 mt-6">
          <Button variant="outline" size="sm" fullWidth onClick={handleLogout} className="justify-center">
            <LogOut className="w-4 h-4 mr-2 text-brand-red" /> LOGOUT EO
          </Button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-6 space-y-4 overflow-y-auto pb-20 md:pb-6">
        {/* COMPACT SLEEK HEADER BAR */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center space-x-2">
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-1.5 text-neutral-400 hover:text-brand-green rounded-lg hover:bg-neutral-900 transition-colors mr-1"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-black uppercase text-white tracking-tight">
              DASBOR KELOLA TIKET
            </span>
            <span className="text-neutral-600 font-mono text-xs hidden sm:inline">•</span>
            <span className="text-xs font-bold text-brand-green font-mono uppercase hidden sm:inline">
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
                  PERINGATAN KRITIS
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
          <OverviewStats
            stats={stats}
            waStats={waStats}
            hasBotAddon={hasBotAddon}
            waMode={waMode}
            isLoadingBot={liveEoLoading}
          />
        )}

        {/* Dynamic Tab Body */}
        <div>
          {activeTab === 'my-events' && <MyEventsTab onNavigateToCreate={() => setActiveTab('create-event')} />}
          {activeTab === 'create-event' && <CreateEventTab onEventCreated={() => setActiveTab('my-events')} />}
          {activeTab === 'orders' && <OrderManagerTab />}
          {activeTab === 'staff-manager' && <StaffManagerTab />}
          {activeTab === 'guide' && <EoGuideTab />}
        </div>
      </main>

      {/* MOBILE BOTTOM TAB BAR (mobile only, md+ tersembunyi) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#0f0f0f] border-t border-neutral-800 flex md:hidden">
        {navTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[9px] font-black uppercase tracking-wider transition-colors ${
              activeTab === tab.id
                ? 'text-brand-green'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <span className={`${activeTab === tab.id ? 'text-brand-green' : 'text-neutral-500'}`}>
              {tab.icon}
            </span>
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-brand-green rounded-full" />
            )}
          </button>
        ))}
        {/* Logout tab khusus mobile */}
        <button
          onClick={handleLogout}
          className="flex-none flex flex-col items-center justify-center gap-1 py-2.5 px-3 text-[9px] font-black uppercase tracking-wider text-brand-red transition-colors hover:text-red-400"
        >
          <LogOut className="w-4 h-4" />
          <span>LOGOUT</span>
        </button>
      </nav>
    </div>
  );
};

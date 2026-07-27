import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ShoppingBag, QrCode, Ticket, User, MessageSquare, PlusCircle, List } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { OverviewStats } from '../../components/dashboard/OverviewStats';
import { MyEventsTab } from '../../components/dashboard/MyEventsTab';
import { CreateEventTab } from '../../components/dashboard/CreateEventTab';
import { OrderManagerTab } from '../../components/dashboard/OrderManagerTab';
import { OtsCashierTab } from '../../components/dashboard/OtsCashierTab';
import { ScannerTab } from '../../components/dashboard/ScannerTab';
import { getAllEventsForEo } from '../../services/apiEvents';
import { getLiveOrdersForEo } from '../../services/apiOrders';

export const EODashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('my-events');
  const [stats, setStats] = useState({
    totalEvents: '0 Event',
    totalOrders: '0 Tiket',
    pendingOrders: '0 Pesanan',
    totalRevenue: 0,
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
    } catch (e) {
      console.warn('Gagal memuat ringkasan stats dashboard');
    }
  };

  useEffect(() => {
    fetchLiveStats();
  }, [activeTab, eoUsername]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col md:flex-row text-left">
      {/* LEFT SIDEBAR */}
      <aside className="w-full md:w-64 bg-[#121212] border-r border-neutral-800 p-5 flex flex-col justify-between shrink-0 space-y-6">
        <div className="space-y-6">
          {/* EO Profile Card */}
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg space-y-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-brand-purple/20 text-brand-purple rounded-md border border-brand-purple/40">
                <User className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <Badge variant="purple" className="text-[9px] px-1.5 py-0">AKUN EO / PANITIA</Badge>
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

            <div className="text-[10px] text-neutral-400 font-semibold flex items-center justify-between">
              <span>STATUS:</span>
              <span className="text-brand-green font-extrabold uppercase">● SUBSCRIBED</span>
            </div>
          </div>

          {/* Sidebar Menu Items */}
          <nav className="space-y-1.5">
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-2 mb-2">MENU UTAMA EO</p>

            <button
              onClick={() => setActiveTab('my-events')}
              className={`w-full px-3.5 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center space-x-3 transition-colors ${
                activeTab === 'my-events'
                  ? 'bg-brand-green text-black font-black shadow-[0_0_12px_rgba(57,255,20,0.3)]'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Daftar Event Saya</span>
            </button>

            <button
              onClick={() => setActiveTab('create-event')}
              className={`w-full px-3.5 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center space-x-3 transition-colors ${
                activeTab === 'create-event'
                  ? 'bg-brand-purple text-white font-black shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Event Baru</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full px-3.5 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center space-x-3 transition-colors ${
                activeTab === 'orders'
                  ? 'bg-brand-blue text-black font-black shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Manajemen Pesanan</span>
            </button>

            <button
              onClick={() => setActiveTab('ots')}
              className={`w-full px-3.5 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center space-x-3 transition-colors ${
                activeTab === 'ots'
                  ? 'bg-brand-yellow text-black font-black shadow-[0_0_12px_rgba(255,230,0,0.3)]'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>Kasir OTS Venue</span>
            </button>

            <button
              onClick={() => setActiveTab('scanner')}
              className={`w-full px-3.5 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center space-x-3 transition-colors ${
                activeTab === 'scanner'
                  ? 'bg-white text-black font-black'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Gate Scanner</span>
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

        {/* Overview Stats: Render ONLY on 'my-events' and 'orders' tabs */}
        {(activeTab === 'my-events' || activeTab === 'orders') && (
          <OverviewStats stats={stats} />
        )}

        {/* Dynamic Tab Body */}
        <div>
          {activeTab === 'my-events' && <MyEventsTab onNavigateToCreate={() => setActiveTab('create-event')} />}
          {activeTab === 'create-event' && <CreateEventTab onEventCreated={() => setActiveTab('my-events')} />}
          {activeTab === 'orders' && <OrderManagerTab />}
          {activeTab === 'ots' && <OtsCashierTab />}
          {activeTab === 'scanner' && <ScannerTab />}
        </div>
      </main>
    </div>
  );
};

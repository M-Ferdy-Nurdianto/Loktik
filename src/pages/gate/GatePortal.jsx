import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QrCode, Users, Ticket, ShieldCheck, LogOut, UserCheck, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { getEventBySlug } from '../../services/apiEvents';
import { useAuth } from '../../hooks/useAuth';
import { GatePinLock } from './GatePinLock';
import { Scanner } from './Scanner';
import { GuestList } from './GuestList';
import { OtsCashier } from './OtsCashier';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';

export const GatePortal = () => {
  const { eventSlug } = useParams();
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [activeTab, setActiveTab] = useState('scanner');
  const [showGuide, setShowGuide] = useState(false);

  // Determine permissions based on user session
  const permissions = user?.role === 'staff' && user?.permissions
    ? user.permissions
    : { canScan: true, canOts: true, canViewOrders: true };

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const data = await getEventBySlug(eventSlug);
        setEvent(data);

        // Auto verify if staff or EO logged in
        if (user?.role === 'staff' || user?.role === 'eo' || user?.role === 'admin') {
          setIsPinVerified(true);
        } else {
          const savedPinSession = sessionStorage.getItem(`gate_auth_${eventSlug}`);
          if (savedPinSession === 'VERIFIED') {
            setIsPinVerified(true);
          }
        }
      } catch (err) {
        setErrorMsg(err.message || 'Acara tidak ditemukan.');
      } finally {
        setLoading(false);
      }
    };

    if (eventSlug) fetchEvent();
  }, [eventSlug, user]);

  // Set default active tab according to allowed permissions
  useEffect(() => {
    if (permissions.canScan) {
      setActiveTab('scanner');
    } else if (permissions.canViewOrders) {
      setActiveTab('guest-list');
    } else if (permissions.canOts) {
      setActiveTab('ots');
    }
  }, [user]);

  // Real-time active staff suspension check
  useEffect(() => {
    if (!user || user.role !== 'staff') return;

    const checkStaffStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('staff_accounts')
          .select('status')
          .eq('id', user.id)
          .single();

        if (data && data.status === 'suspended') {
          handleGateLogout();
          showToast('Sesi Anda berakhir: Akun staf ini dinonaktifkan oleh EO.', 'staff');
        }
      } catch (err) {
        console.warn('Gagal memverifikasi status staf:', err);
      }
    };

    checkStaffStatus();
    const interval = setInterval(checkStaffStatus, 8000);
    return () => clearInterval(interval);
  }, [user, eventSlug]);

  const handlePinSuccess = () => {
    sessionStorage.setItem(`gate_auth_${eventSlug}`, 'VERIFIED');
    setIsPinVerified(true);
  };

  const handleGateLogout = () => {
    sessionStorage.removeItem(`gate_auth_${eventSlug}`);
    if (user) logout();
    setIsPinVerified(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
        <div className="bg-[#121212] border border-neutral-800 p-6 rounded text-center space-y-2">
          <p className="font-black text-sm uppercase tracking-wider text-brand-purple">MEMUAT GATE VENUE...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !event) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
        <div className="bg-[#121212] border border-brand-red/40 p-6 rounded text-center space-y-4 max-w-sm">
          <p className="text-brand-red font-black text-sm uppercase">{errorMsg || 'EVENT TIDAK DITEMUKAN'}</p>
          <Link to="/" className="inline-block px-4 py-2 bg-neutral-900 text-white text-xs font-bold uppercase rounded border border-neutral-800">
            KEMBALI KE BERANDA
          </Link>
        </div>
      </div>
    );
  }

  const gatePin = event.payment_details?.gate_pin || '1312';

  if (!isPinVerified) {
    return <GatePinLock eventName={event.name} correctPin={gatePin} onSuccess={handlePinSuccess} />;
  }

  // Count available tabs
  const allowedTabsCount = [permissions.canScan, permissions.canViewOrders, permissions.canOts].filter(Boolean).length;
  const gridColsClass = allowedTabsCount === 3 ? 'grid-cols-3' : allowedTabsCount === 2 ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-brand-purple selection:text-white p-4 sm:p-8 space-y-5 w-full max-w-7xl mx-auto text-left">
      {/* STREETWEAR HEADER BAR */}
      <div className="bg-[#121212] p-4 rounded border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Badge variant="purple" className="text-[9px] px-1.5 py-0 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>POS GATE VENUE</span>
            </Badge>
            <Badge variant="purple" className="text-[9px] px-1.5 py-0">● GATE ONLINE</Badge>
            {user?.name && (
              <span className="text-xs font-mono text-brand-purple font-bold flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" /> {user.name} ({user.role?.toUpperCase()})
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
            {event.name}
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGuide(!showGuide)}
            className="text-brand-purple hover:bg-brand-purple/10 border-brand-purple/40 text-xs font-black uppercase"
          >
            <HelpCircle className="w-3.5 h-3.5 mr-1" />
            <span>PANDUAN STAF</span>
            {showGuide ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
          </Button>

          <Button variant="outline" size="sm" onClick={handleGateLogout} className="text-brand-red hover:bg-brand-red/10 border-brand-red/30 text-xs font-bold uppercase">
            <LogOut className="w-4 h-4 mr-1.5" />
            <span>KELUAR GATE</span>
          </Button>
        </div>
      </div>

      {/* EXPANDABLE 1-TAP QUICK OPERATIONAL GUIDE FOR STAFF */}
      {showGuide && (
        <div className="bg-[#121212] p-4 rounded-xl border border-brand-purple/40 space-y-2 text-xs text-neutral-300 shadow-[0_0_30px_rgba(139,92,246,0.15)]">
          <div className="flex items-center space-x-2 border-b border-neutral-800 pb-2">
            <HelpCircle className="w-4 h-4 text-brand-purple shrink-0" />
            <h3 className="font-black text-white uppercase tracking-wider">PANDUAN CEPAT OPERASIONAL STAF GATE VENUE</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-medium pt-1">
            <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1">
              <p className="font-black text-brand-purple uppercase">1. INPUT MANUALLY (PALING CEPAT):</p>
              <p className="text-neutral-400">Ketik Kode Tiket (misal <span className="font-mono text-white">GM1972</span>) di kolom paling atas lalu tekan Enter/Verifikasi.</p>
            </div>
            <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1">
              <p className="font-black text-brand-purple uppercase">2. PROGRES PENUKARAN (1/3, 2/3):</p>
              <p className="text-neutral-400">Perhatikan teks progres. Serahkan 1 Tiket Fisik tiap kali konfirmasi penukaran berhasil.</p>
            </div>
            <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1">
              <p className="font-black text-brand-purple uppercase">3. LUPA KODE / HP MATI (GUEST LIST):</p>
              <p className="text-neutral-400">Buka tab <span className="font-bold text-white">GUEST LIST</span> ➔ Ketik Nama Pembeli ➔ Klik tombol <span className="font-bold text-brand-green">CHECK-IN</span>.</p>
            </div>
            <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1">
              <p className="font-black text-brand-purple uppercase">4. PEMBELIAN VENUE (KASIR OTS):</p>
              <p className="text-neutral-400">Buka tab <span className="font-bold text-white">KASIR OTS</span> untuk melayani pengunjung yang beli langsung di venue.</p>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC TAB NAVIGATION BASED ON STAFF PERMISSIONS */}
      <div className={`grid ${gridColsClass} gap-2 sm:gap-3`}>
        {permissions.canScan && (
          <button
            type="button"
            onClick={() => setActiveTab('scanner')}
            className={`py-3 px-2 font-black text-xs sm:text-sm uppercase rounded transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'scanner'
                ? 'bg-brand-purple text-white border border-brand-purple shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                : 'bg-[#121212] text-neutral-400 border border-neutral-800 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>1. SCANNER</span>
          </button>
        )}

        {permissions.canViewOrders && (
          <button
            type="button"
            onClick={() => setActiveTab('guest-list')}
            className={`py-3 px-2 font-black text-xs sm:text-sm uppercase rounded transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'guest-list'
                ? 'bg-brand-purple text-white border border-brand-purple shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                : 'bg-[#121212] text-neutral-400 border border-neutral-800 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>2. GUEST LIST</span>
          </button>
        )}

        {permissions.canOts && (
          <button
            type="button"
            onClick={() => setActiveTab('ots')}
            className={`py-3 px-2 font-black text-xs sm:text-sm uppercase rounded transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'ots'
                ? 'bg-brand-purple text-white border border-brand-purple shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                : 'bg-[#121212] text-neutral-400 border border-neutral-800 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>3. KASIR OTS</span>
          </button>
        )}
      </div>

      {/* ACTIVE GATE VIEW */}
      <div>
        {activeTab === 'scanner' && permissions.canScan && <Scanner eventId={event.id} eventName={event.name} />}
        {activeTab === 'guest-list' && permissions.canViewOrders && <GuestList eventId={event.id} />}
        {activeTab === 'ots' && permissions.canOts && <OtsCashier eventId={event.id} />}
      </div>
    </div>
  );
};

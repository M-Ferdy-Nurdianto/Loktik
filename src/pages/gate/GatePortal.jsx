import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { QrCode, Users, Ticket, LogOut, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { getEventBySlug, getAllEventsForEo } from '../../services/apiEvents';
import { useAuth } from '../../hooks/useAuth';
import { GatePinLock } from './GatePinLock';
import { Scanner } from './Scanner';
import { GuestList } from './GuestList';
import { OtsCashier } from './OtsCashier';
import { StaffGuide } from './StaffGuide';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';

export const GatePortal = () => {
  const { eventSlug } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [event, setEvent] = useState(null);
  const [eoEvents, setEoEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [activeTab, setActiveTab] = useState('scanner');
  const [showGuide, setShowGuide] = useState(false);

  // Determine permissions based on user session
  const permissions = user?.role === 'staff' && user?.permissions
    ? user.permissions
    : { canScan: true, canOts: true, canViewOrders: true };

    const fetchEventData = async () => {
      if (!user) return; // wait for user
      try {
        setLoading(true);
        setErrorMsg(null);

        // Fetch all active events for this EO to populate dropdown
        const eoName = user.eo_username || user.username || user.name;
        const allEvents = await getAllEventsForEo(eoName);
        const activeEvents = allEvents.filter(e => e.status === 'active');
        setEoEvents(activeEvents);

        if (!eventSlug) {
          if (activeEvents.length > 0) {
            navigate(`/gate/${activeEvents[0].slug}`, { replace: true });
            return;
          } else {
            setErrorMsg('EO ini belum memiliki event aktif.');
            setLoading(false);
            return;
          }
        }

        const data = await getEventBySlug(eventSlug);
        setEvent(data);

        // Auto verify if staff or EO logged in
        if (user?.role === 'staff' || user?.role === 'eo' || user?.role === 'admin') {
          // If staff is bound to a specific event, check it. Otherwise allow if global.
          if (user.role === 'staff' && user.event_slug && user.event_slug !== 'all-events' && user.event_slug !== 'all') {
            if (user.event_slug !== data.slug) {
               setErrorMsg('Anda tidak ditugaskan untuk event ini.');
               setLoading(false);
               return;
            }
          }
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

    fetchEventData();
  }, [eventSlug, user, navigate]);

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
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-brand-purple selection:text-white w-full max-w-7xl mx-auto text-left">

      {/* ── MOBILE HEADER (dedicated, phone-first) ── */}
      <div className="block sm:hidden bg-[#0f0f0f] border-b border-neutral-800 px-4 py-3">
        {/* Row 1: event name + logout */}
        <div className="flex items-center justify-between gap-2">
          {eoEvents.length > 1 ? (
            <select 
              value={event.slug}
              onChange={(e) => {
                setIsPinVerified(false); // require re-pin on switch
                navigate(`/gate/${e.target.value}`);
              }}
              className="text-lg font-black uppercase tracking-tight text-brand-green bg-transparent border-b-2 border-brand-green/30 outline-none leading-tight truncate appearance-none max-w-[70%]"
            >
              {eoEvents.map(ev => <option key={ev.id} value={ev.slug} className="bg-neutral-900 text-white">{ev.name}</option>)}
            </select>
          ) : (
            <h1 className="text-xl font-black uppercase tracking-tight text-brand-green leading-none truncate">
              {event.name}
            </h1>
          )}
          <button
            type="button"
            onClick={handleGateLogout}
            className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-brand-red border border-brand-red/30 rounded-lg px-2.5 py-1.5 bg-brand-red/10 active:bg-brand-red/20"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar
          </button>
        </div>

        {/* Row 2: panduan + nama staf kecil */}
        <div className="flex items-center justify-between mt-2">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-1 text-[11px] font-bold text-brand-purple"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {showGuide ? 'Tutup Panduan' : 'Panduan Staf'}
          </button>
          {user?.name && (
            <span className="text-[10px] font-mono text-neutral-500 truncate max-w-[140px]">
              {user.name}
            </span>
          )}
        </div>
      </div>

      {/* ── DESKTOP HEADER ── */}
      <div className="hidden sm:flex bg-[#121212] p-4 sm:p-5 border-b border-neutral-800 items-center justify-between gap-3 sm:rounded-t">
        <div className="space-y-1">
          {eoEvents.length > 1 ? (
            <select 
              value={event.slug}
              onChange={(e) => {
                setIsPinVerified(false); // require re-pin on switch
                navigate(`/gate/${e.target.value}`);
              }}
              className="text-2xl font-black uppercase tracking-tight text-brand-green bg-transparent border-b-2 border-brand-green/30 outline-none leading-none appearance-none cursor-pointer hover:border-brand-green transition-colors"
            >
              {eoEvents.map(ev => <option key={ev.id} value={ev.slug} className="bg-neutral-900 text-white">{ev.name}</option>)}
            </select>
          ) : (
            <h1 className="text-2xl font-black uppercase tracking-tight text-brand-green leading-none">
              {event.name}
            </h1>
          )}
          {user?.name && (
            <p className="text-[11px] font-mono text-neutral-500">{user.name}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGuide(!showGuide)}
            className="text-brand-purple hover:bg-brand-purple/10 border-brand-purple/40 text-xs font-black uppercase"
          >
            <HelpCircle className="w-3.5 h-3.5 mr-1" />
            <span>PANDUAN</span>
            {showGuide ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
          </Button>
          <Button variant="outline" size="sm" onClick={handleGateLogout} className="text-brand-red hover:bg-brand-red/10 border-brand-red/30 text-xs font-bold uppercase">
            <LogOut className="w-4 h-4 mr-1.5" />
            <span>KELUAR GATE</span>
          </Button>
        </div>
      </div>

      {/* EXPANDABLE QUICK GUIDE */}
      {showGuide && <StaffGuide />}

      {/* TAB NAVIGATION */}
      <div className={`grid ${gridColsClass} gap-2 px-4 sm:px-0 mt-3`}>
        {permissions.canScan && (
          <button
            type="button"
            onClick={() => setActiveTab('scanner')}
            className={`py-3 px-2 font-black text-xs uppercase rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'scanner'
                ? 'bg-brand-purple text-white border border-brand-purple shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                : 'bg-[#121212] text-neutral-400 border border-neutral-800 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <QrCode className="w-4 h-4 shrink-0" />
            <span>Scanner</span>
          </button>
        )}
        {permissions.canViewOrders && (
          <button
            type="button"
            onClick={() => setActiveTab('guest-list')}
            className={`py-3 px-2 font-black text-xs uppercase rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'guest-list'
                ? 'bg-brand-purple text-white border border-brand-purple shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                : 'bg-[#121212] text-neutral-400 border border-neutral-800 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Guest List</span>
          </button>
        )}
        {permissions.canOts && (
          <button
            type="button"
            onClick={() => setActiveTab('ots')}
            className={`py-3 px-2 font-black text-xs uppercase rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'ots'
                ? 'bg-brand-purple text-white border border-brand-purple shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                : 'bg-[#121212] text-neutral-400 border border-neutral-800 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Ticket className="w-4 h-4 shrink-0" />
            <span>Kasir OTS</span>
          </button>
        )}
      </div>

      {/* ACTIVE GATE VIEW */}
      <div className="px-4 sm:px-0 mt-3 pb-8">
        {activeTab === 'scanner' && permissions.canScan && <Scanner eventId={event.id} eventName={event.name} />}
        {activeTab === 'guest-list' && permissions.canViewOrders && <GuestList eventId={event.id} />}
        {activeTab === 'ots' && permissions.canOts && <OtsCashier eventId={event.id} />}
      </div>
    </div>
  );
};

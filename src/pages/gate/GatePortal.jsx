import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QrCode, Users, Ticket, ShieldCheck, LogOut, UserCheck } from 'lucide-react';
import { getEventBySlug } from '../../services/apiEvents';
import { useAuth } from '../../hooks/useAuth';
import { GatePinLock } from './GatePinLock';
import { Scanner } from './Scanner';
import { GuestList } from './GuestList';
import { OtsCashier } from './OtsCashier';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const GatePortal = () => {
  const { eventSlug } = useParams();
  const { user, logout } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [activeTab, setActiveTab] = useState('scanner');

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

  const gatePin = event.payment_details?.gate_pin || '1029';

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
          <Button variant="outline" size="sm" onClick={handleGateLogout} className="text-brand-red hover:bg-brand-red/10 border-brand-red/30">
            <LogOut className="w-4 h-4 mr-1.5" />
            <span>KELUAR GATE</span>
          </Button>
        </div>
      </div>

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

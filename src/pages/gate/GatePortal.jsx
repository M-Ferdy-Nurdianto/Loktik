import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QrCode, Users, Ticket, ShieldCheck, LogOut } from 'lucide-react';
import { getEventBySlug } from '../../services/apiEvents';
import { GatePinLock } from './GatePinLock';
import { Scanner } from './Scanner';
import { GuestList } from './GuestList';
import { OtsCashier } from './OtsCashier';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const GatePortal = () => {
  const { eventSlug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [activeTab, setActiveTab] = useState('scanner');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const data = await getEventBySlug(eventSlug);
        setEvent(data);

        const savedPinSession = sessionStorage.getItem(`gate_auth_${eventSlug}`);
        if (savedPinSession === 'VERIFIED') {
          setIsPinVerified(true);
        }
      } catch (err) {
        setErrorMsg(err.message || 'Acara tidak ditemukan.');
      } finally {
        setLoading(false);
      }
    };

    if (eventSlug) fetchEvent();
  }, [eventSlug]);

  const handlePinSuccess = () => {
    sessionStorage.setItem(`gate_auth_${eventSlug}`, 'VERIFIED');
    setIsPinVerified(true);
  };

  const handleGateLogout = () => {
    sessionStorage.removeItem(`gate_auth_${eventSlug}`);
    setIsPinVerified(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
        <div className="bg-[#121212] border border-neutral-800 p-6 rounded text-center space-y-2">
          <p className="font-black text-sm uppercase tracking-wider text-brand-green">MEMUAT GATE VENUE...</p>
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-brand-green selection:text-black p-4 sm:p-6 space-y-5 max-w-5xl mx-auto text-left">
      {/* STREETWEAR HEADER BAR */}
      <div className="bg-[#121212] p-4 rounded border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Badge variant="purple" className="text-[9px] px-1.5 py-0 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>POS GATE VENUE</span>
            </Badge>
            <Badge variant="green" className="text-[9px] px-1.5 py-0">● GATE ONLINE</Badge>
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

      {/* STREETWEAR TAB NAVIGATION */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <button
          onClick={() => setActiveTab('scanner')}
          className={`py-3 px-2 font-black text-xs sm:text-sm uppercase rounded transition-colors flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'scanner'
              ? 'bg-brand-green text-black shadow-[0_0_12px_rgba(57,255,20,0.3)]'
              : 'bg-[#121212] text-neutral-400 border border-neutral-800 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>1. SCANNER</span>
        </button>

        <button
          onClick={() => setActiveTab('guest-list')}
          className={`py-3 px-2 font-black text-xs sm:text-sm uppercase rounded transition-colors flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'guest-list'
              ? 'bg-brand-blue text-black shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              : 'bg-[#121212] text-neutral-400 border border-neutral-800 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>2. GUEST LIST</span>
        </button>

        <button
          onClick={() => setActiveTab('ots')}
          className={`py-3 px-2 font-black text-xs sm:text-sm uppercase rounded transition-colors flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'ots'
              ? 'bg-brand-yellow text-black shadow-[0_0_12px_rgba(255,230,0,0.3)]'
              : 'bg-[#121212] text-neutral-400 border border-neutral-800 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>3. KASIR OTS</span>
        </button>
      </div>

      {/* ACTIVE GATE VIEW */}
      <div>
        {activeTab === 'scanner' && <Scanner eventId={event.id} eventName={event.name} />}
        {activeTab === 'guest-list' && <GuestList eventId={event.id} />}
        {activeTab === 'ots' && <OtsCashier eventId={event.id} />}
      </div>
    </div>
  );
};

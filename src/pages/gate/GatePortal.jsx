import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QrCode, Users, Ticket, ShieldCheck, ArrowLeft, LogOut } from 'lucide-react';
import { getEventBySlug } from '../../services/apiEvents';
import { GatePinLock } from './GatePinLock';
import { Scanner } from './Scanner';
import { GuestList } from './GuestList';
import { OtsCashier } from './OtsCashier';

export const GatePortal = () => {
  const { eventSlug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [activeTab, setActiveTab] = useState('scanner'); // 'scanner' | 'guest-list' | 'ots'

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
      <div className="min-h-screen bg-[#FFE600] flex items-center justify-center p-4">
        <div className="bg-white border-4 border-black p-6 font-black text-xl uppercase shadow-[6px_6px_0px_#000]">
          MEMUAT GATE PORTAL VENUE...
        </div>
      </div>
    );
  }

  if (errorMsg || !event) {
    return (
      <div className="min-h-screen bg-[#FF3333] flex items-center justify-center p-4">
        <div className="bg-white border-4 border-black p-6 font-black text-lg uppercase shadow-[6px_6px_0px_#000] text-center space-y-4">
          <p>{errorMsg || 'EVENT TIDAK DITEMUKAN'}</p>
          <Link to="/" className="inline-block px-4 py-2 bg-black text-white text-xs uppercase font-black border-2 border-black">
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
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#39FF14] selection:text-black p-3 sm:p-6 space-y-4">
      {/* NEO-BRUTALIST HEADER BAR */}
      <div className="bg-white text-black p-4 border-4 border-black shadow-[6px_6px_0px_#39FF14] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
        <div>
          <div className="inline-flex items-center space-x-1 bg-[#8B5CF6] text-white px-2 py-0.5 text-[10px] font-black uppercase border border-black mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PORTAL GERBANG VENUE</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-none text-black">
            {event.name}
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleGateLogout}
            className="px-3 py-2 bg-[#FF3333] hover:bg-[#d92626] text-white font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0px_#000] flex items-center space-x-1 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>KELUAR GATE</span>
          </button>
        </div>
      </div>

      {/* NEO-BRUTALIST TAB NAVIGATION */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <button
          onClick={() => setActiveTab('scanner')}
          className={`py-3.5 px-2 font-black text-xs sm:text-sm uppercase border-4 border-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeTab === 'scanner'
              ? 'bg-[#39FF14] text-black shadow-[4px_4px_0px_#FFF]'
              : 'bg-[#181818] text-white hover:bg-neutral-800'
          }`}
        >
          <QrCode className="w-5 h-5 stroke-[2.5]" />
          <span>1. SCANNER</span>
        </button>

        <button
          onClick={() => setActiveTab('guest-list')}
          className={`py-3.5 px-2 font-black text-xs sm:text-sm uppercase border-4 border-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeTab === 'guest-list'
              ? 'bg-[#06B6D4] text-black shadow-[4px_4px_0px_#FFF]'
              : 'bg-[#181818] text-white hover:bg-neutral-800'
          }`}
        >
          <Users className="w-5 h-5 stroke-[2.5]" />
          <span>2. GUEST LIST</span>
        </button>

        <button
          onClick={() => setActiveTab('ots')}
          className={`py-3.5 px-2 font-black text-xs sm:text-sm uppercase border-4 border-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeTab === 'ots'
              ? 'bg-[#FFE600] text-black shadow-[4px_4px_0px_#FFF]'
              : 'bg-[#181818] text-white hover:bg-neutral-800'
          }`}
        >
          <Ticket className="w-5 h-5 stroke-[2.5]" />
          <span>3. KASIR OTS</span>
        </button>
      </div>

      {/* ACTIVE GATE VIEW */}
      <div className="pt-2">
        {activeTab === 'scanner' && <Scanner eventId={event.id} eventName={event.name} />}
        {activeTab === 'guest-list' && <GuestList eventId={event.id} />}
        {activeTab === 'ots' && <OtsCashier eventId={event.id} />}
      </div>
    </div>
  );
};

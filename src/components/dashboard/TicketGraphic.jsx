import React, { forwardRef } from 'react';
import QRCode from 'react-qr-code';
import { CheckCircle2, Ticket } from 'lucide-react';

export const TicketGraphic = forwardRef(({ eventName, guestName, ticketCode, isPaid }, ref) => {
  return (
    <div
      ref={ref}
      className="absolute top-[-9999px] left-[-9999px] w-[500px] bg-[#0a0a0a] text-white p-8 border-[4px] border-neutral-900 rounded-xl flex flex-col items-center justify-center font-sans"
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded bg-brand-purple border border-brand-purple flex items-center justify-center">
          <Ticket className="w-6 h-6 text-black" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase">LOKTIK.</h1>
          <p className="text-[10px] font-bold text-brand-purple tracking-widest uppercase">OFFICIAL E-TICKET</p>
        </div>
      </div>

      <div className="w-full bg-[#121212] border-2 border-neutral-800 rounded p-6 mb-6 text-center">
        <h2 className="text-2xl font-black uppercase tracking-tight mb-1 truncate text-brand-blue">{eventName}</h2>
        <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">TANDA MASUK VENUE</p>
      </div>

      <div className="bg-white p-4 rounded mb-6 border-4 border-neutral-200">
        <QRCode value={ticketCode} size={240} level="H" />
      </div>

      <div className="w-full space-y-4">
        <div className="flex justify-between items-end border-b-2 border-neutral-800 pb-3">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">GUEST NAME</span>
          <span className="text-lg font-black uppercase text-right leading-none">{guestName}</span>
        </div>
        <div className="flex justify-between items-end border-b-2 border-neutral-800 pb-3">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">TICKET UID</span>
          <span className="text-xl font-black text-brand-purple uppercase font-mono leading-none">{ticketCode}</span>
        </div>
        <div className="flex justify-between items-center pt-2">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">VERIFICATION</span>
          <div className="flex items-center gap-2 bg-brand-green/10 px-3 py-1.5 rounded border border-brand-green/30 text-brand-green">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-black uppercase">{isPaid ? 'LUNAS (VERIFIED)' : 'PENDING'}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 text-[9px] font-bold text-neutral-600 text-center uppercase tracking-widest border-t border-neutral-900 pt-6">
        Tunjukkan QR Code ini kepada staf gate di lokasi acara.<br/>
        Satu tiket hanya berlaku untuk satu kali penukaran.
      </div>
    </div>
  );
});

TicketGraphic.displayName = 'TicketGraphic';

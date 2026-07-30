import React, { forwardRef } from 'react';
import QRCode from 'react-qr-code';
import { CheckCircle2 } from 'lucide-react';

export const TicketGraphic = forwardRef(({ eventName, guestName, ticketCode, isPaid }, ref) => {
  return (
    <div
      ref={ref}
      className="absolute top-[-9999px] left-[-9999px] w-[500px] bg-[#0a0a0a] text-white p-8 border-[4px] border-neutral-900 rounded-xl flex flex-col items-center justify-center font-sans"
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      {/* Brand Header using Website Logo & Style */}
      <div className="flex items-center gap-3 mb-6">
        <img src="/logo.png" alt="LokTik Logo" className="h-10 w-auto object-contain" />
        <div className="flex flex-col text-left">
          <span className="text-xl font-black tracking-tighter text-white uppercase leading-none">
            LOK<span className="text-brand-blue">TIK</span>
          </span>
          <span className="text-[9px] font-mono font-extrabold text-brand-purple tracking-widest uppercase mt-1">
            OFFICIAL E-TICKET
          </span>
        </div>
      </div>

      {/* Event Name Box (With Wrap Support and Leading-Snug to prevent overlapping) */}
      <div className="w-full bg-[#121212] border-2 border-neutral-800 rounded p-6 mb-6 text-center flex flex-col justify-center items-center">
        <h2 className="text-2xl font-black uppercase tracking-tight leading-snug text-brand-blue mb-2 text-center w-full">
          {eventName}
        </h2>
        <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest leading-none">
          TANDA MASUK VENUE
        </p>
      </div>

      {/* QR Code */}
      <div className="bg-white p-4 rounded mb-6 border-4 border-neutral-200 flex items-center justify-center">
        <QRCode value={ticketCode || 'LOKTIK'} size={240} level="H" />
      </div>

      {/* Ticket Details using traditional Table to prevent html2canvas flexbox rendering issues */}
      <table className="w-full border-collapse mt-4">
        <tbody>
          {/* Guest Name Row */}
          <tr className="border-b-2 border-neutral-800">
            <td className="py-3.5 text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-left align-middle" style={{ lineHeight: '1.6' }}>
              GUEST NAME
            </td>
            <td className="py-3.5 text-lg font-black uppercase text-white text-right align-middle max-w-[280px] truncate" style={{ lineHeight: '1.6' }}>
              {guestName}
            </td>
          </tr>

          {/* Ticket UID Row */}
          <tr className="border-b-2 border-neutral-800">
            <td className="py-3.5 text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-left align-middle" style={{ lineHeight: '1.6' }}>
              TICKET UID
            </td>
            <td className="py-3.5 text-xl font-black text-brand-purple uppercase font-mono text-right align-middle" style={{ lineHeight: '1.6' }}>
              {ticketCode}
            </td>
          </tr>

          {/* Verification Row */}
          <tr>
            <td className="py-3.5 text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-left align-middle" style={{ lineHeight: '1.6' }}>
              VERIFICATION
            </td>
            <td 
              className={`py-3.5 text-right align-middle font-black text-sm tracking-wider uppercase ${
                isPaid ? 'text-brand-green' : 'text-brand-red'
              }`}
              style={{ lineHeight: '1.6' }}
            >
              {isPaid ? '[ LUNAS (VERIFIED) ]' : '[ PENDING ]'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Footer Instructions */}
      <div className="mt-8 text-[9px] font-bold text-neutral-600 text-center uppercase tracking-widest border-t border-neutral-900 pt-6">
        Tunjukkan QR Code ini kepada staf gate di lokasi acara.<br/>
        Satu tiket hanya berlaku untuk satu kali penukaran.
      </div>
    </div>
  );
});

TicketGraphic.displayName = 'TicketGraphic';

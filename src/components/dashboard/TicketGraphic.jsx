import React, { forwardRef } from 'react';

export const TicketGraphic = forwardRef(({
  eventName,
  guestName,
  ticketCode,
  isPaid,
  isReady,
  categoryName,
  ticketLabel,
  orderLookupCode,
}, ref) => {
  // Gunakan img PNG dari qrserver agar html2canvas bisa render dengan benar.
  // react-qr-code menggunakan SVG yang sering gagal di-capture html2canvas.
  const qrImageUrl = ticketCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(ticketCode)}&ecc=H`
    : null;

  return (
    <div
      ref={ref}
      data-ticket-ready={isReady ? 'true' : 'false'}
      className="absolute top-[-9999px] left-[-9999px] w-[500px] bg-[#0a0a0a] text-white p-8 border-[4px] border-neutral-900 rounded-xl flex flex-col items-center justify-center font-sans"
      style={{ fontFamily: "'Montserrat', sans-serif", opacity: isReady ? 1 : 0 }}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-6">
        <img src="/logo.png" alt="LokTik Logo" className="h-10 w-auto object-contain" crossOrigin="anonymous" />
        <div className="flex flex-col text-left">
          <span className="text-xl font-black tracking-tighter text-white uppercase leading-none">
            LOK<span className="text-brand-blue">TIK</span>
          </span>
          <span className="text-[9px] font-mono font-extrabold text-brand-purple tracking-widest uppercase mt-1">
            OFFICIAL E-TICKET
          </span>
        </div>
      </div>

      {/* Event Name Box */}
      <div className="w-full bg-[#121212] border-2 border-neutral-800 rounded p-6 mb-6 text-center flex flex-col justify-center items-center">
        <h2 className="text-2xl font-black uppercase tracking-tight leading-snug text-brand-blue mb-2 text-center w-full">
          {eventName}
        </h2>
        {categoryName && (
          <p className="text-xs font-black text-brand-yellow uppercase tracking-[0.25em] mb-2">
            {categoryName}
          </p>
        )}
        <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest leading-none">
          {ticketLabel || 'TANDA MASUK VENUE'}
        </p>
      </div>

      {/* QR Code — gunakan <img> PNG bukan SVG supaya html2canvas bisa capture */}
      <div className="bg-white p-4 rounded mb-6 border-4 border-neutral-200 flex items-center justify-center">
        {qrImageUrl ? (
          <img
            src={qrImageUrl}
            alt={ticketCode}
            width={240}
            height={240}
            crossOrigin="anonymous"
            style={{ display: 'block' }}
          />
        ) : (
          <div style={{ width: 240, height: 240, background: '#eee' }} />
        )}
      </div>

      {/* Ticket Details */}
      <table className="w-full border-collapse mt-4">
        <tbody>
          <tr className="border-b-2 border-neutral-800">
            <td className="py-3.5 text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-left align-middle" style={{ lineHeight: '1.6' }}>
              GUEST NAME
            </td>
            <td className="py-3.5 text-lg font-black uppercase text-white text-right align-middle max-w-[280px] truncate" style={{ lineHeight: '1.6' }}>
              {guestName}
            </td>
          </tr>

          <tr className="border-b-2 border-neutral-800">
            <td className="py-3.5 text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-left align-middle" style={{ lineHeight: '1.6' }}>
              TICKET UID
            </td>
            <td className="py-3.5 text-xl font-black text-brand-purple uppercase font-mono text-right align-middle" style={{ lineHeight: '1.6' }}>
              {ticketCode}
            </td>
          </tr>

          <tr className="border-b-2 border-neutral-800">
            <td className="py-3.5 text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-left align-middle" style={{ lineHeight: '1.6' }}>
              {categoryName ? 'KATEGORI' : 'ORDER ID'}
            </td>
            <td className="py-3.5 text-base font-black uppercase text-brand-yellow text-right align-middle" style={{ lineHeight: '1.6' }}>
              {categoryName || orderLookupCode}
              {categoryName && orderLookupCode ? (
                <span className="block text-[11px] text-neutral-500 font-mono mt-1">
                  Order ID: {orderLookupCode}
                </span>
              ) : null}
            </td>
          </tr>

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

      {/* Footer */}
      <div className="mt-8 text-[9px] font-bold text-neutral-600 text-center uppercase tracking-widest border-t border-neutral-900 pt-6">
        Tunjukkan QR Code ini kepada staf gate di lokasi acara.<br/>
        Satu kode berlaku untuk satu unit tiket sesuai kategori yang tertera.
      </div>
    </div>
  );
});

TicketGraphic.displayName = 'TicketGraphic';

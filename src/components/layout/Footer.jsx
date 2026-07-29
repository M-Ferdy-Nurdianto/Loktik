import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Footer = () => {
  const location = useLocation();
  const isDashboard =
    location.pathname.startsWith('/eo/dashboard') ||
    location.pathname.startsWith('/admin/dashboard');

  // Hide Footer when logged in on Dashboard pages
  if (isDashboard) {
    return null;
  }

  return (
    <footer className="w-full bg-[#0a0a0a] border-t border-neutral-800 py-6 sm:py-8 px-4 sm:px-8 text-neutral-400 text-xs font-mono pb-20 sm:pb-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
        <div className="space-y-1 flex flex-col sm:flex-row items-center sm:items-start space-y-1 sm:space-y-0 sm:space-x-3">
          <img src="/logo.png" alt="LokTik Logo" className="h-8 w-auto object-contain shrink-0 mb-1 sm:mb-0" />
          <div>
            <p className="font-extrabold text-white uppercase text-sm">LOKTIK.WEB.ID</p>
            <p className="text-[11px] text-neutral-500 font-sans">
              Platform Ticketing Event Lokal, Seminar, Bazar UMKM, &amp; Acara Komunitas.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center space-x-4 sm:space-x-6 text-[11px] font-bold">
          <Link to="/terms" className="hover:text-brand-blue transition-colors py-1 px-2 rounded touch-press">
            SYARAT &amp; KETENTUAN (S&amp;K)
          </Link>
          <Link to="/for-eo" className="hover:text-brand-blue transition-colors py-1 px-2 rounded touch-press">
            INFO LENGKAP EO
          </Link>
        </div>

        <div className="sm:text-right text-center space-y-0.5">
          <p className="text-[11px]">© 2026 LOKTIK. ALL RIGHTS RESERVED.</p>
          <p className="text-[10px] text-brand-blue font-bold uppercase">
            0% POTONGAN TIKET, TRANSFER DIRECT KE PANITIA.
          </p>
        </div>
      </div>
    </footer>
  );
};

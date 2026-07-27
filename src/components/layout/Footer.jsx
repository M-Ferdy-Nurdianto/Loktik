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
    <footer className="w-full bg-[#0a0a0a] border-t border-neutral-800 py-8 px-4 md:px-8 text-neutral-400 text-xs font-mono">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-left space-y-1">
          <p className="font-extrabold text-white uppercase text-sm">LOKTIK.WEB.ID</p>
          <p className="text-[11px] text-neutral-500 font-sans">
            Platform Ticketing Event Lokal, Seminar, Bazar UMKM, &amp; Acara Komunitas.
          </p>
        </div>

        <div className="flex items-center space-x-6">
          <Link to="/terms" className="hover:text-brand-green transition-colors">
            SYARAT &amp; KETENTUAN (S&amp;K)
          </Link>
          <Link to="/for-eo" className="hover:text-brand-purple transition-colors">
            PORTAL UNTUK EO
          </Link>
        </div>

        <div className="text-right">
          <p>© 2026 LOKTIK. ALL RIGHTS RESERVED.</p>
          <p className="text-[10px] text-brand-green font-bold uppercase">
            0% POTONGAN TIKET, TRANSFER LANGSUNG KE REKENING PANITIA.
          </p>
        </div>
      </div>
    </footer>
  );
};

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Ticket, Sparkles, Search } from 'lucide-react';
import { Button } from '../ui/Button';
import { TicketLookupModal } from '../public/TicketLookupModal';

export const Navbar = () => {
  const location = useLocation();
  const [isLookupOpen, setIsLookupOpen] = useState(false);

  const isDashboard =
    location.pathname.startsWith('/eo/dashboard') ||
    location.pathname.startsWith('/admin/dashboard');

  // Hide Navbar when logged in on Dashboard pages
  if (isDashboard) {
    return null;
  }

  const isEoPage = location.pathname.startsWith('/for-eo') || location.pathname.startsWith('/eo');

  return (
    <header className="w-full bg-[#0a0a0a]/95 backdrop-blur-md border-b border-neutral-800/80 py-3 sm:py-4 px-3 sm:px-8 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2.5 group touch-press">
          <img src="/logo.png" alt="LokTik Logo" className="h-8 sm:h-10 w-auto object-contain group-hover:scale-105 transition-transform" />
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-black tracking-tighter text-white uppercase leading-none">
              LOK<span className="text-brand-blue">TIK</span>
            </span>
            <span className="text-[8px] sm:text-[9px] font-mono font-extrabold text-neutral-400 tracking-widest uppercase mt-0.5">
              DIRECT DIGITAL TICKETING
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center space-x-2 sm:space-x-3">
          <button
            type="button"
            onClick={() => setIsLookupOpen(true)}
            className="text-xs font-black uppercase tracking-wider transition-colors px-2.5 sm:px-3 py-1.5 rounded-lg touch-press text-brand-blue bg-brand-blue/10 border border-brand-blue/30 flex items-center space-x-1 hover:bg-brand-blue/20"
          >
            <Search className="w-3.5 h-3.5" />
            <span>CEK TIKET</span>
          </button>

          <Link
            to="/"
            className={`text-xs font-extrabold uppercase tracking-wider transition-colors px-2.5 sm:px-3 py-1.5 rounded-lg touch-press ${
              location.pathname === '/' ? 'text-brand-blue bg-brand-blue/10 border border-brand-blue/30' : 'text-neutral-300 hover:text-white'
            }`}
          >
            EVENT
          </Link>

          <Link
            to="/for-eo"
            className={`text-xs font-extrabold uppercase tracking-wider transition-colors px-2.5 sm:px-3 py-1.5 rounded-lg touch-press ${
              isEoPage ? 'text-brand-blue bg-brand-blue/10 border border-brand-blue/30' : 'text-neutral-300 hover:text-white'
            }`}
          >
            ABOUT
          </Link>

          <Link to="/eo/login" className="touch-press">
            <Button variant="blue" size="sm" className="text-xs px-3.5 sm:px-4 py-1.5 min-h-[36px] font-black tracking-wider uppercase">
              LOGIN
            </Button>
          </Link>
        </nav>
      </div>

      {/* Ticket Self-Service Lookup Modal */}
      <TicketLookupModal isOpen={isLookupOpen} onClose={() => setIsLookupOpen(false)} />
    </header>
  );
};

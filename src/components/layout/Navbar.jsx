import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Ticket, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

export const Navbar = () => {
  const location = useLocation();
  const isDashboard =
    location.pathname.startsWith('/eo/dashboard') ||
    location.pathname.startsWith('/admin/dashboard');

  // Hide Navbar when logged in on Dashboard pages
  if (isDashboard) {
    return null;
  }

  const isEoPage = location.pathname.startsWith('/for-eo') || location.pathname.startsWith('/eo');

  return (
    <header className="w-full bg-[#0a0a0a]/90 backdrop-blur-md border-b border-neutral-800/80 py-4 px-4 md:px-8 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="bg-brand-green text-black p-2 rounded-md shadow-[0_0_12px_rgba(57,255,20,0.4)] group-hover:scale-105 transition-transform">
            <Ticket className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter text-white uppercase">
              LOK<span className="text-brand-green">TIK</span>
            </span>
            <span className="text-[9px] font-extrabold text-neutral-400 tracking-widest uppercase">
              EVENT TICKETING DIRECT
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center space-x-3 sm:space-x-5">
          <Link
            to="/"
            className={`text-xs font-bold uppercase tracking-wider transition-colors ${
              location.pathname === '/' ? 'text-brand-green' : 'text-neutral-300 hover:text-white'
            }`}
          >
            Jelajah Event
          </Link>
          
          <Link
            to="/for-eo"
            className={`hidden sm:inline-flex items-center space-x-1 text-xs font-bold uppercase tracking-wider transition-colors ${
              isEoPage ? 'text-brand-purple' : 'text-neutral-300 hover:text-brand-purple'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-purple" />
            <span>Untuk Panitia / EO</span>
          </Link>

          <Link to="/for-eo">
            <Button variant="green" size="sm">
              Buat Event
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
};

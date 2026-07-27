import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

export const CtaSection = () => {
  return (
    <section className="py-20 max-w-6xl mx-auto px-4 md:px-8 text-center">
      <div className="relative p-8 sm:p-14 rounded-2xl bg-gradient-to-r from-brand-purple/20 via-neutral-900 to-brand-green/20 border border-neutral-800 space-y-5 overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-2xl mx-auto">
          <p className="text-xs font-black text-brand-green uppercase tracking-widest">
            PLATFORM TIKET LOKAL &amp; UMKM
          </p>

          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight">
            SIAP JUAL TIKET ACARA TANPA POTONGAN BIAYA?
          </h2>

          <p className="text-xs sm:text-sm text-neutral-300 font-medium">
            Buat acara Anda sekarang, tanpa biaya pendaftaran awal, dan nikmati transfer 100% langsung ke rekening panitia.
          </p>

          <div className="pt-3">
            <Link to="/eo/login">
              <Button variant="green" size="lg" className="px-8 py-3.5 text-sm flex items-center justify-center space-x-2 mx-auto">
                <span>BUAT EVENT SEKARANG</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

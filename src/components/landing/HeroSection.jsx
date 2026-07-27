import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const HeroSection = () => {
  return (
    <section className="relative pt-16 md:pt-20 pb-16 overflow-hidden bg-gradient-to-b from-[#141414] via-[#0d0d0d] to-[#0a0a0a]">
      {/* Subtle Background Glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-brand-green/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10 text-center space-y-6">
        {/* Simple Badge */}
        <div className="inline-flex items-center space-x-2 bg-neutral-900 border border-neutral-800 px-3.5 py-1.5 rounded-full">
          <Badge variant="green">0% POTONGAN</Badge>
          <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
            PLATFORM TIKET EVENT LOKAL &amp; UMKM
          </span>
        </div>

        {/* Clean Universal Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter uppercase leading-[0.95] text-white max-w-4xl mx-auto">
          JUAL TIKET EVENT <br />
          <span className="text-brand-green">
            TANPA POTONGAN BIAYA
          </span>
        </h1>

        {/* Clean Universal Sub-headline */}
        <p className="text-base sm:text-lg text-neutral-300 font-medium max-w-2xl mx-auto leading-relaxed">
          Platform simpel jual beli tiket online untuk berbagai acara lokal, bazar UMKM, seminar, workshop, hingga festival. Pembayaran langsung masuk ke rekening panitia tanpa komisi platform.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link to="/eo/login" className="w-full sm:w-auto">
            <Button variant="green" size="lg" className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3.5 text-base">
              <span>BUAT EVENT SEKARANG</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <a href="#events" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-3.5 text-base">
              LIHAT DAFTAR ACARA
            </Button>
          </a>
        </div>

        {/* Simple Points */}
        <div className="pt-6 flex flex-wrap justify-center items-center gap-6 text-xs text-neutral-400 font-bold uppercase tracking-wider">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-brand-green" />
            <span>0% Potongan Penjualan</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-brand-green" />
            <span>Transfer Langsung Ke Rekening Panitia</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-brand-green" />
            <span>Scan QR Tiket Pakai HP</span>
          </div>
        </div>
      </div>
    </section>
  );
};

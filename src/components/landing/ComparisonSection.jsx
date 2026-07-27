import React from 'react';
import { X, Check } from 'lucide-react';
import { Card } from '../ui/Card';

export const ComparisonSection = () => {
  return (
    <section className="py-24 max-w-7xl mx-auto px-4 md:px-8 space-y-12 text-left">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <p className="text-xs font-black text-brand-blue uppercase tracking-widest">PERBANDINGAN PLATFORM</p>
        <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
          MENGAPA EO MEMILIH LOKTIK?
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Traditional Platforms */}
        <Card variant="dark" className="border-red-900/50 bg-red-950/10 space-y-6 p-8">
          <div className="space-y-1 border-b border-red-900/40 pb-4">
            <span className="text-xs font-bold text-red-400 uppercase tracking-widest">PLATFORM TICKETING BIASA</span>
            <h3 className="text-2xl font-black uppercase text-white">POTONGAN BIAYA PER TIKET</h3>
          </div>
          <ul className="space-y-4 text-xs font-semibold text-neutral-400">
            <li className="flex items-center space-x-3">
              <X className="w-5 h-5 text-red-500 shrink-0" />
              <span>Potongan biaya platform 5% - 10% dari setiap tiket terjual</span>
            </li>
            <li className="flex items-center space-x-3">
              <X className="w-5 h-5 text-red-500 shrink-0" />
              <span>Pencairan dana tertahan hingga H+3 setelah event selesai</span>
            </li>
            <li className="flex items-center space-x-3">
              <X className="w-5 h-5 text-red-500 shrink-0" />
              <span>Biaya administrasi payment gateway dibebankan ke pembeli</span>
            </li>
            <li className="flex items-center space-x-3">
              <X className="w-5 h-5 text-red-500 shrink-0" />
              <span>Proses pencairan dana butuh verifikasi berkas yang rumit</span>
            </li>
          </ul>
        </Card>

        {/* LokTik */}
        <Card variant="dark" className="border-brand-green/50 bg-brand-green/5 space-y-6 p-8">
          <div className="space-y-1 border-b border-brand-green/30 pb-4">
            <span className="text-xs font-bold text-brand-green uppercase tracking-widest">LOKTIK PLATFORM</span>
            <h3 className="text-2xl font-black uppercase text-white">0% FEES &amp; DIRECT TRANSFER</h3>
          </div>
          <ul className="space-y-4 text-xs font-bold text-neutral-200">
            <li className="flex items-center space-x-3">
              <Check className="w-5 h-5 text-brand-green shrink-0" />
              <span>0% Potongan platform per tiket. 100% uang tiket milik panitia</span>
            </li>
            <li className="flex items-center space-x-3">
              <Check className="w-5 h-5 text-brand-green shrink-0" />
              <span>Uang transfer pembeli langsung masuk ke rekening/QRIS EO saat itu juga</span>
            </li>
            <li className="flex items-center space-x-3">
              <Check className="w-5 h-5 text-brand-green shrink-0" />
              <span>Bebas biaya administrasi tambahan bagi pembeli</span>
            </li>
            <li className="flex items-center space-x-3">
              <Check className="w-5 h-5 text-brand-green shrink-0" />
              <span>Dilengkapi fitur Kasir OTS &amp; Realtime Gate Scanner WebSocket</span>
            </li>
          </ul>
        </Card>
      </div>
    </section>
  );
};

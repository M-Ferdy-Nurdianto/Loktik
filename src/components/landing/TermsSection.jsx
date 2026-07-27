import React from 'react';
import { ShieldCheck, AlertTriangle, FileText } from 'lucide-react';
import { Card } from '../ui/Card';

export const TermsSection = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 pt-8 space-y-6 text-left">
      <div className="border-b border-neutral-800 pb-4 space-y-1">
        <h2 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
          SYARAT &amp; KETENTUAN (S&amp;K)
        </h2>
        <p className="text-xs font-bold text-neutral-400 uppercase">
          Ketentuan penggunaan tiket online LokTik bagi Pembeli &amp; Panitia Event.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-neutral-300">
        <Card variant="dark" className="p-5 space-y-3 border-neutral-800">
          <div className="flex items-center space-x-2 text-brand-green">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="text-sm font-extrabold uppercase text-white">1. PERAN PLATFORM</h3>
          </div>
          <p className="text-neutral-400 font-medium leading-relaxed">
            LokTik adalah penyedia sistem tiket direct. Uang tiket ditransfer langsung ke rekening / QRIS Panitia Event (EO). LokTik tidak menahan dana Anda.
          </p>
        </Card>

        <Card variant="dark" className="p-5 space-y-3 border-neutral-800">
          <div className="flex items-center space-x-2 text-brand-purple">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-sm font-extrabold uppercase text-white">2. TANGGUNG JAWAB EVENT</h3>
          </div>
          <p className="text-neutral-400 font-medium leading-relaxed">
            Pelaksanaan acara, artis, jam open gate, dan pengembalian dana (*refund*) merupakan tanggung jawab penuh Panitia Event (EO) bersangkutan.
          </p>
        </Card>

        <Card variant="dark" className="p-5 space-y-3 border-neutral-800">
          <div className="flex items-center space-x-2 text-brand-blue">
            <FileText className="w-5 h-5" />
            <h3 className="text-sm font-extrabold uppercase text-white">3. PENUKARAN TIKET</h3>
          </div>
          <p className="text-neutral-400 font-medium leading-relaxed">
            Satu (1) QR Code tiket berlaku untuk satu (1) kali scan di pintu masuk venue (*wristband exchange*). Tiket otomatis hangus setelah di-scan.
          </p>
        </Card>
      </div>
    </section>
  );
};

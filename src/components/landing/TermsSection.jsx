import React from 'react';
import { ShieldCheck, AlertTriangle, FileText } from 'lucide-react';
import { Card } from '../ui/Card';

export const TermsSection = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 pt-8 space-y-6 text-left">
      <div className="border-b border-neutral-800 pb-4 space-y-1">
        <h2 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
          SYARAT &amp; KETENTUAN (S&amp;K ATURAN MAIN)
        </h2>
        <p className="text-xs font-bold text-neutral-400 uppercase">
          Aturan main simpel buat pembeli &amp; panitia event di LokTik.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs text-neutral-300">
        <Card variant="dark" className="p-5 space-y-3 border-neutral-800">
          <div className="flex items-center space-x-2 text-brand-blue">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="text-sm font-extrabold uppercase text-white">1. SISTEM DIRECT PAYMENT</h3>
          </div>
          <p className="text-neutral-400 font-medium leading-relaxed">
            LokTik itu penyedia sistem tiket direct. Uang tiket langsung dikirim ke rekening/QRIS panitia acara. Duit kamu aman, nggak bakal ditahan platform.
          </p>
        </Card>

        <Card variant="dark" className="p-5 space-y-3 border-neutral-800">
          <div className="flex items-center space-x-2 text-brand-purple">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-sm font-extrabold uppercase text-white">2. ACARA &amp; REFUND EVENT</h3>
          </div>
          <p className="text-neutral-400 font-medium leading-relaxed">
            Jalan acara, lineup artis, open gate, dan urusan refund misal acara batal itu 100% jadi ranah &amp; tanggung jawab panitia EO bersangkutan.
          </p>
        </Card>

        <Card variant="dark" className="p-5 space-y-3 border-neutral-800">
          <div className="flex items-center space-x-2 text-brand-blue">
            <FileText className="w-5 h-5" />
            <h3 className="text-sm font-extrabold uppercase text-white">3. TIKET FISIK VENUE</h3>
          </div>
          <p className="text-neutral-400 font-medium leading-relaxed">
            Satu QR Code tiket berlaku buat 1 kali scan pas ganti tiket fisik di venue. Begitu beres di-scan, status tiket otomatis hangus biar gak dipake ulang.
          </p>
        </Card>

        <Card variant="dark" className="p-5 space-y-3 border-neutral-800">
          <div className="flex items-center space-x-2 text-brand-purple">
            <FileText className="w-5 h-5" />
            <h3 className="text-sm font-extrabold uppercase text-white">4. CARA TERIMA E-TIKET</h3>
          </div>
          <p className="text-neutral-400 font-medium leading-relaxed">
            Begitu bukti transfer di-approve panitia, e-tiket kamu langsung aktif &amp; bisa didownload sendiri kapan aja di website pakai Kode ID Pesanan. Kirim ke WhatsApp cuma opsi tambahan dari panitia, bukan satu-satunya jalan — jadi <strong className="text-white">wajib simpan Kode ID Pesanan kamu</strong>.
          </p>
        </Card>
      </div>
    </section>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Ticket, QrCode, Smartphone, Zap, ArrowRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const ForEO = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: <Zap className="w-6 h-6 text-brand-green" />,
      title: '0% POTONGAN KOMISI TIKET',
      description: 'Seluruh dana hasil penjualan tiket masuk 100% utuh ke rekening / QRIS panitia EO tanpa potongan platform.',
    },
    {
      icon: <Ticket className="w-6 h-6 text-brand-purple" />,
      title: 'TRANSFER DIRECT KE REKENING PANITIA',
      description: 'Pembeli mentransfer pembayaran langsung ke rekening bank atau barcode QRIS milik panitia acara.',
    },
    {
      icon: <QrCode className="w-6 h-6 text-brand-blue" />,
      title: 'GATE SCANNER CAM HP REALTIME',
      description: 'Verifikasi tiket di pintu masuk venue cukup menggunakan kamera HP staf tanpa perlu beli scanner sewa mahal.',
    },
    {
      icon: <Smartphone className="w-6 h-6 text-brand-yellow" />,
      title: 'KASIR OTS VENUE LOKASI',
      description: 'Pencatatan cepat tiket tunai/QRIS langsung di lokasi venue dengan cetak kode gelang otomatis.',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 space-y-12 text-left">
      {/* Top Banner */}
      <div className="space-y-4 max-w-3xl">
        <Badge variant="green">PLATFORM TIKET EVENT LOKAL &amp; UMKM</Badge>
        <h1 className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight leading-none">
          JUAL TIKET EVENT TANPA POTONGAN BIAYA
        </h1>
        <p className="text-sm sm:text-base font-medium text-neutral-400">
          Solusi sistem ticketing langsung untuk panitia event musik lokal, festival UMKM, seminar, bazar, dan acara komunitas.
        </p>
        <div className="pt-2 flex flex-wrap gap-4">
          <Button variant="green" size="lg" onClick={() => navigate('/eo/login')}>
            MASUK PORTAL EO <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/')}>
            JELAJAH KATALOG EVENT
          </Button>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {benefits.map((b, idx) => (
          <Card key={idx} variant="dark" className="p-6 space-y-3 border-neutral-800 hover:border-brand-green/50 transition-colors">
            <div className="p-2 bg-neutral-900 w-fit rounded-md border border-neutral-800">{b.icon}</div>
            <h3 className="text-lg font-black uppercase text-white">{b.title}</h3>
            <p className="text-xs text-neutral-400 font-medium leading-relaxed">{b.description}</p>
          </Card>
        ))}
      </div>

      {/* Bottom CTA Card */}
      <Card variant="dark" className="p-8 space-y-4 border-brand-green/40 bg-gradient-to-r from-neutral-950 via-neutral-900 to-black text-center">
        <h2 className="text-2xl font-black uppercase text-white">SIAP MENGELOLA TIKET EVENT ANDA?</h2>
        <p className="text-xs text-neutral-400 max-w-lg mx-auto font-medium">
          Daftarkan akun EO Anda melalui Admin LokTik, lalu buat event &amp; jual tiket tanpa potongan biaya sekarang juga.
        </p>
        <Button variant="green" size="lg" onClick={() => navigate('/eo/login')} className="mx-auto">
          MASUK DASHBOARD PANITIA EO
        </Button>
      </Card>
    </div>
  );
};

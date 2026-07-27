import React from 'react';
import { Wallet, QrCode, ShieldCheck, Ticket, Users, FileSpreadsheet } from 'lucide-react';
import { Card } from '../ui/Card';

export const FeaturesSection = () => {
  const features = [
    {
      icon: <Wallet className="w-5 h-5 text-brand-green" />,
      title: 'Uang Transfer Langsung Ke Panitia',
      description: 'Pembeli mentransfer dana tiket langsung ke rekening bank atau QRIS panitia. Uang tidak tertahan di platform.',
    },
    {
      icon: <QrCode className="w-5 h-5 text-brand-purple" />,
      title: 'Scan QR Pakai HP Panitia',
      description: 'Cukup buka browser HP di pintu masuk untuk memverifikasi tiket QR pembeli. Bebas repot tanpa perlu sewa alat mahal.',
    },
    {
      icon: <Ticket className="w-5 h-5 text-brand-blue" />,
      title: 'Cocok Untuk Segala Jenis Event',
      description: 'Bisa digunakan untuk konser, seminar, workshop, bazar UMKM, pameran, festival, hingga acara komunitas.',
    },
    {
      icon: <FileSpreadsheet className="w-5 h-5 text-brand-yellow" />,
      title: 'Download Rekap Penonton Excel',
      description: 'Unduh daftar nama & WhatsApp penonton dalam format Excel kapan saja untuk keperluan verifikasi.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-brand-green" />,
      title: 'Tiket QR Bebas Pemalsuan',
      description: 'Setiap tiket memiliki Kode QR unik yang otomatis terkunci begitu discan di pintu masuk lokasi acara.',
    },
    {
      icon: <Users className="w-5 h-5 text-brand-purple" />,
      title: 'Halaman Event Siap Bagikan',
      description: 'Dapatkan halaman event khusus yang siap dibagikan ke calon pembeli di media sosial & grup chat.',
    },
  ];

  return (
    <section className="py-20 max-w-6xl mx-auto px-4 md:px-8 space-y-10 text-left">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <p className="text-xs font-black text-brand-green uppercase tracking-widest">FITUR UNGGULAN</p>
        <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
          DIBUAT UNTUK KEMUDAHAN PANITIA
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feat, idx) => (
          <Card key={idx} variant="dark" hover className="space-y-2.5 p-5 border-neutral-800/80">
            <div className="p-2.5 bg-neutral-900 rounded-md inline-block border border-neutral-800">
              {feat.icon}
            </div>
            <h3 className="text-base font-extrabold uppercase text-white tracking-tight">{feat.title}</h3>
            <p className="text-xs text-neutral-400 font-medium leading-relaxed">{feat.description}</p>
          </Card>
        ))}
      </div>
    </section>
  );
};

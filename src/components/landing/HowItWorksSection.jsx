import React from 'react';
import { Card } from '../ui/Card';

export const HowItWorksSection = () => {
  const steps = [
    {
      step: '01',
      title: 'Buat Event & Kategori Tiket',
      description: 'Isi nama acara, tanggal, lokasi, dan tentukan harga tiket yang ingin dijual.',
      accent: 'text-brand-green border-brand-green',
    },
    {
      step: '02',
      title: 'Sebarkan Link & Cek Pembayaran',
      description: 'Bagikan link event ke media sosial. Pembeli transfer langsung ke rekening/QRIS panitia.',
      accent: 'text-brand-purple border-brand-purple',
    },
    {
      step: '03',
      title: 'Scan Tiket QR Saat Hari-H',
      description: 'Staf gate cukup scan QR Code pembeli dari kamera HP untuk penukaran tiket / gelang.',
      accent: 'text-brand-blue border-brand-blue',
    },
  ];

  return (
    <section className="py-16 bg-[#0d0d0d] border-y border-neutral-800 text-left">
      <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <p className="text-xs font-black text-brand-purple uppercase tracking-widest">ALUR SIMPEL</p>
          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white">
            CARA KERJA DALAM 3 LANGKAH
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s, idx) => (
            <Card key={idx} variant="dark" hover className="space-y-3 p-6">
              <span className={`text-3xl font-black ${s.accent} border-b-2 pb-1 inline-block`}>
                {s.step}
              </span>
              <h3 className="text-lg font-extrabold uppercase text-white tracking-tight">{s.title}</h3>
              <p className="text-xs text-neutral-400 font-medium leading-relaxed">{s.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

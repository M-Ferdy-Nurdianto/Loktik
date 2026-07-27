import React from 'react';
import { Card } from '../ui/Card';

export const FaqSection = () => {
  const faqs = [
    {
      q: 'Bagaimana sistem pembayaran tiket di LokTik?',
      a: 'Pembeli mentransfer uang tiket langsung ke nomor rekening / barcode QRIS milik panitia EO. LokTik tidak menahan dana Anda.',
    },
    {
      q: 'Berapa potongan biaya komisi tiket?',
      a: '0% potongan komisi per tiket. Penjualan tiket Anda 100% milik panitia acara.',
    },
    {
      q: 'Bagaimana cara scan tiket di lokasi acara (venue)?',
      a: 'Panitia EO tinggal login ke dasbor, buka menu "Gate Scanner", dan arahkan kamera HP ke QR Code tiket pembeli. Sistem otomatis memverifikasi tiket valid.',
    },
    {
      q: 'Apakah bisa menjual tiket OTS (On The Spot) di venue?',
      a: 'Bisa! Tersedia menu khusus "Kasir OTS Venue" di dasbor EO untuk mencatat tiket tunai atau QRIS secara cepat langsung di pintu masuk.',
    },
  ];

  return (
    <section className="max-w-4xl mx-auto px-4 py-16 space-y-8 text-left">
      <div className="space-y-2 border-b border-neutral-800 pb-4">
        <h2 className="text-3xl font-black uppercase text-white tracking-tight">PERTANYAAN UMUM (FAQ)</h2>
        <p className="text-xs font-bold text-neutral-400 uppercase">Informasi lengkap penggunaan sistem tiket LokTik.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {faqs.map((faq, idx) => (
          <Card key={idx} variant="dark" className="p-6 space-y-2 border-neutral-800">
            <h3 className="text-sm font-extrabold text-brand-green uppercase tracking-wide">Q: {faq.q}</h3>
            <p className="text-xs text-neutral-300 font-medium leading-relaxed">A: {faq.a}</p>
          </Card>
        ))}
      </div>
    </section>
  );
};

import React from 'react';
import { Card } from '../ui/Card';

export const FaqSection = () => {
  const faqs = [
    {
      q: 'Bayar tiketnya gimana sih?',
      a: 'Langsung transfer ke rekening bank atau scan QRIS milik panitia EO. LokTik nggak megang/nahan duit kamu.',
    },
    {
      q: 'Ada potongan komisi tiket nggak?',
      a: 'Zero komisi! Duit hasil jualan tiket 100% utuh masuk ke kantong panitia acara.',
    },
    {
      q: 'Cara scan tiket di pintu masuk venue gimana?',
      a: 'Tim pintu masuk tinggal buka link Gate Portal + masukin PIN 1029 di HP, terus scan QR pembeli. Beres!',
    },
    {
      q: 'Bisa jualan tiket OTS langsung di tempat?',
      a: 'Bisa banget! Pake menu Kasir OTS di Gate Portal buat catat bayar tunai/QRIS langsung di venue.',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 pt-8 space-y-6 text-left">
      <div className="space-y-1 border-b border-neutral-800 pb-4">
        <h2 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">FAQ (YANG SERING DITANYAIN)</h2>
        <p className="text-xs font-bold text-neutral-400 uppercase">Jawaban simpel soal cara kerja tiket LokTik.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {faqs.map((faq, idx) => (
          <Card key={idx} variant="dark" className="p-5 space-y-2 border-neutral-800">
            <h3 className="text-sm font-extrabold text-brand-green uppercase tracking-wide">Q: {faq.q}</h3>
            <p className="text-xs text-neutral-300 font-medium leading-relaxed">A: {faq.a}</p>
          </Card>
        ))}
      </div>
    </section>
  );
};

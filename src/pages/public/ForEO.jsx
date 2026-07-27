import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Ticket, QrCode, Smartphone, Zap, ArrowRight, DollarSign, FileText, CheckCircle2, HelpCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const ForEO = () => {
  const navigate = useNavigate();

  const pricingTiers = [
    {
      name: 'PAKET DIRECT TIKET',
      price: 'Rp0 (0% KOMISI)',
      subtitle: '100% Hasil Penjualan Masuk ke Rekening EO',
      features: [
        '0% Potongan Komisi Tiket Platform',
        'Transfer Langsung ke Bank / QRIS Panitia',
        'Gate Portal & Live Realtime Scanner HP',
        'Kasir OTS Venue Fast-Issue Direct',
        'Fitur Emergency Guest List Check-in',
        'Akses Multi-Device Tanpa Batas Staf',
      ],
      highlight: true,
    },
  ];

  const eoTerms = [
    {
      title: '1. KEABSAHAN REKENING & DANA PEMBELI',
      desc: 'Seluruh pembayaran tiket ditransfer langsung oleh Pembeli ke nomor rekening bank atau barcode QRIS milik Panitia Event (EO). LokTik tidak menampung, memotong, atau menahan dana tiket.',
    },
    {
      title: '2. TANGGUNG JAWAB EVENT & REFUND',
      desc: 'Panitia Event (EO) bertanggung jawab 100% atas pelaksanaan acara, jadwal open gate, keabsahan tiket, dan proses Pengembalian Dana (Refund) apabila terjadi penundaan atau pembatalan acara.',
    },
    {
      title: '3. KEAMANAN AKSES STAF VENUE (GATE PIN)',
      desc: 'EO dapat membagikan tautan Gate Portal (/gate/slug-event) dan Event PIN (1029) kepada staf pintu masuk/kasir OTS tanpa perlu memberikan password akun utama EO.',
    },
    {
      title: '4. PENUKARAN TIKET & BUKTI SCAN',
      desc: 'Satu (1) QR Code tiket berlaku untuk satu (1) kali scan di lokasi venue. Tiket yang telah di-scan otomatis terkunci atomic (is_scanned = true) untuk mencegah tiket ganda.',
    },
  ];

  const steps = [
    { num: '01', title: 'LOGIN AKUN EO', desc: 'Masuk ke portal panitia melalui halaman login EO.' },
    { num: '02', title: 'BUAT EVENT & TIKET', desc: 'Isi detail acara, upload poster & QRIS, lalu tentukan kategori tiket.' },
    { num: '03', title: 'SEBARKAN LINK EVENT', desc: 'Publikasikan link event dan terima transfer langsung dari pembeli.' },
    { num: '04', title: 'AKSES GATE PORTAL', desc: 'Buka Gate Portal untuk tim venue melakukan scan & kasir OTS di lokasi.' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 space-y-10 text-left font-sans bg-[#0a0a0a] text-white">
      {/* Header Banner */}
      <div className="border-b border-neutral-800 pb-6 space-y-3">
        <Badge variant="purple" className="text-[10px] px-2.5 py-0.5">
          PANITIA &amp; EVENT ORGANIZER DIRECTORY
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-none">
          PANDUAN LENGKAP, TARIF, &amp; S&amp;K PANITIA EO
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-3xl leading-relaxed">
          Informasi transparan mengenai tarif layanan 0% komisi, alur kerja sistem tiket direct, dan Syarat &amp; Ketentuan resmi bagi penyelenggara acara di LokTik.
        </p>
      </div>

      {/* Pricing Section */}
      <div className="space-y-4">
        <div className="border-b border-neutral-800 pb-2">
          <h2 className="text-xl font-black uppercase text-brand-green tracking-tight flex items-center gap-2">
            <DollarSign className="w-5 h-5" /> TRANSPARANSI SKEMA BIAYA (PRICING EO)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          {pricingTiers.map((tier, idx) => (
            <Card key={idx} variant="dark" className="p-6 border-brand-green/40 bg-neutral-900/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-4">
                <div>
                  <h3 className="text-lg font-black uppercase text-white">{tier.name}</h3>
                  <p className="text-xs text-neutral-400">{tier.subtitle}</p>
                </div>
                <div className="text-2xl font-black font-mono text-brand-green">{tier.price}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                {tier.features.map((feat, fIdx) => (
                  <div key={fIdx} className="flex items-center space-x-2 text-xs font-bold text-neutral-300">
                    <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Step by Step Workflow */}
      <div className="space-y-4">
        <div className="border-b border-neutral-800 pb-2">
          <h2 className="text-xl font-black uppercase text-brand-purple tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5" /> 4 LANGKAH MUDAH MULAI JUAL TIKET
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {steps.map((st, idx) => (
            <Card key={idx} variant="dark" className="p-5 border-neutral-800 space-y-2">
              <span className="text-2xl font-black font-mono text-brand-purple">{st.num}</span>
              <h3 className="text-sm font-black uppercase text-white">{st.title}</h3>
              <p className="text-xs text-neutral-400 font-medium leading-relaxed">{st.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* EO Terms & Conditions Section */}
      <div className="space-y-4">
        <div className="border-b border-neutral-800 pb-2">
          <h2 className="text-xl font-black uppercase text-brand-blue tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5" /> SYARAT &amp; KETENTUAN (S&amp;K) KHUSUS PANITIA EO
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {eoTerms.map((term, idx) => (
            <Card key={idx} variant="dark" className="p-5 space-y-2 border-neutral-800">
              <h3 className="text-xs font-extrabold uppercase text-brand-blue tracking-wide">{term.title}</h3>
              <p className="text-xs text-neutral-400 font-medium leading-relaxed">{term.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom CTA Card */}
      <Card variant="dark" className="p-8 space-y-4 border-brand-green/40 bg-gradient-to-r from-neutral-950 via-neutral-900 to-black text-center">
        <h2 className="text-2xl font-black uppercase text-white">SIAP KELOLA TIKET EVENT ANDA SEKARANG?</h2>
        <p className="text-xs text-neutral-400 max-w-lg mx-auto font-medium">
          Masuk ke portal panitia, publikasikan event Anda, dan nikmati penjualan tiket tanpa potongan biaya platform.
        </p>
        <Button variant="green" size="lg" onClick={() => navigate('/eo/login')} className="mx-auto px-8 font-black">
          MASUK PORTAL EO / PANITIA <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Card>
    </div>
  );
};

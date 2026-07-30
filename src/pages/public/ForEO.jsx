import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Ticket, QrCode, Smartphone, Zap, ArrowRight, DollarSign, FileText, CheckCircle2, Clock, X } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FaqSection } from '../../components/landing/FaqSection';

export const ForEO = () => {
  const navigate = useNavigate();

  const pricingTiers = [
    {
      name: 'PAKET 1 BULAN',
      price: 'Rp200.000',
      period: '/ 1 Bulan',
      badge: 'MANUAL WHATSAPP',
      subtitle: 'Bebas Jualan Tiket 0% Komisi (Tanpa Layanan Bot WA)',
      waText: 'Halo%20Admin%20LokTik,%20saya%20tertarik%20memesan%20Paket%20LokTik%201%20Bulan%20(Rp200.000).',
      features: [
        { text: '0% Potongan Komisi Per Tiket', included: true },
        { text: 'Dana Direct Masuk Rekening EO', included: true },
        { text: 'Gate Venue & Realtime HP Scanner Staf', included: true },
        { text: 'Kasir OTS Venue Fast-Issue Direct', included: true },
        { text: 'Layanan Bot WA Otomatis Kirim Tiket', included: false },
        { text: 'Approve & Verifikasi Massal (Bot)', included: false },
      ],
      highlight: false,
    },
    {
      name: 'PAKET 3 BULAN',
      price: 'Rp300.000',
      period: '/ 3 Bulan',
      badge: 'REKOMENDASI EO',
      subtitle: 'Akses Bebas Jualan Tiket 0% Komisi + Bot WA Otomatis',
      waText: 'Halo%20Admin%20LokTik,%20saya%20tertarik%20memesan%20Paket%20LokTik%203%20Bulan%20(Rp300.000).',
      features: [
        { text: '0% Potongan Komisi Per Tiket', included: true },
        { text: 'Dana Direct Masuk Rekening EO', included: true },
        { text: 'Gate Venue & Realtime HP Scanner Staf', included: true },
        { text: 'Kasir OTS Venue Fast-Issue Direct', included: true },
        { text: 'Layanan Bot WA Otomatis Kirim Tiket', included: true },
        { text: 'Approve & Verifikasi Massal (Bot)', included: true },
      ],
      highlight: true,
    },
    {
      name: 'PAKET 1 TAHUN (PROMO)',
      price: 'Rp500.000',
      period: '/ 1 Tahun',
      badge: 'PROMO BOT WA',
      subtitle: 'Paket Hemat Bebas Jualan Tiket 1 Tahun + Bot WA Otomatis',
      waText: 'Halo%20Admin%20LokTik,%20saya%20tertarik%20memesan%20Paket%20LokTik%201%20Tahun%20(Rp500.000).',
      features: [
        { text: '0% Potongan Komisi Per Tiket', included: true },
        { text: 'Dana Direct Masuk Rekening EO', included: true },
        { text: 'Gate Venue & Realtime HP Scanner Staf', included: true },
        { text: 'Kasir OTS Venue Fast-Issue Direct', included: true },
        { text: 'Layanan Bot WA Otomatis Kirim Tiket', included: true },
        { text: 'Approve & Verifikasi Massal (Bot)', included: true },
      ],
      highlight: false,
    },
  ];

  const eoTerms = [
    {
      title: '1. REKENING & DANA TIKET DIRECT',
      desc: 'Pembayaran tiket langsung dikirim pembeli ke rekening bank atau QRIS panitia acara. LokTik nggak megang, nggak motong, dan nggak nahan duit tiket kamu.',
    },
    {
      title: '2. TANGGUNG JAWAB EVENT & REFUND',
      desc: 'Panitia EO bertanggung jawab penuh atas jalan acara, jadwal venue, keabsahan tiket, dan proses refund misal acara ditunda atau batal.',
    },
    {
      title: '3. AMAN BUAT STAF VENUE (GATE PIN)',
      desc: 'Kamu bisa share link Gate Venue (/gate/slug-event) dan PIN 1029 ke panitia pintu masuk atau kasir OTS tanpa takut password akun utama EO kamu ketahuan.',
    },
    {
      title: '4. PENUKARAN GELANG & PROTEKSI SCAN',
      desc: 'Satu QR Code tiket cuma bisa di-scan 1 kali pas penukaran gelang di venue. Setelah di-scan, status tiket otomatis terkunci biar nggak bisa dipake ganda.',
    },
    {
      title: '5. RETENSI DATA EVENT & TIKET (OTOMATIS HAPUS 2 MINGGU)',
      desc: 'Data event, transaksi pesanan, dan unit tiket yang sudah selesai akan dibersihkan/dihapus otomatis oleh sistem 2 minggu (14 hari) setelah tanggal acara berakhir.',
    },
  ];

  const steps = [
    { num: '01', title: 'LOGIN AKUN EO', desc: 'Masuk ke dashboard panitia pake akun EO kamu.' },
    { num: '02', title: 'INPUT DETAIL EVENT', desc: 'Upload poster, set QRIS / No Rekening, terus bikin tier tiket.' },
    { num: '03', title: 'SHARE LINK TIKET', desc: 'Sebar link event-mu, pembeli langsung transfer direct ke panitia.' },
    { num: '04', title: 'SCAN AT VENUE', desc: 'Kasih link Gate Venue & PIN 1029 ke tim pintu masuk & kasir OTS.' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 sm:py-10 space-y-12 sm:space-y-16 text-left font-sans bg-[#0a0a0a] text-white">
      
      {/* 1. HERO SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-4 sm:py-8 items-center border-b border-neutral-900">
        <div className="lg:col-span-7 space-y-5">
          <Badge variant="blue" className="text-[10px] px-3 py-1 font-mono uppercase tracking-widest">
            0% KOMISI • PLATFORM DIRECT TRANSFER
          </Badge>
          <h1 className="text-3xl sm:text-6xl font-black uppercase tracking-tighter text-white leading-none">
            ABOUT LOK<span className="text-brand-blue">TIK</span>
          </h1>
          <p className="text-base sm:text-lg text-neutral-300 font-semibold leading-relaxed uppercase">
            Platform e-ticketing mandiri zine-style untuk konser, festival, bazar, dan acara komunitas Anda.
          </p>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-xl">
            Dana tiket langsung dikirim pembeli ke rekening bank atau QRIS panitia secara real-time. LokTik tidak memotong, mengendapkan, atau menahan dana Anda sepeser pun.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button variant="blue" size="lg" onClick={() => document.getElementById('pricing-plans')?.scrollIntoView({ behavior: 'smooth' })} className="px-6 font-black uppercase text-xs">
              LIHAT PAKET PRICING
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/eo/login')} className="px-6 font-black uppercase text-xs">
              MASUK DASBOR EO
            </Button>
          </div>
        </div>

        <div className="lg:col-span-5 flex justify-center">
          <Card variant="dark" className="w-full max-w-sm p-5 border-brand-blue/30 space-y-4 shadow-[0_0_40px_rgba(6,182,212,0.1)] bg-[#0d0d0d] border-2">
            <div className="flex items-center space-x-3 border-b border-neutral-900 pb-3">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-white">LOKTIK OFFICIAL</h4>
                <p className="text-[9px] font-mono text-neutral-500">DIRECT TICKETING PLATFORM</p>
              </div>
            </div>
            <div className="space-y-2.5 text-left">
              <div className="p-2.5 bg-black rounded border border-neutral-900 flex justify-between items-center">
                <span className="text-[10px] text-neutral-400 font-bold uppercase">PENJUALAN TIKET</span>
                <span className="text-xs text-brand-green font-mono font-black">RP 0 (POTONGAN 0%)</span>
              </div>
              <div className="p-2.5 bg-black rounded border border-neutral-900 flex justify-between items-center">
                <span className="text-[10px] text-neutral-400 font-bold uppercase">DANA TRANSFER</span>
                <span className="text-xs text-brand-blue font-mono font-black">LANGSUNG KE EO</span>
              </div>
              <div className="p-2.5 bg-black rounded border border-neutral-900 flex justify-between items-center">
                <span className="text-[10px] text-neutral-400 font-bold uppercase">SCANNER SYSTEM</span>
                <span className="text-xs text-brand-purple font-mono font-black">SUPPORT MULTI-HP</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 2. CORE FEATURES GRID */}
      <div className="space-y-6">
        <div className="text-center space-y-1.5">
          <span className="text-[10px] font-black text-brand-blue tracking-widest uppercase">KENAPA BIKIN EVENT DI LOKTIK?</span>
          <h2 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">PLATFORM TERDEPAN UNTUK EVENT MANDIRI</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <Card variant="dark" className="p-5 border-neutral-850 space-y-2.5 hover:border-brand-blue/60 transition-colors">
            <div className="w-10 h-10 rounded bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center text-brand-blue shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black uppercase text-white">0% POTONGAN KOMISI</h3>
            <p className="text-xs text-neutral-400 font-medium leading-relaxed">
              Tidak ada potongan Rp5.000 atau komisi persenan per tiket. Semua omset penjualan bersih 100% menjadi hak milik panitia penyelenggara.
            </p>
          </Card>
          <Card variant="dark" className="p-5 border-neutral-850 space-y-2.5 hover:border-brand-blue/60 transition-colors">
            <div className="w-10 h-10 rounded bg-brand-green/15 border border-brand-green/30 flex items-center justify-center text-brand-green shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black uppercase text-white">DANA LANGSUNG KE BANK/QRIS</h3>
            <p className="text-xs text-neutral-400 font-medium leading-relaxed">
              Pembeli langsung mentransfer uang tiket ke bank account atau e-wallet (QRIS) milik EO. Uang Anda tidak tertahan di rekening bersama atau platform.
            </p>
          </Card>
          <Card variant="dark" className="p-5 border-neutral-850 space-y-2.5 hover:border-brand-blue/60 transition-colors">
            <div className="w-10 h-10 rounded bg-brand-purple/15 border border-brand-purple/30 flex items-center justify-center text-brand-purple shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black uppercase text-white">SISTEM SCANNER HP PANITIA</h3>
            <p className="text-xs text-neutral-400 font-medium leading-relaxed">
              Cukup bagikan link Gate Portal khusus dan PIN akses ke staf lapangan. Staf pintu masuk bisa memindai QR Code tiket langsung menggunakan HP mereka.
            </p>
          </Card>
        </div>
      </div>

      {/* 3. PRICING PLANS */}
      <div id="pricing-plans" className="space-y-6 pt-4">
        <div className="border-b border-neutral-800 pb-2">
          <h2 className="text-lg sm:text-xl font-black uppercase text-brand-blue tracking-tight flex items-center gap-2">
            <DollarSign className="w-5 h-5" /> SKEMA BIAYA &amp; PRICING BERLANGGANAN
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {pricingTiers.map((tier, idx) => (
            <Card
              key={idx}
              variant="dark"
              className={`p-4 sm:p-6 border flex flex-col justify-between space-y-4 touch-press ${
                tier.highlight
                  ? 'border-brand-blue/60 bg-gradient-to-b from-[#0c1920] to-[#121212] shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                  : 'border-neutral-800 bg-[#121212]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <Badge variant="blue" className="text-[9px] px-2 py-0.5 font-extrabold">
                    {tier.badge}
                  </Badge>
                  <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase">BERLANGGANAN</span>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase text-white">{tier.name}</h3>
                  <div className="flex items-baseline space-x-1.5 mt-1">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-brand-blue">{tier.price}</span>
                    <span className="text-xs font-mono text-neutral-400">{tier.period}</span>
                  </div>
                  <p className="text-xs text-neutral-400 font-medium mt-1 leading-relaxed">{tier.subtitle}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-neutral-800 text-left">
                  {tier.features.map((feat, fIdx) => (
                    <div
                      key={fIdx}
                      className={`flex items-center space-x-2 text-xs font-bold ${
                        feat.included ? 'text-neutral-300' : 'text-neutral-500 line-through'
                      }`}
                    >
                      {feat.included ? (
                        <CheckCircle2 className="w-4 h-4 text-brand-blue shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-brand-red shrink-0" />
                      )}
                      <span>{feat.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 sm:pt-4">
                <a
                  href={`https://wa.me/6285765907580?text=${tier.waText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block touch-press"
                >
                  <Button
                    variant="blue"
                    fullWidth
                    size="md"
                    className="min-h-[46px] font-black justify-center flex items-center space-x-2 text-xs sm:text-sm uppercase tracking-wider"
                  >
                    <span>PESAN {tier.name} VIA WA</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 4. WORKFLOW STEPS */}
      <div className="space-y-6">
        <div className="border-b border-neutral-800 pb-2">
          <h2 className="text-lg sm:text-xl font-black uppercase text-brand-blue tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 shrink-0" /> 4 LANGKAH SIMPEL BIKIN EVENT
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {steps.map((st, idx) => (
            <Card key={idx} variant="dark" className="p-3.5 sm:p-5 border-neutral-800 space-y-1.5 sm:space-y-2">
              <span className="text-xl sm:text-2xl font-black font-mono text-brand-blue">{st.num}</span>
              <h3 className="text-xs sm:text-sm font-black uppercase text-white leading-tight">{st.title}</h3>
              <p className="text-[11px] sm:text-xs text-neutral-400 font-medium leading-relaxed">{st.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* 5. EO TERMS & CONDITIONS */}
      <div className="space-y-6">
        <div className="border-b border-neutral-800 pb-2">
          <h2 className="text-lg sm:text-xl font-black uppercase text-brand-blue tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 shrink-0" /> SYARAT &amp; KETENTUAN (S&amp;K) PANITIA
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {eoTerms.map((term, idx) => (
            <Card key={idx} variant="dark" className="p-4 sm:p-5 space-y-1.5 border-neutral-800">
              <h3 className="text-xs font-extrabold uppercase text-brand-blue tracking-wide">{term.title}</h3>
              <p className="text-xs text-neutral-400 font-medium leading-relaxed">{term.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* 6. RETENTION WARNING ALERT */}
      <Card variant="dark" className="p-4 sm:p-5 border border-brand-yellow/60 bg-brand-yellow/10 space-y-2">
        <div className="flex items-center space-x-2 text-brand-yellow">
          <Clock className="w-5 h-5 shrink-0" />
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wide">PENTING: ATURAN RETENSI DATA EVENT (OTOMATIS HAPUS 2 MINGGU)</h3>
        </div>
        <p className="text-xs text-neutral-200 font-medium leading-relaxed sm:pl-7">
          Setiap data event, daftar transaksi pesanan, tiket QR Code, dan bukti bayar yang sudah selesai akan <strong className="text-brand-yellow underline">otomatis dibersihkan &amp; dihapus oleh sistem 14 hari (2 minggu) setelah tanggal event berakhir</strong>. Harap lakukan ekspor/rekapan data penjualan sebelum batas waktu tersebut (peta tombol <strong className="text-brand-blue">EXPORT EXCEL</strong> &amp; <strong className="text-brand-purple">EXPORT PDF</strong> tersedia di Dashboard EO).
        </p>
      </Card>

      {/* FAQ SECTION */}
      <div className="pt-4 border-t border-neutral-800">
        <FaqSection />
      </div>

      {/* BOTTOM CTA CARD */}
      <Card variant="dark" className="p-5 sm:p-8 space-y-4 border-brand-blue/40 bg-gradient-to-r from-neutral-950 via-neutral-900 to-black text-center">
        <h2 className="text-xl sm:text-2xl font-black uppercase text-white">MAU BERLANGGANAN &amp; BIKIN EVENT SEKARANG?</h2>
        <p className="text-xs text-neutral-400 max-w-lg mx-auto font-medium">
          Pesan layanan platform via WhatsApp (0857-6590-7580) atau masuk ke dashboard panitia jika sudah memiliki akun.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <a
            href="https://wa.me/6285765907580?text=Halo%20Admin%20LokTik,%20saya%20tertarik%20memesan%20layanan%20platform%20LokTik%20untuk%20event%20saya."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto touch-press"
          >
            <Button variant="blue" size="lg" className="w-full sm:w-auto px-6 min-h-[46px] font-black flex items-center justify-center space-x-2 text-xs sm:text-sm">
              <span>PESAN VIA WA (0857-6590-7580)</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </a>
          <Button variant="outline" size="lg" onClick={() => navigate('/eo/login')} className="w-full sm:w-auto px-6 min-h-[46px] font-black text-xs sm:text-sm uppercase">
            MASUK DASBOR EO
          </Button>
        </div>
      </Card>
    </div>
  );
};

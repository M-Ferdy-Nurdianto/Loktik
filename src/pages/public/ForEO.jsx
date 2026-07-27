import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Ticket, QrCode, Smartphone, Zap, ArrowRight, DollarSign, FileText, CheckCircle2, Clock } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FaqSection } from '../../components/landing/FaqSection';

export const ForEO = () => {
  const navigate = useNavigate();

  const pricingTiers = [
    {
      name: 'PAKET 3 BULAN',
      price: 'Rp250.000',
      period: '/ 3 Bulan',
      badge: 'BISA SEMUA EVENT',
      subtitle: 'Akses Bebas Jualan Tiket 0% Komisi Selama 3 Bulan',
      waText: 'Halo%20Admin%20LokTik,%20saya%20tertarik%20memesan%20Paket%20Berlangganan%20LokTik%203%20Bulan%20(Rp250.000).',
      features: [
        '0% Potongan Komisi Per Tiket',
        'Direct Transfer ke Rekening / QRIS Panitia',
        'Unlimited Bikin Event & Kategori Tiket',
        'Gate Venue & Realtime Scanner HP Staf',
        'Kasir OTS Venue Fast-Issue Direct',
        'Emergency Guest List & Multi-Device Staf',
      ],
      highlight: false,
    },
    {
      name: 'PAKET 1 TAHUN (PROMO)',
      price: 'Rp500.000',
      period: '/ 1 Tahun',
      badge: 'PROMO HEMAT 50%',
      subtitle: 'Paket Hemat Bebas Jualan Tiket Selama 1 Tahun Penuh',
      waText: 'Halo%20Admin%20LokTik,%20saya%20tertarik%20memesan%20Paket%20Promo%20LokTik%201%20Tahun%20(Rp500.000).',
      features: [
        '0% Potongan Komisi Per Tiket',
        'Direct Transfer ke Rekening / QRIS Panitia',
        'Unlimited Bikin Event & Kategori Tiket',
        'Gate Venue & Realtime Scanner HP Staf',
        'Kasir OTS Venue Fast-Issue Direct',
        'Emergency Guest List & Multi-Device Staf',
      ],
      highlight: true,
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
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 space-y-10 text-left font-sans bg-[#0a0a0a] text-white">
      {/* Header Banner */}
      <div className="border-b border-neutral-800 pb-6 space-y-3">
        <Badge variant="purple" className="text-[10px] px-2.5 py-0.5">
          PANITIA &amp; EVENT ORGANIZER GUIDE
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-none">
          INFO LENGKAP, PRICING, &amp; S&amp;K BIKIN EVENT
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-3xl leading-relaxed">
          Semua info transparan soal skema zero komisi, alur kerja simpel, dan S&amp;K resmi buat kamu yang mau bikin event di LokTik.
        </p>
      </div>

      {/* Pricing Section */}
      <div className="space-y-4">
        <div className="border-b border-neutral-800 pb-2">
          <h2 className="text-xl font-black uppercase text-brand-green tracking-tight flex items-center gap-2">
            <DollarSign className="w-5 h-5" /> SKEMA BIAYA &amp; PRICING
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pricingTiers.map((tier, idx) => (
            <Card
              key={idx}
              variant="dark"
              className={`p-6 border flex flex-col justify-between space-y-4 ${
                tier.highlight
                  ? 'border-brand-green/60 bg-gradient-to-b from-[#141d14] to-[#121212] shadow-[0_0_20px_rgba(57,255,20,0.15)]'
                  : 'border-neutral-800 bg-[#121212]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <Badge variant={tier.highlight ? 'green' : 'purple'} className="text-[9px] px-2 py-0.5">
                    {tier.badge}
                  </Badge>
                  <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase">BERLANGGANAN</span>
                </div>

                <div>
                  <h3 className="text-lg font-black uppercase text-white">{tier.name}</h3>
                  <div className="flex items-baseline space-x-1 mt-1">
                    <span className="text-3xl font-black font-mono text-brand-green">{tier.price}</span>
                    <span className="text-xs font-mono text-neutral-400">{tier.period}</span>
                  </div>
                  <p className="text-xs text-neutral-400 font-medium mt-1 leading-relaxed">{tier.subtitle}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-neutral-800">
                  {tier.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center space-x-2 text-xs font-bold text-neutral-300">
                      <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <a
                  href={`https://wa.me/6285765907580?text=${tier.waText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button
                    variant={tier.highlight ? 'green' : 'purple'}
                    fullWidth
                    size="md"
                    className="font-black justify-center flex items-center space-x-2"
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

      {/* Step by Step Workflow */}
      <div className="space-y-4">
        <div className="border-b border-neutral-800 pb-2">
          <h2 className="text-xl font-black uppercase text-brand-purple tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5" /> 4 LANGKAH SIMPEL BIKIN EVENT
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
            <FileText className="w-5 h-5" /> SYARAT &amp; KETENTUAN (S&amp;K) PANITIA
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

      {/* HIGHLIGHT ALERT BOX: RETENSI DATA 2 MINGGU (Placed right above FAQ) */}
      <Card variant="dark" className="p-5 border border-brand-yellow/60 bg-brand-yellow/10 space-y-2">
        <div className="flex items-center space-x-2 text-brand-yellow">
          <Clock className="w-5 h-5 shrink-0" />
          <h3 className="text-sm font-black uppercase tracking-wide">PENTING: ATURAN RETENSI DATA EVENT (OTOMATIS HAPUS 2 MINGGU)</h3>
        </div>
        <p className="text-xs text-neutral-200 font-medium leading-relaxed pl-7">
          Setiap data event, daftar transaksi pesanan, tiket QR Code, dan bukti bayar yang sudah selesai akan <strong className="text-brand-yellow underline">otomatis dibersihkan &amp; dihapus oleh sistem 14 hari (2 minggu) setelah tanggal event berakhir</strong>. Harap lakukan ekspor/rekapan data penjualan sebelum batas waktu tersebut (peta tombol <strong className="text-brand-green">EXPORT EXCEL</strong> &amp; <strong className="text-brand-purple">EXPORT PDF</strong> tersedia di Dashboard EO).
        </p>
      </Card>

      {/* FAQ Section Included Directly on EO Page */}
      <div className="pt-4 border-t border-neutral-800">
        <FaqSection />
      </div>

      {/* Bottom CTA Card */}
      <Card variant="dark" className="p-8 space-y-4 border-brand-green/40 bg-gradient-to-r from-neutral-950 via-neutral-900 to-black text-center">
        <h2 className="text-2xl font-black uppercase text-white">MAU BERLANGGANAN &amp; BIKIN EVENT SEKARANG?</h2>
        <p className="text-xs text-neutral-400 max-w-lg mx-auto font-medium">
          Pesan layanan platform via WhatsApp (0857-6590-7580) atau masuk ke dashboard panitia jika sudah memiliki akun.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <a
            href="https://wa.me/6285765907580?text=Halo%20Admin%20LokTik,%20saya%20tertarik%20memesan%20layanan%20platform%20LokTik%20untuk%20event%20saya."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto"
          >
            <Button variant="green" size="lg" className="w-full sm:w-auto px-6 font-black flex items-center justify-center space-x-2">
              <span>PESAN VIA WA (0857-6590-7580)</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </a>
          <Button variant="outline" size="lg" onClick={() => navigate('/eo/login')} className="w-full sm:w-auto px-6 font-black">
            LOGIN DASHBOARD EO
          </Button>
        </div>
      </Card>
    </div>
  );
};

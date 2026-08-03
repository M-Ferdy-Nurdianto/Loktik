import React, { useState } from 'react';
import { ArrowRight, Bot, CheckCircle2, ChevronDown, ChevronRight, CircleHelp, Clock3, DollarSign, Info, MessageSquare, ShieldCheck, Sparkles, Users, CalendarDays, Zap } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

const featureNotes = {
  directTransfer: {
    short: 'Pembayaran pembeli langsung masuk ke rekening/QRIS EO, tanpa ditahan LokTik.',
    example: 'Contoh: pembeli bayar tiket lalu dana langsung masuk ke rekening panitia.'
  },
  oneEvent: {
    short: 'Hanya satu event aktif pada satu waktu.',
    example: 'Contoh: jika Event A masih berlangsung, Event B baru bisa dibuat setelah Event A selesai.'
  },
  unlimitedEvent: {
    short: 'Bisa menjalankan banyak event sekaligus tanpa batas.',
    example: 'Cocok untuk konser, seminar, workshop, meet & greet, bazar, dan festival yang berjalan bersamaan.'
  },
  staff2: {
    short: 'Dua akun staff terpisah untuk kerja lapangan.',
    example: 'Contoh: satu akun untuk Scanner QR dan satu akun untuk Kasir OTS.'
  },
  staffUnlimited: {
    short: 'Bebas menambahkan akun staff sesuai kebutuhan.',
    example: 'Bisa dipakai untuk scanner, kasir, admin lapangan, petugas gate, dan tim bantuan.'
  },
  exportReport: {
    short: 'Unduh laporan penjualan, data pembeli, rekap transaksi, dan statistik event.',
    example: 'Cocok untuk arsip keuangan dan pertanggungjawaban setelah acara selesai.'
  },
  eventPass: {
    short: 'Aktif sejak event dibuat sampai H+7 setelah acara selesai.',
    example: 'Create Event → Penjualan → Hari Event → H+7 → Paket Berakhir'
  },
  botUnlimited: {
    short: 'WhatsApp otomatis berjalan selama langganan aktif tanpa memotong kuota pesan.',
    example: 'Cocok untuk EO yang ingin kirim tiket otomatis tanpa hitung saldo pesan.'
  },
  botQuota: {
    short: 'Sistem saldo pesan yang berkurang setiap kali sistem berhasil mengirim WhatsApp otomatis.',
    example: 'Jika kuota habis, EO bisa top up kapan saja; kuota lama tetap aman bila sistem stacking didukung.'
  },
};

const pricingTiers = [
  {
    id: 'event-pass',
    name: 'EVENT PASS',
    price: 'Rp149.000',
    period: '/ satu event + H+7',
    badge: 'COCOK UNTUK EO BARU',
    accent: 'blue',
    label: 'Paling Hemat',
    subtitle: 'Paket paling terjangkau untuk EO yang hanya mengadakan satu event dalam satu periode.',
    summary: 'Aktif dari pembuatan event sampai H+7 agar Anda masih sempat scan tiket, cek peserta, unduh laporan, dan bereskan administrasi pasca acara.',
    timeline: ['Create Event', 'Penjualan', 'Hari Event', 'H+7', 'Paket Berakhir'],
    waText: 'Halo%20Admin%20LokTik,%20saya%20tertarik%20memesan%20EVENT%20PASS%20LokTik%20(Rp149.000).',
    features: [
      { title: '1 event aktif pada satu waktu', detail: 'Anda hanya bisa menjalankan satu event sekaligus. Jika Event A masih berlangsung, Event B menunggu sampai Event A selesai.', note: featureNotes.oneEvent },
      { title: 'Direct Transfer ke rekening/QRIS EO', detail: 'Setiap pembayaran pembeli langsung masuk ke rekening atau QRIS panitia tanpa ditahan LokTik.', note: featureNotes.directTransfer },
      { title: '2 akun staff terpisah', detail: 'Dapat dipakai untuk Scanner QR dan Kasir OTS tanpa memakai akun EO utama.', note: featureNotes.staff2 },
      { title: 'Export PDF & Excel', detail: 'Unduh laporan penjualan, data pembeli, rekap transaksi, dan statistik event dalam PDF atau Excel.', note: featureNotes.exportReport },
      { title: 'Masa aktif sampai H+7', detail: 'H+7 memberi waktu tambahan agar EO masih bisa scan tiket, melihat data peserta, mengunduh laporan, dan menyelesaikan administrasi.', note: featureNotes.eventPass },
    ],
    tips: [
      'Cocok untuk EO pertama kali yang ingin mulai tanpa komitmen panjang.',
      'Ideal untuk event tunggal seperti workshop, mini concert, atau meet & greet.',
    ],
  },
  {
    id: '1_month',
    name: 'PAKET 1 BULAN',
    price: 'Rp199.000',
    priceStrike: 'Rp299.000',
    period: '/ 1 Bulan',
    badge: 'REKOMENDASI',
    accent: 'blue',
    label: 'Paling Populer',
    subtitle: 'Paket bulanan untuk EO yang ingin menjalankan satu event aktif dengan fitur inti penuh.',
    summary: 'Saat satu event masih berlangsung, event berikutnya belum bisa dibuat. Setelah event selesai, Anda bebas membuat event baru.',
    waText: 'Halo%20Admin%20LokTik,%20saya%20tertarik%20memesan%20Paket%20LokTik%201%20Bulan%20(Rp199.000).',
    features: [
      { title: '1 event aktif pada satu waktu', detail: 'Cocok untuk EO yang fokus ke satu acara dulu sebelum pindah ke event berikutnya.', note: featureNotes.oneEvent },
      { title: 'Direct Transfer ke rekening/QRIS EO', detail: 'Pembayaran pembeli langsung masuk ke rekening EO, tanpa potongan platform.', note: featureNotes.directTransfer },
      { title: '2 akun staff terpisah', detail: 'Untuk Scanner QR dan Kasir OTS tanpa berbagi akun utama EO.', note: featureNotes.staff2 },
      { title: 'Export PDF & Excel', detail: 'Laporan penjualan, data pembeli, rekap transaksi, dan statistik event bisa diunduh.', note: featureNotes.exportReport },
      { title: 'Kasir OTS venue', detail: 'Bisa dipakai untuk penjualan tiket langsung di lokasi acara.', note: { short: 'Penjualan tiket langsung di venue.', example: 'Petugas kasir bisa input pembeli OTS saat acara berjalan.' } },
    ],
    tips: [
      'Pas untuk EO yang baru mencoba sistem tiket digital.',
      'Fokus pada satu event sampai selesai dalam periode aktif.',
    ],
  },
  {
    id: '3_months',
    name: 'PAKET 3 BULAN',
    price: 'Rp349.000',
    priceStrike: 'Rp499.000',
    period: '/ 3 Bulan',
    badge: 'PALING LARIS',
    accent: 'purple',
    label: 'Paling Cocok untuk Tim Aktif',
    subtitle: 'Untuk EO yang mengelola beberapa event berdekatan dan butuh fleksibilitas operasional lebih besar.',
    summary: 'Anda bisa menjalankan banyak event secara bersamaan tanpa batas, sehingga cocok untuk tim yang mengelola beberapa agenda sekaligus.',
    waText: 'Halo%20Admin%20LokTik,%20saya%20tertarik%20memesan%20Paket%20LokTik%203%20Bulan%20(Rp349.000).',
    features: [
      { title: 'Unlimited event aktif', detail: 'Bisa menjalankan banyak event bersamaan tanpa batas, misalnya konser, seminar, workshop, meet & greet, bazar, dan festival.', note: featureNotes.unlimitedEvent },
      { title: 'Hingga 5 akun staff', detail: 'Bisa dibagi untuk scanner, kasir, atau tim lapangan lain sesuai kebutuhan.', note: { short: 'Sampai lima akun staff untuk tim operasional.', example: 'Bagus untuk event yang butuh beberapa pos kerja.' } },
      { title: 'Direct Transfer ke rekening/QRIS EO', detail: 'Setiap pembayaran tetap masuk langsung ke rekening panitia tanpa ditahan platform.', note: featureNotes.directTransfer },
      { title: 'Export PDF & Excel', detail: 'Untuk laporan penjualan, data pembeli, rekap transaksi, dan statistik event.', note: featureNotes.exportReport },
      { title: 'Kasir OTS venue', detail: 'Mendukung penjualan langsung di lokasi acara.', note: { short: 'Cocok untuk jual tiket di venue.', example: 'Bisa dipakai saat pintu masuk atau meja kasir lapangan.' } },
    ],
    tips: [
      'Cocok bila Anda menangani agenda event yang berjalan berurutan atau bersamaan.',
      'Lebih lega untuk tim yang butuh beberapa akun kerja.',
    ],
  },
  {
    id: '6_months',
    name: 'PAKET 6 BULAN PRO',
    price: 'Rp599.000',
    priceStrike: 'Rp799.000',
    period: '/ 6 Bulan',
    badge: 'PRO — PALING HEMAT!',
    accent: 'green',
    label: 'Rekomendasi untuk EO Serius',
    subtitle: 'Paket paling lengkap untuk EO yang ingin menjalankan banyak event sekaligus dengan tim operasional besar.',
    summary: 'Unlimited event aktif berarti Anda bebas menggelar banyak acara pada waktu yang sama tanpa batas, dari konser sampai festival besar.',
    waText: 'Halo%20Admin%20LokTik,%20saya%20tertarik%20memesan%20Paket%20LokTik%206%20Bulan%20PRO%20(Rp599.000).',
    features: [
      { title: 'Unlimited event aktif', detail: 'Bebas menjalankan banyak event bersamaan tanpa batas.', note: featureNotes.unlimitedEvent },
      { title: 'Unlimited staff', detail: 'Bebas menambahkan akun scanner, kasir, admin lapangan, maupun petugas lain sesuai kebutuhan.', note: featureNotes.staffUnlimited },
      { title: 'Direct Transfer ke rekening/QRIS EO', detail: 'Seluruh pembayaran pembeli tetap langsung masuk ke rekening EO.', note: featureNotes.directTransfer },
      { title: 'Export PDF & Excel', detail: 'Laporan penjualan, data pembeli, rekap transaksi, dan statistik bisa diunduh kapan saja.', note: featureNotes.exportReport },
      { title: 'Priority support', detail: 'Bantuan lebih cepat untuk tim yang mengelola operasional besar.', note: { short: 'Dukungan prioritas untuk kebutuhan operasional serius.', example: 'Cocok untuk EO yang sering jalan event dan butuh respon cepat.' } },
    ],
    tips: [
      'Paling pas untuk EO yang aktif sepanjang tahun.',
      'Ideal jika Anda ingin mengelola banyak event bersamaan dengan tim besar.',
    ],
  },
];

export const waAddOnPackages = [
  {
    name: 'PAKET UP TO 900 PESAN',
    price: 'Rp50.000',
    pricePeriod: '/ Bulan',
    proDiscount: 'Rp45.000',
    quota: 'UP TO 900',
    badge: 'ADD-ON RINGAN',
    subtitle: 'Kapasitas ringan untuk event skala kecil sampai menengah dengan ekspektasi pesan yang realistis.',
    waText: 'Halo%20Admin%20LokTik,%20saya%20tertarik%20membeli%20Add-on%20Bot%20WA%20Paket%20Up%20To%20900%20Pesan%20(Rp50.000%2Fbulan).',
    features: [
      { text: 'Up To 900 pesan WhatsApp otomatis per periode', included: true },
      { text: 'Kuota berkurang setiap kali sistem berhasil mengirim pesan otomatis', included: true },
      { text: 'Cocok untuk event komunitas, workshop, atau gathering kecil', included: true },
      { text: 'Bisa top up kapan saja saat kuota menipis', included: true },
    ],
    highlight: false,
    icon: MessageSquare,
    mode: 'Bot Kuota (Up To 900)',
    helper: featureNotes.botQuota,
  },
  {
    name: 'PAKET UP TO 9.000 PESAN',
    price: 'Rp70.000',
    pricePeriod: '/ Bulan',
    proDiscount: 'Rp65.000',
    quota: 'UP TO 9.000',
    badge: 'ADD-ON SUPER VALUE',
    subtitle: 'Kapasitas besar untuk EO dengan trafik tinggi dan kebutuhan pengiriman masif.',
    waText: 'Halo%20Admin%20LokTik,%20saya%20tertarik%20membeli%20Add-on%20Bot%20WA%20Paket%20Up%20To%209000%20Pesan%20(Rp70.000%2Fbulan).',
    features: [
      { text: 'Up To 9.000 pesan WhatsApp otomatis per periode', included: true },
      { text: 'Kuota berkurang setiap kali sistem berhasil mengirim pesan otomatis', included: true },
      { text: 'Jika kuota habis, top up kapan saja tanpa kehilangan sisa kuota yang masih ada', included: true },
      { text: 'Cocok untuk EO dengan banyak pesanan dan volume kirim tinggi', included: true },
      { text: 'Bisa stacking bila sistem mendukung penumpukan kuota', included: true },
    ],
    highlight: true,
    icon: MessageSquare,
    mode: 'Bot Kuota (Up To 9.000)',
    helper: featureNotes.botQuota,
  },
];

const InfoHint = ({ title, text }) => (
  <span className="inline-flex items-center gap-1 text-[10px] text-neutral-400 font-medium leading-snug">
    <CircleHelp className="w-3 h-3 text-brand-blue shrink-0" />
    <span title={`${title}: ${text}`} className="cursor-help">
      {text}
    </span>
  </span>
);

const FeatureHelp = ({ feature }) => (
  <div className="mt-1.5 space-y-1">
    <InfoHint title={feature.title} text={feature.note.short} />
    <p className="text-[10px] text-neutral-500 leading-snug">{feature.note.example}</p>
  </div>
);

const PackageDetailPanel = ({ tier }) => (
  <div className="space-y-3">
    <div className="flex items-start gap-2 text-[11px] text-neutral-400 leading-relaxed">
      <Info className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
      <p>{tier.summary}</p>
    </div>
    {tier.id === 'event-pass' && (
      <div className="p-3 rounded-md border border-brand-blue/30 bg-brand-blue/10 text-[11px] text-neutral-300">
        <p className="font-black uppercase text-brand-blue tracking-widest mb-2">Timeline Event Pass</p>
        <div className="flex flex-wrap gap-2 items-center">
          {tier.timeline.map((step, index) => (
            <React.Fragment key={step}>
              <span className="px-2 py-1 rounded-md bg-[#0a0a0a] border border-neutral-800 font-mono text-[10px] uppercase">{step}</span>
              {index < tier.timeline.length - 1 && <ChevronRight className="w-3 h-3 text-brand-blue shrink-0" />}
            </React.Fragment>
          ))}
        </div>
        <p className="mt-2 text-neutral-400">H+7 adalah masa tambahan untuk scan tiket, cek peserta, unduh laporan, dan merapikan administrasi sebelum event diarsipkan.</p>
      </div>
    )}
    <div className="space-y-2">
      {tier.tips.map((tip) => (
        <div key={tip} className="flex items-start gap-2 text-[11px] text-neutral-400 leading-relaxed">
          <Sparkles className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
          <span>{tip}</span>
        </div>
      ))}
    </div>
  </div>
);

const TierCard = ({ tier, index }) => {
  const [open, setOpen] = useState(index === 0);
  const accentMap = {
    blue: 'border-brand-blue/60 bg-gradient-to-b from-[#0c1920] to-[#121212] shadow-[0_0_20px_rgba(6,182,212,0.15)]',
    purple: 'border-brand-purple/60 bg-gradient-to-b from-[#140a1f] to-[#121212] shadow-[0_0_20px_rgba(139,92,246,0.15)]',
    green: 'border-brand-green/60 bg-gradient-to-b from-[#09160d] to-[#121212] shadow-[0_0_20px_rgba(57,255,20,0.12)]',
  };

  return (
    <Card
      variant="dark"
      className={`p-4 sm:p-6 border flex flex-col justify-between space-y-4 touch-press ${tier.accent ? accentMap[tier.accent] : 'border-neutral-800 bg-[#121212]'}`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 gap-2">
          <Badge variant={tier.accent} className="text-[9px] px-2 py-0.5 font-extrabold">
            {tier.badge}
          </Badge>
          <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase">BERLANGGANAN</span>
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-black uppercase text-white">{tier.name}</h3>
            <Badge variant={tier.accent} className="text-[9px] px-2 py-0.5 font-black">{tier.label}</Badge>
          </div>
          <div className="flex flex-col mt-1.5 space-y-0.5">
            {tier.priceStrike && (
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-neutral-500 line-through font-bold decoration-brand-red/80">
                  {tier.priceStrike}
                </span>
                <Badge variant="red" className="text-[8px] px-1.5 py-0 font-black">
                  HEMAT
                </Badge>
              </div>
            )}
            <div className="flex items-baseline space-x-1.5">
              <span className={`text-2xl sm:text-3xl font-black font-mono ${tier.accent === 'green' ? 'text-brand-green' : tier.accent === 'purple' ? 'text-brand-purple' : 'text-brand-blue'}`}>
                {tier.price}
              </span>
              <span className="text-xs font-mono text-neutral-400">{tier.period}</span>
            </div>
          </div>
          <p className="text-xs text-neutral-400 font-medium mt-2 leading-relaxed">{tier.subtitle}</p>
        </div>

        <div className="space-y-2 pt-2 border-t border-neutral-800 text-left">
          {tier.features.map((feat, fIdx) => (
            <div key={fIdx} className="text-xs font-bold text-neutral-300">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${tier.accent === 'green' && fIdx === 0 ? 'text-brand-green' : tier.accent === 'purple' ? 'text-brand-purple' : 'text-brand-blue'}`} />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="leading-snug">{feat.title}</span>
                    {fIdx === 0 && tier.accent !== 'blue' && (
                      <Badge variant={tier.accent} className="text-[7px] px-1.5 py-0 font-black shrink-0 mt-0.5 whitespace-nowrap">
                        {tier.id === 'event-pass' ? 'Cocok Untuk EO Baru' : 'Unlimited'}
                      </Badge>
                    )}
                  </div>
                  <FeatureHelp feature={feat} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <details className="md:hidden rounded-md border border-neutral-800 bg-[#0f0f0f]">
          <summary
            className="flex items-center justify-between list-none cursor-pointer px-3 py-2 text-[11px] font-black uppercase tracking-wider text-neutral-300"
            onClick={(event) => {
              event.preventDefault();
              setOpen((current) => !current);
            }}
          >
            <span>Lihat penjelasan singkat</span>
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </summary>
          {open && (
            <div className="px-3 pb-3 border-t border-neutral-800 pt-3">
              <PackageDetailPanel tier={tier} />
            </div>
          )}
        </details>

        <div className="hidden md:block p-3 rounded-md border border-neutral-800 bg-[#0f0f0f]">
          <PackageDetailPanel tier={tier} />
        </div>
      </div>

      <div className="pt-3 sm:pt-4 space-y-3">
        <a
          href={`https://wa.me/6285765907580?text=${tier.waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block touch-press"
        >
          <Button
            variant={tier.accent === 'purple' ? 'purple' : tier.accent === 'green' ? 'green' : 'blue'}
            fullWidth
            size="md"
            className="min-h-[46px] font-black justify-center flex items-center space-x-2 text-xs sm:text-sm uppercase tracking-wider"
          >
            <span>PESAN {tier.name} VIA WA</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </a>
        <div className="flex flex-wrap gap-2 text-[10px] text-neutral-500">
          <span className="inline-flex items-center gap-1"><Clock3 className="w-3 h-3 text-brand-blue" />{tier.id === 'event-pass' ? 'Aktif sampai H+7' : 'Akses sesuai masa langganan'}</span>
          <span className="inline-flex items-center gap-1"><Users className="w-3 h-3 text-brand-purple" />{tier.id === '6_months' ? 'Tim besar' : 'EO harian'}</span>
        </div>
      </div>
    </Card>
  );
};

const AddOnCard = ({ pkg, index }) => {
  const Icon = pkg.icon || Bot;
  const accent = pkg.highlight ? 'purple' : 'blue';

  return (
    <Card
      variant="dark"
      className={`p-4 sm:p-6 border-2 flex flex-col justify-between space-y-4 touch-press relative overflow-hidden ${
        pkg.highlight
          ? 'border-brand-purple/60 bg-gradient-to-br from-[#140a1f] via-[#121212] to-[#0c1920] shadow-[0_0_30px_rgba(139,92,246,0.2)]'
          : 'border-neutral-700 bg-[#121212]'
      }`}
    >
      {pkg.highlight && (
        <div className="absolute top-0 right-0">
          <div className="bg-brand-purple text-black text-[9px] font-black uppercase px-3 py-1 tracking-widest border-l border-b border-brand-purple/60 rounded-bl-md">
            {index === 1 ? 'Paling Populer' : 'Rekomendasi'}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 gap-2">
          <Badge variant={accent} className="text-[9px] px-2 py-0.5 font-extrabold">
            {pkg.badge}
          </Badge>
          <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase">ADD-ON WA</span>
        </div>

        <div>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-md border ${
              pkg.highlight
                ? 'bg-brand-purple/20 border-brand-purple/60 shadow-[0_0_15px_rgba(139,92,246,0.25)]'
                : 'bg-neutral-900 border-neutral-700'
            }`}>
              <Icon className={`w-6 h-6 ${pkg.highlight ? 'text-brand-purple' : 'text-neutral-400'}`} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase text-white">{pkg.name}</h3>
              <p className="text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wide">
                {pkg.quota} PESAN WHATSAPP
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800/60 space-y-2.5">
            <div className="flex items-baseline space-x-1">
              <span className={`text-3xl sm:text-4xl font-black font-mono ${pkg.highlight ? 'text-brand-purple' : 'text-brand-blue'}`}>
                {pkg.price}
              </span>
              <span className={`text-sm font-mono font-bold opacity-70 ${pkg.highlight ? 'text-brand-purple' : 'text-brand-blue'}`}>
                {pkg.pricePeriod}
              </span>
            </div>

            {pkg.proDiscount && (
              <div className="p-2.5 rounded-md border border-brand-orange/60 bg-brand-orange/10 flex items-start gap-2 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                <span className="text-base shrink-0 leading-none mt-0.5">🔥</span>
                <div className="flex-1 text-left leading-snug">
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand-orange">
                    SPESIAL MEMBER PRO (6 BULAN):
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xs font-bold text-neutral-400 line-through">{pkg.price}</span>
                    <span className="text-sm sm:text-base font-black font-mono text-brand-orange">
                      Hanya {pkg.proDiscount} {pkg.pricePeriod.toLowerCase()}!
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-neutral-400 font-medium mt-2 leading-relaxed">{pkg.subtitle}</p>
        </div>

        <div className="space-y-2 pt-3 border-t border-neutral-800 text-left">
          {pkg.features.map((feat, fIdx) => (
            <div key={fIdx} className="flex items-start space-x-2 text-xs font-bold text-neutral-300">
              <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${fIdx === 0 ? 'text-brand-purple' : 'text-brand-blue'}`} />
              <span className="leading-snug">{feat.text}</span>
            </div>
          ))}
          <div className="p-3 rounded-md border border-neutral-800 bg-black/30 text-[11px] text-neutral-400 leading-relaxed">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
              <div>
                <p className="font-black uppercase text-white tracking-wider mb-1">{pkg.mode}</p>
                <p>{pkg.helper.short}</p>
                <p className="mt-1 text-neutral-500">{pkg.helper.example}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3 sm:pt-4">
        <a href={`https://wa.me/6285765907580?text=${pkg.waText}`} target="_blank" rel="noopener noreferrer" className="block touch-press">
          <Button
            variant={pkg.highlight ? 'purple' : 'blue'}
            fullWidth
            size="md"
            className={`min-h-[46px] font-black justify-center flex items-center space-x-2 text-xs sm:text-sm uppercase tracking-wider ${pkg.highlight ? 'shadow-[0_0_20px_rgba(139,92,246,0.35)]' : ''}`}
          >
            <Zap className="w-4 h-4" />
            <span>BELI {pkg.name} VIA WA</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </a>
      </div>
    </Card>
  );
};

export const ForEoPricing = () => {
  return (
    <div id="pricing-plans" className="space-y-12 pt-4">
      <div className="border-b border-neutral-800 pb-2 space-y-2">
        <h2 className="text-lg sm:text-xl font-black uppercase text-brand-blue tracking-tight flex items-center gap-2">
          <DollarSign className="w-5 h-5" /> SKEMA BIAYA &amp; PRICING BERLANGGANAN
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-4xl">
          Pilih paket sesuai cara kerja Anda. Event Pass untuk satu event, paket bulanan untuk EO yang ingin operasional lebih fleksibel, dan paket PRO untuk tim yang menjalankan banyak event sekaligus.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {pricingTiers.map((tier, idx) => (
          <TierCard key={tier.id} tier={tier} index={idx} />
        ))}
      </div>

      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-neutral-800 pb-3 gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-brand-purple/20 border border-brand-purple/50 rounded-md">
                <Bot className="w-5 h-5 text-brand-purple" />
              </div>
              <h2 className="text-lg sm:text-xl font-black uppercase text-brand-purple tracking-tight">
                ADD-ON BOT WHATSAPP OTOMATIS
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 font-medium leading-relaxed sm:pl-9">
              Pilih Bot Unlimited jika ingin WhatsApp otomatis aktif terus selama langganan, atau Bot Berbasis Kuota jika ingin kontrol pesan yang lebih ketat dan transparan.
            </p>
          </div>
          <Badge variant="purple" className="w-fit sm:w-auto text-[10px] px-2.5 py-1 font-black">
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> STACKING KUOTA DIDUKUNG
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {waAddOnPackages.map((pkg, idx) => (
            <AddOnCard key={pkg.name} pkg={pkg} index={idx} />
          ))}
        </div>

        <div className="p-4 sm:p-5 bg-neutral-900/50 border border-neutral-800 rounded-md space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-brand-yellow/20 border border-brand-yellow/50 rounded-md shrink-0">
              <MessageSquare className="w-5 h-5 text-brand-yellow" />
            </div>
            <div className="space-y-2 w-full">
              <h4 className="text-xs font-black uppercase text-white tracking-tight">
                Cara Kerja Add-On Bot WA
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-[11px] sm:text-xs text-neutral-400 font-medium leading-relaxed">
                <div className="p-3 rounded-md border border-neutral-800 bg-black/30 space-y-2">
                  <p className="font-black uppercase text-brand-blue tracking-wider">Bot Unlimited</p>
                  <p>WhatsApp otomatis berjalan selama langganan aktif tanpa mengurangi kuota pesan. Pilihan ini cocok untuk EO yang ingin sistem bekerja tanpa hitung saldo pesan.</p>
                  <p className="text-neutral-500">Contoh: begitu pembayaran berhasil, sistem langsung kirim tiket tanpa perlu memikirkan sisa pesan.</p>
                </div>
                <div className="p-3 rounded-md border border-neutral-800 bg-black/30 space-y-2">
                  <p className="font-black uppercase text-brand-purple tracking-wider">Bot Berbasis Kuota</p>
                  <p>Kuota pesan akan berkurang setiap kali sistem berhasil mengirim WhatsApp otomatis. Istilah Up To dipakai agar ekspektasi lebih realistis karena jumlah pesan aktual bisa sedikit berbeda akibat retry, pesan gagal, rate limit WhatsApp, atau sistem internal.</p>
                  <p className="text-neutral-500">Jika kuota habis, Anda bisa top up kapan saja. Bila sistem mendukung stacking, sisa kuota sebelumnya tetap aman.</p>
                </div>
              </div>
              <ul className="text-[11px] sm:text-xs text-neutral-400 font-medium leading-relaxed space-y-1 list-disc pl-4">
                <li>Add-on Bot WA adalah <strong className="text-neutral-200">langganan bulanan terpisah</strong> dari paket inti LokTik.</li>
                <li><strong className="text-brand-yellow font-bold">Up To 900 Pesan</strong> dan <strong className="text-brand-yellow font-bold">Up To 9.000 Pesan</strong> dipakai untuk memberi gambaran kapasitas yang lebih realistis.</li>
                <li>Member <strong className="text-brand-purple font-bold">Paket 6 Bulan PRO</strong> otomatis dapat harga spesial <strong className="text-brand-orange font-bold">Diskon Rp5.000</strong> untuk kedua paket Add-on Bot WA.</li>
                <li>Harga diskon PRO otomatis berlaku <strong className="text-neutral-200">selama masa aktif Paket PRO Anda</strong> — tidak perlu request manual.</li>
                <li>Jika kuota habis sebelum tanggal reset bulan berikutnya, EO bisa top up tambahan kapan saja sesuai dukungan stacking kuota.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
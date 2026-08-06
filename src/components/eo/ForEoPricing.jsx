import React, { useState } from 'react';
import {
  ArrowRight, Bot, CheckCircle2, ChevronRight, Clock3,
  DollarSign, Info, MessageSquare, Sparkles, Zap, AlertTriangle,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { BottomSheet } from '../ui/BottomSheet';
import { buildWhatsAppUrl } from '../../utils/whatsappLink';

// ─── Nomor WA Admin LokTik ───────────────────────────────────────────────────
const ADMIN_WA = '6285765907580';

// ─── Data paket berlangganan ─────────────────────────────────────────────────
const pricingTiers = [
  {
    id: 'event-pass',
    name: 'EVENT PASS',
    price: 'Rp125.000',
    priceStrike: null,
    period: '/ satu event + H+7',
    badge: 'COCOK UNTUK EO BARU',
    label: 'Paling Hemat',
    subtitle: 'Paket sekali pakai per event — aktif dari pembuatan event sampai H+7.',
    waText: 'Halo%20Admin%20LokTik,%20saya%20tertarik%20memesan%20EVENT%20PASS%20LokTik%20(Rp125.000).',
    // 3-4 fitur utama yang tampil di card
    mainFeatures: [
      '1 event aktif pada satu waktu',
      'Direct Transfer ke rekening/QRIS EO',
      '2 akun staff (Scanner + Kasir)',
      'Export PDF & Excel',
    ],
    // Semua detail → tampil di BottomSheet
    summary: 'Aktif dari pembuatan event sampai H+7 agar Anda masih sempat scan tiket, cek peserta, unduh laporan, dan bereskan administrasi pasca acara.',
    timeline: ['Create Event', 'Penjualan', 'Hari Event', 'H+7', 'Paket Berakhir'],
    allFeatures: [
      { title: '1 event aktif pada satu waktu', detail: 'Anda hanya bisa menjalankan satu event sekaligus. Jika Event A masih berlangsung, Event B menunggu sampai Event A selesai.' },
      { title: 'Direct Transfer ke rekening/QRIS EO', detail: 'Setiap pembayaran pembeli langsung masuk ke rekening atau QRIS panitia tanpa ditahan LokTik.' },
      { title: '2 akun staff terpisah', detail: 'Dapat dipakai untuk Scanner QR dan Kasir OTS tanpa memakai akun EO utama.' },
      { title: 'Export PDF & Excel', detail: 'Unduh laporan penjualan, data pembeli, rekap transaksi, dan statistik event.' },
      { title: 'Masa aktif sampai H+7', detail: 'H+7 memberi waktu tambahan untuk scan tiket, cek peserta, unduh laporan, dan menyelesaikan administrasi.' },
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
    label: 'Paling Populer',
    subtitle: 'Paket bulanan untuk EO yang ingin menjalankan satu event aktif dengan fitur inti penuh.',
    waText: 'Halo%20Admin%20LokTik,%20saya%20tertarik%20memesan%20Paket%20LokTik%201%20Bulan%20(Rp199.000).',
    mainFeatures: [
      '1 event aktif dalam periode aktif',
      'Direct Transfer ke rekening/QRIS EO',
      '2 akun staff (Scanner + Kasir OTS)',
      'Export PDF & Excel',
    ],
    summary: 'Saat satu event masih berlangsung, event berikutnya belum bisa dibuat. Setelah event selesai, Anda bebas membuat event baru dalam periode aktif.',
    timeline: null,
    allFeatures: [
      { title: '1 event aktif pada satu waktu', detail: 'Cocok untuk EO yang fokus ke satu acara dulu sebelum pindah ke event berikutnya.' },
      { title: 'Direct Transfer ke rekening/QRIS EO', detail: 'Pembayaran pembeli langsung masuk ke rekening EO, tanpa potongan platform.' },
      { title: '2 akun staff terpisah', detail: 'Untuk Scanner QR dan Kasir OTS tanpa berbagi akun utama EO.' },
      { title: 'Export PDF & Excel', detail: 'Laporan penjualan, data pembeli, rekap transaksi, dan statistik event bisa diunduh.' },
      { title: 'Kasir OTS venue', detail: 'Bisa dipakai untuk penjualan tiket langsung di lokasi acara.' },
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
    label: 'Cocok untuk Tim Aktif',
    subtitle: 'Untuk EO yang mengelola beberapa event berdekatan dan butuh fleksibilitas lebih besar.',
    waText: 'Halo%20Admin%20LokTik,%20saya%20tertarik%20memesan%20Paket%20LokTik%203%20Bulan%20(Rp349.000).',
    mainFeatures: [
      'Unlimited event aktif bersamaan',
      'Hingga 5 akun staff operasional',
      'Direct Transfer ke rekening/QRIS EO',
      'Export PDF & Excel + Kasir OTS',
    ],
    summary: 'Anda bisa menjalankan banyak event secara bersamaan tanpa batas, cocok untuk tim yang mengelola beberapa agenda sekaligus.',
    timeline: null,
    allFeatures: [
      { title: 'Unlimited event aktif', detail: 'Bisa menjalankan banyak event bersamaan tanpa batas: konser, seminar, workshop, meet & greet, bazar, festival.' },
      { title: 'Hingga 5 akun staff', detail: 'Bisa dibagi untuk scanner, kasir, atau tim lapangan lain sesuai kebutuhan event.' },
      { title: 'Direct Transfer ke rekening/QRIS EO', detail: 'Setiap pembayaran masuk langsung ke rekening panitia tanpa ditahan platform.' },
      { title: 'Export PDF & Excel', detail: 'Laporan penjualan, data pembeli, rekap transaksi, dan statistik event.' },
      { title: 'Kasir OTS venue', detail: 'Mendukung penjualan langsung di lokasi acara — cocok untuk pintu masuk atau meja kasir lapangan.' },
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
    badge: 'PRO — PALING HEMAT',
    label: 'Untuk EO Serius',
    subtitle: 'Paket paling lengkap — unlimited event, unlimited staff, priority support.',
    waText: 'Halo%20Admin%20LokTik,%20saya%20tertarik%20memesan%20Paket%20LokTik%206%20Bulan%20PRO%20(Rp599.000).',
    mainFeatures: [
      'Unlimited event aktif bersamaan',
      'Unlimited akun staff',
      'Direct Transfer ke rekening/QRIS EO',
      'Priority support + Export PDF & Excel',
    ],
    summary: 'Unlimited event aktif berarti Anda bebas menggelar banyak acara pada waktu yang sama tanpa batas, dari konser sampai festival besar.',
    timeline: null,
    allFeatures: [
      { title: 'Unlimited event aktif', detail: 'Bebas menjalankan banyak event bersamaan tanpa batas.' },
      { title: 'Unlimited staff', detail: 'Bebas menambahkan akun scanner, kasir, admin lapangan, dan petugas lain sesuai kebutuhan.' },
      { title: 'Direct Transfer ke rekening/QRIS EO', detail: 'Seluruh pembayaran pembeli tetap langsung masuk ke rekening EO.' },
      { title: 'Export PDF & Excel', detail: 'Laporan penjualan, data pembeli, rekap transaksi, dan statistik bisa diunduh kapan saja.' },
      { title: 'Priority support', detail: 'Bantuan lebih cepat untuk tim yang mengelola operasional besar. Cocok untuk EO yang sering jalan event dan butuh respon cepat.' },
      { title: 'Diskon Rp5.000 untuk Add-on Bot WA', detail: 'Member Paket 6 Bulan PRO otomatis mendapat harga spesial untuk kedua paket Add-on Bot WA selama masa aktif.' },
    ],
    tips: [
      'Paling pas untuk EO yang aktif sepanjang tahun.',
      'Ideal jika Anda ingin mengelola banyak event bersamaan dengan tim besar.',
    ],
  },
];

// ─── Data add-on Bot WA (hanya bot kuota yang dijual publik) ─────────────────
export const waAddOnPackages = [
  {
    name: 'PAKET UP TO 900 PESAN',
    price: 'Rp50.000',
    pricePeriod: '/ Bulan',
    proDiscount: 'Rp45.000',
    quota: 'UP TO 900',
    badge: 'ADD-ON RINGAN',
    subtitle: 'Kapasitas ringan untuk event skala kecil sampai menengah.',
    waText: 'Halo%20Admin%20LokTik,%20saya%20tertarik%20membeli%20Add-on%20Bot%20WA%20Paket%20Up%20To%20900%20Pesan%20(Rp50.000%2Fbulan).',
    features: [
      'Up To 900 pesan WhatsApp otomatis per periode',
      'Kuota berkurang setiap kali sistem berhasil mengirim pesan',
      'Cocok untuk event komunitas, workshop, atau gathering kecil',
      'Bisa top up kapan saja saat kuota menipis',
    ],
    highlight: false,
    mode: 'Bot Kuota (Up To 900)',
    helperShort: 'Sistem saldo pesan yang berkurang setiap kali sistem berhasil mengirim WhatsApp otomatis.',
    helperExample: 'Jika kuota habis, EO bisa top up kapan saja; kuota lama tetap aman bila sistem stacking didukung.',
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
      'Up To 9.000 pesan WhatsApp otomatis per periode',
      'Kuota berkurang setiap kali sistem berhasil mengirim pesan',
      'Top up kapan saja tanpa kehilangan sisa kuota',
      'Cocok untuk EO dengan banyak pesanan dan volume kirim tinggi',
      'Bisa stacking bila sistem mendukung penumpukan kuota',
    ],
    highlight: true,
    mode: 'Bot Kuota (Up To 9.000)',
    helperShort: 'Sistem saldo pesan yang berkurang setiap kali sistem berhasil mengirim WhatsApp otomatis.',
    helperExample: 'Jika kuota habis, Anda bisa top up kapan saja. Bila sistem mendukung stacking, sisa kuota sebelumnya tetap aman.',
  },
];

// ─── TierCard — versi ringkas dengan tombol "Info Lebih Lanjut" ──────────────
const TierCard = ({ tier, onDetail }) => (
  <div className="min-w-[268px] snap-center md:min-w-0 flex flex-col h-full">
    <Card
      variant="dark"
      className="relative p-4 border border-brand-green/30 bg-gradient-to-b from-[#09160d] to-[#0e0e0e] flex flex-col h-full space-y-4 touch-press hover:border-brand-green/50 transition-colors"
    >
      {/* Badge populer di sudut */}
      {tier.badge && (
        <div className="absolute -top-px left-4">
          <span className="inline-block bg-brand-green text-black text-[9px] font-black uppercase px-2.5 py-1 rounded-b-md tracking-widest">
            {tier.badge}
          </span>
        </div>
      )}

      {/* Header: nama + label */}
      <div className="pt-4 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-black uppercase text-white tracking-tight">{tier.name}</h3>
          <span className="text-[9px] font-bold text-brand-green uppercase whitespace-nowrap shrink-0">{tier.label}</span>
        </div>

        {/* Harga */}
        <div className="flex flex-col pt-1">
          {tier.priceStrike && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-neutral-500 line-through">{tier.priceStrike}</span>
              <Badge variant="red" className="text-[8px] px-1.5 py-0 font-black">HEMAT</Badge>
            </div>
          )}
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-brand-green">{tier.price}</span>
            <span className="text-[11px] font-mono text-neutral-400">{tier.period}</span>
          </div>
        </div>

        <p className="text-[11px] text-neutral-400 leading-relaxed pt-0.5">{tier.subtitle}</p>
      </div>

      {/* 4 fitur utama */}
      <ul className="space-y-1.5 border-t border-neutral-800/60 pt-3 flex-1">
        {tier.mainFeatures.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-[11px] font-medium text-neutral-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-green shrink-0 mt-0.5" />
            <span className="leading-snug">{f}</span>
          </li>
        ))}
      </ul>

      {/* Tombol Info Lebih Lanjut */}
      <button
        type="button"
        onClick={() => onDetail(tier)}
        className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-brand-green/80 hover:text-brand-green transition-colors py-1"
      >
        <Info className="w-3.5 h-3.5 shrink-0" />
        Lihat semua fitur &amp; detail
      </button>

      {/* CTA Utama */}
      <a
        href={buildWhatsAppUrl(ADMIN_WA, tier.waText)}
        target="_blank"
        rel="noopener noreferrer"
        className="block touch-press"
      >
        <Button
          variant="green"
          fullWidth
          size="md"
          className="min-h-[44px] font-black justify-center flex items-center gap-2 text-[11px] uppercase tracking-wider"
        >
          <span>PESAN {tier.name} VIA WA</span>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </Button>
      </a>

      {/* Meta info bawah */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-neutral-500 pt-0.5">
        <span className="inline-flex items-center gap-1">
          <Clock3 className="w-3 h-3 text-brand-green/60" />
          {tier.id === 'event-pass' ? 'Aktif sampai H+7' : 'Sesuai masa langganan'}
        </span>
      </div>
    </Card>
  </div>
);

// ─── BottomSheet content: detail paket ──────────────────────────────────────
const TierDetailContent = ({ tier }) => (
  <div className="space-y-5">
    {/* Harga ulang di dalam sheet */}
    <div className="flex flex-col border-b border-neutral-800 pb-4">
      {tier.priceStrike && (
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-mono text-neutral-500 line-through">{tier.priceStrike}</span>
          <Badge variant="red" className="text-[8px] px-1.5 py-0 font-black">HEMAT</Badge>
        </div>
      )}
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-black font-mono text-brand-green">{tier.price}</span>
        <span className="text-xs font-mono text-neutral-400">{tier.period}</span>
      </div>
      <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{tier.summary}</p>
    </div>

    {/* Timeline khusus Event Pass */}
    {tier.id === 'event-pass' && tier.timeline && (
      <div className="p-3 rounded-lg border border-brand-green/20 bg-brand-green/5 space-y-2">
        <p className="text-[10px] font-black uppercase text-brand-green tracking-widest">Timeline Event Pass</p>
        <div className="flex flex-wrap gap-2 items-center">
          {tier.timeline.map((step, i) => (
            <React.Fragment key={step}>
              <span className="px-2 py-1 rounded-md bg-[#0a0a0a] border border-neutral-800 font-mono text-[10px] uppercase text-neutral-300">
                {step}
              </span>
              {i < tier.timeline.length - 1 && (
                <ChevronRight className="w-3 h-3 text-brand-green/60 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="text-[11px] text-neutral-400 leading-relaxed">
          H+7 adalah masa tambahan untuk scan tiket, cek peserta, unduh laporan, dan merapikan administrasi sebelum event diarsipkan.
        </p>
      </div>
    )}

    {/* Semua fitur detail */}
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">Semua Fitur</p>
      {tier.allFeatures.map((feat, i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-neutral-900/60 border border-neutral-800/60">
          <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-white leading-snug">{feat.title}</p>
            <p className="text-[11px] text-neutral-400 leading-relaxed mt-0.5">{feat.detail}</p>
          </div>
        </div>
      ))}
    </div>

    {/* Tips */}
    {tier.tips && tier.tips.length > 0 && (
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">Tips</p>
        {tier.tips.map((tip, i) => (
          <div key={i} className="flex items-start gap-2 text-[11px] text-neutral-400">
            <Sparkles className="w-3.5 h-3.5 text-brand-green/70 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{tip}</span>
          </div>
        ))}
      </div>
    )}

    {/* Tombol pesan di dalam sheet */}
    <a
      href={buildWhatsAppUrl(ADMIN_WA, tier.waText)}
      target="_blank"
      rel="noopener noreferrer"
      className="block touch-press pt-2"
    >
      <Button
        variant="green"
        fullWidth
        size="md"
        className="min-h-[48px] font-black justify-center flex items-center gap-2 text-sm uppercase tracking-wider"
      >
        <Zap className="w-4 h-4 shrink-0" />
        <span>PESAN {tier.name} VIA WA</span>
        <ArrowRight className="w-4 h-4 shrink-0" />
      </Button>
    </a>
  </div>
);

// ─── AddOnCard — Bot Berbasis Kuota (dengan tombol beli) ─────────────────────
const AddOnCard = ({ pkg }) => (
  <Card
    variant="dark"
    className={`p-4 sm:p-5 border-2 flex flex-col space-y-4 touch-press relative overflow-hidden ${
      pkg.highlight
        ? 'border-brand-green/50 bg-gradient-to-br from-[#09160d] via-[#0e0e0e] to-[#0e0e0e] shadow-[0_0_30px_rgba(57,255,20,0.08)]'
        : 'border-neutral-700 bg-[#121212]'
    }`}
  >
    {/* OVERLAY MAINTENANCE */}
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/75 backdrop-blur-[2px] p-4 text-center">
      <div className="bg-black/90 border border-neutral-700 p-4 rounded-xl flex flex-col items-center shadow-2xl">
        <AlertTriangle className="w-8 h-8 text-neutral-400 mb-2" />
        <span className="text-sm font-black text-white uppercase tracking-widest">
          UNDER MAINTENANCE
        </span>
        <span className="text-[10px] text-neutral-400 font-bold uppercase mt-1">
          PAKET INI SEMENTARA TIDAK TERSEDIA
        </span>
      </div>
    </div>

    {pkg.highlight && (
      <div className="absolute top-0 right-0">
        <div className="bg-brand-green text-black text-[9px] font-black uppercase px-3 py-1 tracking-widest rounded-bl-md">
          Paling Populer
        </div>
      </div>
    )}

    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3 gap-2">
        <Badge variant="green" className="text-[9px] px-2 py-0.5 font-extrabold">{pkg.badge}</Badge>
        <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase">ADD-ON WA</span>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <MessageSquare className={`w-5 h-5 shrink-0 ${pkg.highlight ? 'text-brand-green' : 'text-neutral-400'}`} />
          <div>
            <h3 className="text-sm font-black uppercase text-white">{pkg.name}</h3>
            <p className="text-[10px] font-mono text-neutral-400 font-bold uppercase">{pkg.quota} PESAN WHATSAPP</p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-neutral-800/60 space-y-2">
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-black font-mono ${pkg.highlight ? 'text-brand-green' : 'text-brand-green'}`}>
              {pkg.price}
            </span>
            <span className="text-sm font-mono font-bold text-brand-green/60">{pkg.pricePeriod}</span>
          </div>

          {pkg.proDiscount && (
            <div className="p-2.5 rounded-md border border-brand-orange/50 bg-brand-orange/10 flex items-start gap-2">
              <span className="text-sm shrink-0 leading-none mt-0.5">🔥</span>
              <div className="text-left leading-snug">
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-orange">
                  SPESIAL MEMBER PRO (6 BULAN):
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xs font-bold text-neutral-400 line-through">{pkg.price}</span>
                  <span className="text-sm font-black font-mono text-brand-orange">Hanya {pkg.proDiscount}/bln</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-neutral-400 mt-2 leading-relaxed">{pkg.subtitle}</p>
      </div>

      <div className="space-y-1.5 pt-3 border-t border-neutral-800">
        {pkg.features.map((feat, i) => (
          <div key={i} className="flex items-start gap-2 text-[11px] font-medium text-neutral-300">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-brand-green" />
            <span className="leading-snug">{feat}</span>
          </div>
        ))}
        <div className="p-3 rounded-md border border-neutral-800 bg-black/30 text-[11px] text-neutral-400 mt-2">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-brand-green/70 shrink-0 mt-0.5" />
            <div>
              <p className="font-black uppercase text-white tracking-wider mb-1">{pkg.mode}</p>
              <p>{pkg.helperShort}</p>
              <p className="mt-1 text-neutral-500">{pkg.helperExample}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="pt-1">
      <Button
        variant="outline"
        fullWidth
        size="md"
        disabled
        className="min-h-[44px] font-black justify-center flex items-center gap-2 text-[11px] sm:text-xs uppercase tracking-wider border-neutral-700 text-neutral-500 bg-neutral-900/50 cursor-not-allowed opacity-80"
      >
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>UNDER MAINTENANCE</span>
      </Button>
    </div>
  </Card>
);



// ─── Main export ─────────────────────────────────────────────────────────────
export const ForEoPricing = () => {
  const [activeTier, setActiveTier] = useState(null);

  return (
    <div id="pricing-plans" className="space-y-12 pt-4">

      {/* ── Section header ──────────────────────────────────────────────── */}
      <div className="border-b border-neutral-800 pb-2 space-y-2">
        <h2 className="text-lg sm:text-xl font-black uppercase text-brand-green tracking-tight flex items-center gap-2">
          <DollarSign className="w-5 h-5 shrink-0" /> SKEMA BIAYA &amp; PRICING BERLANGGANAN
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-4xl">
          Pilih paket sesuai cara kerja Anda. Event Pass untuk satu event, paket bulanan untuk EO yang ingin operasional lebih fleksibel, dan paket PRO untuk tim yang menjalankan banyak event sekaligus.
        </p>
      </div>

      {/* ── 4 card paket — scroll horizontal di mobile, grid di desktop ── */}
      {/*   min-w card = 268px → cukup muat 1 card + peek di HP 375px     */}
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scroll-smooth
                        md:grid md:grid-cols-2 md:overflow-visible md:pb-0
                        xl:grid-cols-4">
          {pricingTiers.map((tier) => (
            <TierCard key={tier.id} tier={tier} onDetail={setActiveTier} />
          ))}
        </div>
        {/* Scroll hint — mobile only */}
        <p className="mt-2 text-[10px] text-neutral-600 text-center md:hidden">
          ← geser untuk melihat semua paket →
        </p>
      </div>

      {/* ── BottomSheet detail paket ────────────────────────────────────── */}
      <BottomSheet
        open={!!activeTier}
        onClose={() => setActiveTier(null)}
        title={activeTier ? `Detail: ${activeTier.name}` : ''}
        accent="green"
        maxWidth="max-w-lg"
      >
        {activeTier && <TierDetailContent tier={activeTier} />}
      </BottomSheet>

      {/* ── Section Add-on Bot WA ────────────────────────────────────────── */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-neutral-800 pb-3 gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-brand-green/15 border border-brand-green/40 rounded-md">
                <Bot className="w-5 h-5 text-brand-green" />
              </div>
              <h2 className="text-lg sm:text-xl font-black uppercase text-brand-green tracking-tight">
                ADD-ON BOT WHATSAPP OTOMATIS
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 font-medium leading-relaxed sm:pl-9">
              Pilih paket kuota yang sesuai kapasitas event Anda. Kuota berkurang tiap pesan terkirim dan bisa di-top up kapan saja.
            </p>
          </div>
          <Badge variant="green" className="w-fit text-[10px] px-2.5 py-1 font-black">
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> STACKING KUOTA DIDUKUNG
          </Badge>
        </div>

        {/* Bot Berbasis Kuota — 2 card dengan tombol beli */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {waAddOnPackages.map((pkg) => (
            <AddOnCard key={pkg.name} pkg={pkg} />
          ))}
        </div>

        {/* Cara kerja + catatan kaki */}
        <div className="p-4 sm:p-5 bg-neutral-900/50 border border-neutral-800 rounded-md space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-brand-green/15 border border-brand-green/30 rounded-md shrink-0">
              <MessageSquare className="w-5 h-5 text-brand-green" />
            </div>
            <div className="space-y-3 w-full">
              <h4 className="text-xs font-black uppercase text-white tracking-tight">Cara Kerja Add-On Bot WA</h4>
              <div className="grid grid-cols-1 lg:grid-cols-1 gap-3 text-[11px] sm:text-xs text-neutral-400 leading-relaxed">
                <div className="p-3 rounded-md border border-neutral-800 bg-black/30 space-y-2">
                  <p className="font-black uppercase text-brand-green tracking-wider">Bot Berbasis Kuota</p>
                  <p>Kuota pesan berkurang setiap kali sistem berhasil mengirim WhatsApp otomatis. Istilah "Up To" dipakai agar ekspektasi lebih realistis karena jumlah pesan aktual bisa sedikit berbeda akibat retry, pesan gagal, rate limit WhatsApp, atau sistem internal.</p>
                  <p className="text-neutral-500">Jika kuota habis, Anda bisa top up kapan saja. Bila sistem mendukung stacking, sisa kuota sebelumnya tetap aman.</p>
                </div>
              </div>
              <ul className="text-[11px] sm:text-xs text-neutral-400 leading-relaxed space-y-1 list-disc pl-4">
                <li>Add-on Bot WA adalah <strong className="text-neutral-200">langganan bulanan terpisah</strong> dari paket inti LokTik.</li>
                <li><strong className="text-brand-green font-bold">Up To 900 Pesan</strong> dan <strong className="text-brand-green font-bold">Up To 9.000 Pesan</strong> memberi gambaran kapasitas yang realistis.</li>
                <li>Member <strong className="text-brand-green font-bold">Paket 6 Bulan PRO</strong> otomatis dapat harga spesial <strong className="text-brand-orange font-bold">Diskon Rp5.000</strong> selama masa aktif — tidak perlu request manual.</li>
                <li>Jika kuota habis sebelum tanggal reset, EO bisa top up tambahan kapan saja sesuai dukungan stacking kuota.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { DollarSign, CheckCircle2, X, ArrowRight, MessageSquare, Zap, Bot } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const pricingTiers = [
  {
    name: 'PAKET 1 BULAN',
    price: 'Rp199.000',
    priceStrike: 'Rp299.000',
    period: '/ 1 Bulan',
    badge: 'PROMO LAUNCHING',
    subtitle: 'Bebas Jualan Tiket 0% Komisi — Tidak termasuk layanan Bot WA',
    waText: 'Halo%20Admin%20LokTik,%20saya%20tertarik%20memesan%20Paket%20LokTik%201%20Bulan%20(Rp199.000).',
    features: [
      { text: 'Bebas Jualan Tiket 0% Komisi Seumur Hidup', included: true },
      { text: 'Dana Direct Masuk Rekening EO (Transfer Bank)', included: true },
      { text: 'Gate Venue & Realtime HP Scanner Staf Gate', included: true },
      { text: 'Kasir OTS Venue Fast-Issue Direct (On The Spot)', included: true },
      { text: 'Unlimited Kategori & Stok Tiket Per Event', included: true },
      { text: 'Layanan Bot WA Otomatis Kirim Tiket (Add-on Terpisah)', included: false },
    ],
    highlight: false,
  },
  {
    name: 'PAKET 3 BULAN',
    price: 'Rp349.000',
    priceStrike: 'Rp499.000',
    period: '/ 3 Bulan',
    badge: 'PROMO HEMAT 30%',
    subtitle: 'Akses 3 Bulan Full Fitur — Tidak termasuk layanan Bot WA',
    waText: 'Halo%20Admin%20LokTik,%20saya%20tertarik%20memesan%20Paket%20LokTik%203%20Bulan%20(Rp349.000).',
    features: [
      { text: 'Bebas Jualan Tiket 0% Komisi Seumur Hidup', included: true },
      { text: 'Dana Direct Masuk Rekening EO (Transfer Bank)', included: true },
      { text: 'Gate Venue & Realtime HP Scanner Staf Gate', included: true },
      { text: 'Kasir OTS Venue Fast-Issue Direct (On The Spot)', included: true },
      { text: 'Unlimited Kategori & Stok Tiket Per Event', included: true },
      { text: 'Layanan Bot WA Otomatis Kirim Tiket (Add-on Terpisah)', included: false },
    ],
    highlight: false,
  },
  {
    name: 'PAKET 6 BULAN PRO',
    price: 'Rp599.000',
    priceStrike: 'Rp799.000',
    period: '/ 6 Bulan',
    badge: 'PRO — PALING HEMAT!',
    subtitle: 'Paket 6 Bulan Full Fitur — Tidak termasuk layanan Bot WA',
    waText: 'Halo%20Admin%20LokTik,%20saya%20tertarik%20memesan%20Paket%20LokTik%206%20Bulan%20PRO%20(Rp599.000).',
    features: [
      { text: 'Bebas Jualan Tiket 0% Komisi Seumur Hidup', included: true },
      { text: 'Dana Direct Masuk Rekening EO (Transfer Bank)', included: true },
      { text: 'Gate Venue & Realtime HP Scanner Staf Gate', included: true },
      { text: 'Kasir OTS Venue Fast-Issue Direct (On The Spot)', included: true },
      { text: 'Unlimited Kategori & Stok Tiket Per Event', included: true },
      { text: 'Priority Support CS LokTik (Fast Response)', included: true },
      { text: 'Layanan Bot WA Otomatis Kirim Tiket (Add-on Terpisah)', included: false },
    ],
    highlight: true,
  },
];

export const waAddOnPackages = [
  {
    name: 'PAKET 1.000 PESAN',
    price: 'Rp50.000',
    quota: '1.000',
    badge: 'ADD-ON RINGAN',
    subtitle: 'Kuota Bot WA 1.000 Pesan — Cocok Event Kecil',
    waText: 'Halo%20Admin%20LokTik,%20saya%20tertarik%20membeli%20Add-on%20Bot%20WA%20Paket%201.000%20Pesan%20(Rp50.000).',
    features: [
      { text: '+1.000 Kuota Pesan Bot WhatsApp Otomatis', included: true },
      { text: 'Kirim Tiket QR Otomatis ke Pembeli', included: true },
      { text: 'Auto-Reply Konfirmasi Pembayaran', included: true },
      { text: 'Approve & Verifikasi Massal via Bot', included: true },
      { text: 'Kuota Berlaku Selama Masa Aktif Langganan', included: true },
      { text: 'Bisa Top Up Kapan Saja (Stacking)', included: true },
    ],
    highlight: false,
    icon: Zap,
  },
  {
    name: 'PAKET 10.000 PESAN',
    price: 'Rp70.000',
    quota: '10.000',
    badge: 'ADD-ON SUPER VALUE',
    subtitle: 'Kuota Bot WA 10.000 Pesan — Hemat 86% Per Pesan!',
    waText: 'Halo%20Admin%20LokTik,%20saya%20tertarik%20membeli%20Add-on%20Bot%20WA%20Paket%2010.000%20Pesan%20(Rp70.000).',
    features: [
      { text: '+10.000 Kuota Pesan Bot WhatsApp Otomatis', included: true },
      { text: 'Kirim Tiket QR Otomatis ke Pembeli', included: true },
      { text: 'Auto-Reply Konfirmasi Pembayaran', included: true },
      { text: 'Approve & Verifikasi Massal via Bot', included: true },
      { text: 'Kuota Berlaku Selama Masa Aktif Langganan', included: true },
      { text: 'Bisa Top Up Kapan Saja (Stacking)', included: true },
      { text: 'Harga Per Pesan LEBIH MURAH 86%!', included: true },
    ],
    highlight: true,
    icon: Bot,
  },
];

export const ForEoPricing = () => {
  return (
    <div id="pricing-plans" className="space-y-12 pt-4">
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
                <div className="flex flex-col mt-1.5 space-y-0.5">
                  {tier.priceStrike && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono text-neutral-500 line-through font-bold decoration-brand-red/80">
                        {tier.priceStrike}
                      </span>
                      <Badge variant="red" className="text-[8px] px-1.5 py-0 font-black">
                        {tier.highlight ? 'HEMAT Rp200RB' : tier.priceStrike === 'Rp499.000' ? 'HEMAT Rp150RB' : 'HEMAT Rp100RB'}
                      </Badge>
                    </div>
                  )}
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-brand-blue">{tier.price}</span>
                    <span className="text-xs font-mono text-neutral-400">{tier.period}</span>
                  </div>
                </div>
                <p className="text-xs text-neutral-400 font-medium mt-2 leading-relaxed">{tier.subtitle}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-neutral-800 text-left">
                {tier.features.map((feat, fIdx) => (
                  <div
                    key={fIdx}
                    className={`flex items-start space-x-2 text-xs font-bold ${
                      feat.included ? 'text-neutral-300' : 'text-neutral-500 line-through'
                    }`}
                  >
                    {feat.included ? (
                      <CheckCircle2 className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-4 h-4 text-brand-red shrink-0 mt-0.5" />
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

      {/* ADD-ON BOT WHATSAPP SECTION */}
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
              Tambah kuota pesan otomatis untuk mempercepat distribusi tiket &amp; verifikasi pembayaran — tanpa perlu kirim manual satu-per-satu!
            </p>
          </div>
          <Badge variant="purple" className="w-fit sm:w-auto text-[10px] px-2.5 py-1 font-black">
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> BISA DI-STACK (BERTUMPUK)
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {waAddOnPackages.map((pkg, idx) => {
            const Icon = pkg.icon || Zap;
            return (
              <Card
                key={idx}
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
                      ⚡ PALING LARIS
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="purple" className="text-[9px] px-2 py-0.5 font-extrabold">
                        {pkg.badge}
                      </Badge>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase">KUOTA TOP UP</span>
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
                          +{pkg.quota} PESAN WHATSAPP
                        </p>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between mt-4 pt-3 border-t border-neutral-800/60">
                      <div className="flex items-baseline space-x-1.5">
                        <span className={`text-3xl sm:text-4xl font-black font-mono ${
                          pkg.highlight ? 'text-brand-purple' : 'text-brand-blue'
                        }`}>
                          {pkg.price}
                        </span>
                      </div>
                      <div className="text-right">
                        {pkg.highlight && (
                          <div className="text-[9px] font-black uppercase text-brand-green tracking-wider">
                            HEMAT 86% / PESAN
                          </div>
                        )}
                        <div className="text-[10px] font-mono text-neutral-500">
                          {pkg.highlight ? '@Rp7 / pesan' : '@Rp50 / pesan'}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-400 font-medium mt-2 leading-relaxed">{pkg.subtitle}</p>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-neutral-800 text-left">
                    {pkg.features.map((feat, fIdx) => (
                      <div
                        key={fIdx}
                        className="flex items-start space-x-2 text-xs font-bold text-neutral-300"
                      >
                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${
                          fIdx === pkg.features.length - 1 && pkg.highlight
                            ? 'text-brand-green'
                            : 'text-brand-purple'
                        }`} />
                        <span>{feat.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 sm:pt-4">
                  <a
                    href={`https://wa.me/6285765907580?text=${pkg.waText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block touch-press"
                  >
                    <Button
                      variant={pkg.highlight ? 'purple' : 'blue'}
                      fullWidth
                      size="md"
                      className={`min-h-[46px] font-black justify-center flex items-center space-x-2 text-xs sm:text-sm uppercase tracking-wider ${
                        pkg.highlight ? 'shadow-[0_0_20px_rgba(139,92,246,0.35)]' : ''
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      <span>BELI {pkg.name} VIA WA</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="p-4 sm:p-5 bg-neutral-900/50 border border-neutral-800 rounded-md space-y-2">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-brand-yellow/20 border border-brand-yellow/50 rounded-md shrink-0">
              <MessageSquare className="w-5 h-5 text-brand-yellow" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase text-white tracking-tight">
                CARA KERJA ADD-ON BOT WA
              </h4>
              <ul className="text-[11px] sm:text-xs text-neutral-400 font-medium leading-relaxed space-y-1 list-disc pl-4">
                <li>Setiap 1 (satu) pesan bot = 1 (satu) pengiriman pesan WA otomatis (tiket QR, notifikasi approve, dll).</li>
                <li>Kuota bisa ditambahkan kapan saja (stacking) — penambahan tidak mengganti, tapi MENAMBAH sisa kuota yang ada.</li>
                <li>Untuk pesan paket PRO 1 Tahun, EO otomatis mendapatkan bonus kuota <strong className="text-brand-purple font-bold">10.000 PESAN</strong> GRATIS.</li>
                <li>Jika kuota habis, fitur bot otomatis berhenti — EO perlu Top Up Add-on terlebih dahulu atau kirim manual.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

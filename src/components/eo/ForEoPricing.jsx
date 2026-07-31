import React from 'react';
import { DollarSign, CheckCircle2, X, ArrowRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const pricingTiers = [
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
    badge: 'MANUAL WHATSAPP',
    subtitle: 'Akses Bebas Jualan Tiket 3 Bulan (Tanpa Layanan Bot WA)',
    waText: 'Halo%20Admin%20LokTik,%20saya%20tertarik%20memesan%20Paket%20LokTik%203%20Bulan%20(Rp300.000).',
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
    name: 'PAKET 1 TAHUN PRO',
    price: 'Rp566.000',
    period: '/ 1 Tahun',
    badge: 'PRO + BOT WA OTOMATIS',
    subtitle: 'Satu-satunya Paket Hemat 1 Tahun + Fitur Bot WA Otomatis',
    waText: 'Halo%20Admin%20LokTik,%20saya%20tertarik%20memesan%20Paket%20LokTik%201%20Tahun%20PRO%20(Rp566.000).',
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
];

export const ForEoPricing = () => {
  return (
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
  );
};

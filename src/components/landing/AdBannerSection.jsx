import React from 'react';
import { ExternalLink, Code2, Megaphone, ArrowUpRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const AdBannerSection = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 pt-8 space-y-6 text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ad Slot 1: Jasa Build Website by Ferdy */}
        <Card variant="dark" className="p-6 space-y-4 border-neutral-800 bg-gradient-to-br from-[#121212] via-[#141414] to-[#1a1a1a] flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="green" className="text-[10px] px-2 py-0.5 flex items-center gap-1">
                <Code2 className="w-3 h-3 text-black" />
                <span>JASA BUILD WEBSITE CUSTOM</span>
              </Badge>
              <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase">BY FERDY.WEB.ID</span>
            </div>
            <h3 className="text-xl font-black uppercase text-white tracking-tight leading-snug">
              BUTUH WEBSITE CUSTOM ATAU SISTEM KHUSUS?
            </h3>
            <p className="text-xs text-neutral-400 font-medium leading-relaxed">
              Pembuatan website profesional, landing page event, aplikasi web, dan sistem ticketing custom dengan desain modern &amp; performa tinggi.
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-800">
            <a
              href="https://ferdy.web.id"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button variant="green" fullWidth size="md" className="font-bold flex items-center justify-center space-x-2">
                <span>LIHAT PORTOFOLIO FERDY.WEB.ID</span>
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </Card>

        {/* Ad Slot 2: Open Sponsor & Partner Ad Space */}
        <Card variant="dark" className="p-6 space-y-4 border-dashed border-neutral-700 bg-[#121212] flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="purple" className="text-[9px] px-2 py-0.5 flex items-center gap-1">
                <Megaphone className="w-3 h-3 text-white" />
                <span>SLOT IKLAN SPONSOR &amp; PARTNER</span>
              </Badge>
              <span className="text-[10px] font-mono text-brand-yellow font-bold uppercase">AVAILABLE SLOT</span>
            </div>
            <h3 className="text-xl font-black uppercase text-white tracking-tight leading-snug">
              PASANG IKLAN BRAND / EVENT KAMU DI SINI
            </h3>
            <p className="text-xs text-neutral-400 font-medium leading-relaxed">
              Jangkau ribuan pengunjung &amp; pembeli tiket event lokal. Promosikan brand, produk, atau event Anda di banner utama LokTik.
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-800">
            <a
              href="https://wa.me/6281234567890?text=Halo%20Admin%20LokTik,%20saya%20tertarik%20pasang%20iklan%20sponsor"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button variant="purple" fullWidth size="md" className="font-bold flex items-center justify-center space-x-2">
                <span>HUBUNGI UNTUK PASANG IKLAN</span>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </Card>
      </div>
    </section>
  );
};

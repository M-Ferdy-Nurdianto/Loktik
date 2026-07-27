import React from 'react';
import { ExternalLink, Code2, Megaphone, ArrowUpRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const AdBannerSection = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 pt-8 space-y-4 text-left">
      {/* 1. Slot Iklan Sponsor & Partner FIRST */}
      <Card variant="dark" className="p-6 space-y-4 border-dashed border-neutral-700 bg-[#121212]">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="purple" className="text-[9px] px-2 py-0.5 flex items-center gap-1">
              <Megaphone className="w-3 h-3 text-white" />
              <span>SLOT IKLAN SPONSOR &amp; PARTNER</span>
            </Badge>
            <span className="text-[10px] font-mono text-brand-yellow font-bold uppercase">AVAILABLE SLOT</span>
          </div>
          <h3 className="text-xl font-black uppercase text-white tracking-tight leading-snug">
            PASANG IKLAN BRAND ATAU EVENT DI SINI
          </h3>
          <p className="text-xs text-neutral-400 font-medium leading-relaxed">
            Promosikan event, brand, atau produk Anda di platform LokTik. Tersedia slot banner iklan khusus partner &amp; sponsor.
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

      {/* 2. Jasa Build Website by Ferdy SECOND */}
      <Card variant="dark" className="p-6 space-y-4 border-neutral-800 bg-[#121212]">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="green" className="text-[10px] px-2 py-0.5 flex items-center gap-1">
              <Code2 className="w-3 h-3 text-black" />
              <span>DEVELOPER / WEBSITE BUILDER</span>
            </Badge>
            <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase">FERDY NURDIANTO</span>
          </div>
          <h3 className="text-xl font-black uppercase text-white tracking-tight leading-snug">
            BUTUH WEBSITE CUSTOM ATAU SISTEM TICKETING?
          </h3>
          <p className="text-xs text-neutral-400 font-medium leading-relaxed">
            Jasa pembuatan website profesional, landing page event, aplikasi web, dan sistem ticketing custom oleh Ferdy Nurdianto.
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
    </section>
  );
};

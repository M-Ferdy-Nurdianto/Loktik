import React from 'react';
import { Code2, ArrowUpRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const AdBannerSection = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 pt-6 text-left">
      {/* Jasa Build Website by Ferdy Nurdianto */}
      <Card variant="dark" className="p-5 sm:p-6 space-y-4 border-neutral-800 bg-[#121212] touch-press">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="blue" className="text-[10px] px-2 py-0.5 flex items-center gap-1 font-bold">
              <Code2 className="w-3 h-3 text-black" />
              <span>DEVELOPER / WEBSITE BUILDER</span>
            </Badge>
            <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase">FERDY NURDIANTO</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black uppercase text-white tracking-tight leading-snug">
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
            <Button variant="blue" fullWidth size="md" className="font-extrabold flex items-center justify-center space-x-2 min-h-[44px] text-xs sm:text-sm">
              <span>LIHAT PORTOFOLIO FERDY.WEB.ID</span>
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </Card>
    </section>
  );
};

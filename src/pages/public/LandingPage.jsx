import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, MapPin, Ticket, ArrowRight, Sparkles, Flame, Tag } from 'lucide-react';
import { useActiveEvents } from '../../hooks/useEvents';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatDate, formatRupiah } from '../../utils/formatters';
import { FaqSection } from '../../components/landing/FaqSection';
import { TermsSection } from '../../components/landing/TermsSection';
import { AdBannerSection } from '../../components/landing/AdBannerSection';

export const LandingPage = () => {
  const { events, loading, error } = useActiveEvents();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter events based on search query
  const filteredEvents = events.filter((evt) => {
    return (
      evt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (evt.description && evt.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  // Calculate starting price helper
  const getStartingPrice = (evt) => {
    if (!evt.ticket_categories || evt.ticket_categories.length === 0) return null;
    const prices = evt.ticket_categories.map((tc) => tc.price).filter((p) => p !== undefined && p !== null);
    if (prices.length === 0) return null;
    return Math.min(...prices);
  };

  return (
    <div className="space-y-8 sm:space-y-12 pb-16 text-left bg-[#0a0a0a]">
      {/* Running Text Marquee Banner */}
      <div className="w-full bg-[#121212] border-b border-neutral-800 py-2.5 overflow-hidden text-[11px] font-mono font-bold uppercase tracking-wider whitespace-nowrap">
        <div className="animate-marquee flex items-center space-x-8">
          {[1, 2, 3].map((key) => (
            <div key={key} className="flex items-center space-x-6 shrink-0">
              <span className="inline-flex items-center gap-1.5 text-white bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                <Flame className="w-3.5 h-3.5 text-brand-blue fill-brand-blue" />
                <span className="text-brand-blue font-extrabold">LIVE TICKETING DIRECT</span>
              </span>
              <span className="text-brand-blue font-bold">0% POTONGAN KOMISI PLATFORM</span>
              <span className="text-neutral-600">•</span>
              <span className="text-brand-blue font-bold">TRANSFER DIRECT KE REKENING / QRIS PANITIA</span>
              <span className="text-neutral-600">•</span>
              <span className="text-brand-blue font-bold">VERIFIED GATE WRISTBAND SCANNER</span>
              <span className="text-neutral-600">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* Buyer Hero Banner */}
      <section className="relative pt-6 pb-12 sm:pb-16 border-b border-neutral-800 bg-[#0d0d0d]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-5 text-center relative z-10">
          <Badge variant="blue" className="py-1 px-3 text-xs tracking-widest font-black uppercase">
            PLATFORM TIKET EVENT LOKAL &amp; KOMUNITAS
          </Badge>

          <h1 className="text-3xl sm:text-6xl md:text-7xl font-black tracking-tighter uppercase leading-[0.95] text-white max-w-4xl mx-auto">
            AMBIL TIKET EVENT <br />
            <span className="text-brand-blue">INDEPENDEN FAVORITMU</span>
          </h1>

          <p className="text-xs sm:text-base text-neutral-300 font-medium max-w-2xl mx-auto leading-relaxed">
            Langsung amankan tiket konser, bazar, seminar, &amp; festival lokal. Direct transaksi ke panitia tanpa ribet, tanpa potongan biaya aneh-aneh.
          </p>

          {/* Event Search Input */}
          <div className="max-w-2xl mx-auto pt-2">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-brand-blue absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama event, konser, seminar, atau venue..."
                className="w-full pl-12 pr-4 py-3.5 bg-neutral-900 text-white font-medium text-sm rounded-xl border border-neutral-700 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue placeholder:text-neutral-500 shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Event Directory */}
      <section id="events" className="max-w-7xl mx-auto px-4 md:px-8 space-y-6">
        <div className="border-b border-neutral-800 pb-4">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
            DAFTAR EVENT PILIHAN
          </h2>
          <p className="text-xs text-neutral-400 font-semibold mt-1">
            Pilih event kesukaanmu terus beli tiketnya direct dari panitia
          </p>
        </div>

        {/* Event Grid */}
        {loading ? (
          <Card variant="dark" className="text-center py-12 sm:py-16">
            <p className="font-bold text-xs sm:text-sm text-brand-blue animate-pulse uppercase tracking-wider">MEMUAT DAFTAR EVENT...</p>
          </Card>
        ) : error ? (
          <Card variant="dark" className="text-center py-12 sm:py-16 border-brand-red">
            <p className="font-bold text-xs sm:text-sm text-brand-red uppercase">{error}</p>
          </Card>
        ) : filteredEvents.length === 0 ? (
          <Card variant="dark" className="text-center py-12 sm:py-16 space-y-3">
            <p className="font-extrabold text-sm sm:text-base text-white uppercase">TIDAK ADA EVENT DITEMUKAN</p>
            <p className="text-xs text-neutral-400">Coba ubah kata kunci pencarian Anda.</p>
          </Card>
        ) : (
          <div className="space-y-3.5 sm:space-y-4">
            {filteredEvents.map((evt, index) => {
              const minPrice = getStartingPrice(evt);

              return (
                <Card key={evt.id} variant="dark" hover className="p-3 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-5 border border-neutral-800 hover:border-brand-blue/60 transition-colors touch-press">
                  <div className="flex items-center sm:items-start gap-3.5 sm:gap-5 w-full flex-1">
                    {/* Left side: Poster Image (Vertical 4:5 Poster Ratio) */}
                    <div className="w-24 sm:w-32 aspect-[4/5] bg-neutral-900 rounded-xl overflow-hidden shrink-0 relative border border-neutral-800/80 shadow-md">
                      {evt.poster_url ? (
                        <img
                          src={evt.poster_url}
                          alt={evt.name}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-600 font-bold text-[10px] sm:text-xs uppercase text-center p-1">
                          LOKTIK EVENT
                        </div>
                      )}
                      <Badge variant="blue" className="absolute top-1 left-1 text-[8px] sm:text-[9px] px-1 py-0 font-extrabold">
                        LOKAL
                      </Badge>
                    </div>

                    {/* Right side: Numbering + Title, Date, Starting Price */}
                    <div className="flex-1 space-y-1 sm:space-y-1.5 text-left min-w-0">
                      <h3 className="text-base sm:text-xl font-extrabold uppercase tracking-tight text-white leading-tight sm:leading-snug flex items-start space-x-1.5">
                        <span className="font-black text-brand-blue text-sm sm:text-lg shrink-0">{index + 1}.</span>
                        <span className="truncate sm:whitespace-normal">{evt.name}</span>
                      </h3>

                      <div className="flex items-center space-x-2 text-brand-blue font-semibold text-[11px] sm:text-xs font-mono pt-0.5">
                        <Calendar className="w-3.5 h-3.5 shrink-0 text-brand-blue" />
                        <span>{formatDate(evt.event_date)}</span>
                      </div>

                      {minPrice !== null && (
                        <div className="flex items-center space-x-1 text-xs font-bold text-white pt-1">
                          <Tag className="w-3.5 h-3.5 text-brand-yellow shrink-0" />
                          <span className="text-neutral-400 text-[10px] uppercase font-mono">MULAI:</span>
                          <span className="text-brand-blue font-mono font-black">{formatRupiah(minPrice)}</span>
                        </div>
                      )}

                      <p className="text-[11px] sm:text-xs text-neutral-400 font-medium line-clamp-2 leading-relaxed hidden xs:block sm:block pt-0.5">
                        {evt.description || 'Acara event independen lokal.'}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
                    <Link to={`/event/${evt.slug}`} className="block w-full">
                      <Button variant="blue" size="md" className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] font-extrabold text-xs tracking-wider uppercase flex items-center justify-center space-x-1.5">
                        <span>BELI TIKET</span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Direct FAQ Section */}
      <FaqSection />

      {/* Direct Terms & Conditions (S&K) Section */}
      <TermsSection />

      {/* Developer Website Builder Ad Banner by Ferdy Nurdianto */}
      <AdBannerSection />
    </div>
  );
};

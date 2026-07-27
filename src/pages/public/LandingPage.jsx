import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, MapPin, Ticket, ArrowRight, Sparkles } from 'lucide-react';
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
    const matchesSearch = evt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (evt.description && evt.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="space-y-12 pb-16 text-left bg-[#0a0a0a]">
      {/* Buyer Hero Banner */}
      <section className="relative pt-12 pb-16 border-b border-neutral-800 bg-gradient-to-b from-[#141414] via-[#0d0d0d] to-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-6 text-center">
          <Badge variant="green" className="py-1 px-3 text-xs tracking-widest">
            PLATFORM TIKET GIGS &amp; EVENT LOKAL
          </Badge>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter uppercase leading-[0.95] text-white max-w-4xl mx-auto">
            AMBIL TIKET EVENT <br />
            <span className="text-brand-green">INDEPENDEN FAVORITMU</span>
          </h1>

          <p className="text-sm sm:text-base text-neutral-300 font-medium max-w-2xl mx-auto leading-relaxed">
            Langsung amankan tiket gigs, bazar, seminar, &amp; festival lokal. Direct transaksi ke panitia tanpa ribet, tanpa potongan biaya aneh-aneh.
          </p>

          {/* Event Search Input */}
          <div className="max-w-2xl mx-auto pt-2">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-neutral-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari gigs, nama event, atau venue..."
                className="w-full pl-12 pr-4 py-3.5 bg-neutral-900 text-white font-medium text-sm rounded-lg border border-neutral-700 focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green placeholder:text-neutral-500 shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills & Event Directory */}
      <section id="events" className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
        <div className="border-b border-neutral-800 pb-4">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
            GIGS &amp; EVENT PILIHAN
          </h2>
          <p className="text-xs text-neutral-400 font-semibold mt-1">
            Pilih event kesukaanmu terus beli tiketnya direct dari panitia
          </p>
        </div>

        {/* Event Grid */}
        {loading ? (
          <Card variant="dark" className="text-center py-16">
            <p className="font-bold text-sm text-brand-green animate-pulse uppercase">MEMUAT DAFTAR EVENT...</p>
          </Card>
        ) : error ? (
          <Card variant="dark" className="text-center py-16 border-brand-red">
            <p className="font-bold text-sm text-brand-red uppercase">{error}</p>
          </Card>
        ) : filteredEvents.length === 0 ? (
          <Card variant="dark" className="text-center py-16 space-y-3">
            <p className="font-extrabold text-base text-white uppercase">TIDAK ADA EVENT DITEMUKAN</p>
            <p className="text-xs text-neutral-400">Coba ubah kata kunci pencarian Anda.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((evt, index) => (
              <Card key={evt.id} variant="dark" hover className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-neutral-800">
                {/* Left side: Poster Image (Instagram Feed 1:1 Aspect Ratio) */}
                <div className="w-36 sm:w-44 aspect-square bg-neutral-900 rounded-lg overflow-hidden shrink-0 relative border border-neutral-800">
                  {evt.poster_url ? (
                    <img
                      src={evt.poster_url}
                      alt={evt.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-600 font-bold text-xs uppercase">
                      LOKTIK EVENT
                    </div>
                  )}
                  <Badge variant="purple" className="absolute top-2 left-2 text-[9px] px-1.5 py-0">
                    EVENT LOKAL
                  </Badge>
                </div>

                {/* Right side: Numbering, Title, Date, Description */}
                <div className="flex-1 space-y-2 text-left w-full">
                  <div className="flex items-center space-x-2 text-xs font-mono text-neutral-400">
                    <span className="font-black text-brand-green text-sm">{index + 1}.</span>
                    <div className="flex items-center space-x-1.5 text-brand-green font-semibold">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(evt.event_date)}</span>
                    </div>
                  </div>

                  <h3 className="text-lg sm:text-xl font-extrabold uppercase tracking-tight text-white leading-snug">
                    {evt.name}
                  </h3>

                  <p className="text-xs text-neutral-400 font-medium line-clamp-2 leading-relaxed">
                    {evt.description || 'Tidak ada deskripsi acara.'}
                  </p>
                </div>

                {/* Action Button */}
                <div className="w-full md:w-auto shrink-0 pt-2 md:pt-0">
                  <Link to={`/event/${evt.slug}`}>
                    <Button variant="green" size="md" className="w-full md:w-auto px-6 font-bold">
                      BELI TIKET
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Direct FAQ Section */}
      <FaqSection />

      {/* Direct Terms & Conditions (S&K) Section */}
      <TermsSection />

      {/* Custom Ads & Sponsor Section (Build Website by Ferdy & Available Sponsor Slot) */}
      <AdBannerSection />

      {/* Separate EO Call-out Section for Panitia */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
        <div className="p-8 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-brand-purple uppercase">
              <Sparkles className="w-4 h-4 text-brand-purple" />
              <span>UNTUK PANITIA &amp; EVENT ORGANIZER</span>
            </div>
            <h3 className="text-2xl font-black uppercase text-white">INGIN JUAL TIKET EVENT-MU DI LOKTIK?</h3>
            <p className="text-xs text-neutral-400 font-medium max-w-xl">
              0% Potongan biaya tiket. Transfer langsung ke rekening bank atau QRIS panitia tanpa komisi platform.
            </p>
          </div>
          <Link to="/for-eo" className="shrink-0 w-full md:w-auto">
            <Button variant="purple" size="lg" className="w-full md:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 text-sm">
              <span>PELAJARI LAYANAN EO</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

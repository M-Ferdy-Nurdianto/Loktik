import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, MapPin, Ticket, ArrowRight, Sparkles } from 'lucide-react';
import { useActiveEvents } from '../../hooks/useEvents';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatDate, formatRupiah } from '../../utils/formatters';

export const LandingPage = () => {
  const { events, loading, error } = useActiveEvents();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = ['ALL', 'KONSER & MUSIK', 'BAZAR & FESTIVAL', 'SEMINAR & WORKSHOP', 'KOMUNITAS'];

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
            EXPLORE EVENT &amp; TIKET LOKAL
          </Badge>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter uppercase leading-[0.95] text-white max-w-4xl mx-auto">
            TEMUKAN &amp; BELI TIKET <br />
            <span className="text-brand-green">EVENT FAVORITMU</span>
          </h1>

          <p className="text-sm sm:text-base text-neutral-300 font-medium max-w-2xl mx-auto leading-relaxed">
            Platform tiket resmi untuk konser, bazar UMKM, seminar, workshop, hingga acara komunitas. Pesan tiket langsung dari panitia tanpa biaya tambahan.
          </p>

          {/* Event Search Input */}
          <div className="max-w-2xl mx-auto pt-2">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-neutral-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama event, artis, atau lokasi..."
                className="w-full pl-12 pr-4 py-3.5 bg-neutral-900 text-white font-medium text-sm rounded-lg border border-neutral-700 focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green placeholder:text-neutral-500 shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills & Event Directory */}
      <section id="events" className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-800 pb-4 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
              DAFTAR EVENT AKTIF
            </h2>
            <p className="text-xs text-neutral-400 font-semibold mt-1">
              Pilih event dan pesan tiket resmi secara langsung
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                  selectedCategory === cat
                    ? 'bg-brand-green text-black font-black'
                    : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((evt) => (
              <Card key={evt.id} variant="dark" hover className="flex flex-col justify-between space-y-4 p-5">
                <div className="space-y-3">
                  <div className="w-full h-52 bg-neutral-900 rounded-md overflow-hidden relative border border-neutral-800">
                    {evt.poster_url ? (
                      <img
                        src={evt.poster_url}
                        alt={evt.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600 font-bold text-base uppercase">
                        LOKTIK EVENT
                      </div>
                    )}
                    <Badge variant="purple" className="absolute top-3 left-3">
                      EVENT LOKAL
                    </Badge>
                  </div>

                  <h3 className="text-lg font-extrabold uppercase tracking-tight text-white line-clamp-2">
                    {evt.name}
                  </h3>

                  <div className="flex items-center space-x-2 text-xs font-semibold text-brand-green">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>{formatDate(evt.event_date)}</span>
                  </div>

                  <p className="text-xs text-neutral-400 font-medium line-clamp-2">
                    {evt.description}
                  </p>
                </div>

                <Link to={`/event/${evt.slug}`} className="block pt-2">
                  <Button variant="green" fullWidth size="md">
                    BELI TIKET
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </section>

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

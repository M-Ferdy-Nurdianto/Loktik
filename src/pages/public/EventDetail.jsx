import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Plus, Minus } from 'lucide-react';
import { useEventDetail } from '../../hooks/useEvents';
import { useCart } from '../../hooks/useCart';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatDate, formatTime, formatRupiah } from '../../utils/formatters';

export const EventDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { event, loading, error } = useEventDetail(slug);
  const { quantities, updateQuantity, calculateTotal } = useCart();

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Card variant="dark" className="py-12">
          <p className="font-bold text-sm text-brand-green animate-pulse uppercase">MEMUAT DETAIL ACARA...</p>
        </Card>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Card variant="dark" className="py-12 border-brand-red space-y-4">
          <h2 className="text-xl font-black text-brand-red uppercase">ACARA TIDAK DITEMUKAN</h2>
          <p className="text-xs text-neutral-400 font-medium">{error || 'URL Acara salah atau sudah tidak aktif.'}</p>
          <Button variant="white" onClick={() => navigate('/')}>KEMBALI KE BERANDA</Button>
        </Card>
      </div>
    );
  }

  const { totalAmount, totalItems, selectedItems } = calculateTotal(event.ticket_categories || []);

  const handleProceedCheckout = () => {
    if (totalItems === 0) return;
    navigate(`/event/${slug}/checkout`, {
      state: { event, selectedItems, totalAmount, totalItems },
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8 text-left">
      {/* Event Header & Poster */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card variant="dark" className="p-2">
            <div className="w-full h-80 bg-neutral-900 rounded-md overflow-hidden relative border border-neutral-800">
              {event.poster_url ? (
                <img src={event.poster_url} alt={event.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-600 font-extrabold text-xl uppercase">
                  LOKTIK POSTER
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-4">
          <Badge variant="purple">TIKET RESMI PANITIA</Badge>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
            {event.name}
          </h1>

          <div className="flex flex-wrap gap-3 text-xs font-extrabold text-brand-green">
            <div className="flex items-center space-x-2 bg-neutral-900/80 px-3 py-1.5 rounded-md border border-neutral-800">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(event.event_date)}</span>
            </div>
            <div className="flex items-center space-x-2 bg-neutral-900/80 px-3 py-1.5 rounded-md border border-neutral-800">
              <Clock className="w-4 h-4" />
              <span>GATE: {formatTime(event.open_gate)}</span>
            </div>
          </div>

          <Card variant="dark">
            <h3 className="font-extrabold text-xs uppercase text-brand-purple tracking-widest mb-2">DESKRIPSI ACARA</h3>
            <p className="text-sm text-neutral-300 font-medium whitespace-pre-line leading-relaxed">
              {event.description}
            </p>
          </Card>
        </div>
      </div>

      {/* Ticket Categories Tier Selection */}
      <section className="space-y-6 pt-4">
        <div className="border-b border-neutral-800 pb-2">
          <h2 className="text-2xl font-black uppercase text-white tracking-tight">
            PILIH KATEGORI TIKET
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(event.ticket_categories || []).map((tier) => {
            const currentQty = quantities[tier.id] || 0;
            const isUnlimited = tier.quota === null || tier.quota === undefined;
            const isSoldOut = !isUnlimited && tier.quota <= 0;

            return (
              <Card key={tier.id} variant="dark" hover className="flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-extrabold uppercase text-white">{tier.name}</h3>
                    <Badge variant={isSoldOut ? 'red' : isUnlimited ? 'blue' : 'green'}>
                      {isSoldOut ? 'HABIS' : isUnlimited ? 'OPEN PO' : `SISA ${tier.quota}`}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-400 font-medium">{tier.description}</p>
                  <p className="text-xl font-black text-white tracking-tight">
                    {formatRupiah(tier.price)}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
                  <span className="text-xs font-bold uppercase text-neutral-400">JUMLAH TIKET:</span>
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={currentQty === 0 || isSoldOut}
                      onClick={() => updateQuantity(tier.id, -1, tier.quota)}
                      className="w-8 h-8 bg-neutral-800 text-white rounded-md flex items-center justify-center hover:bg-brand-red disabled:opacity-30"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-extrabold text-base text-white">{currentQty}</span>
                    <button
                      disabled={isSoldOut}
                      onClick={() => updateQuantity(tier.id, 1, tier.quota)}
                      className="w-8 h-8 bg-brand-green text-black rounded-md flex items-center justify-center hover:bg-green-400 disabled:opacity-30"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Floating Bottom Cart Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-neutral-800 p-4 z-40">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase text-neutral-400 tracking-wider">TOTAL {totalItems} TIKET SELECTED</p>
              <p className="text-2xl font-black text-brand-green tracking-tight">{formatRupiah(totalAmount)}</p>
            </div>
            <Button variant="green" size="lg" onClick={handleProceedCheckout}>
              LANJUT CHECKOUT ({totalItems})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

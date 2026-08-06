import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Plus, Minus, MapPin, ShieldCheck, ExternalLink, CheckCircle2, QrCode, Share2, Copy, Check } from 'lucide-react';
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

  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Card variant="dark" className="py-12">
          <p className="font-bold text-sm text-brand-blue animate-pulse uppercase">MEMUAT DETAIL ACARA...</p>
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

  const eventUrl = `${window.location.origin}/event/${slug}`;

  // Teks share yang spesifik ke tiket event ini
  const shareTitle = event?.name || 'Event';
  const shareText = `🎟️ *${shareTitle}*\n\nBeli tiket sekarang sebelum habis!\n📅 ${event?.event_date ? new Date(event.event_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}\n\n👉 Link tiket:`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = eventUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setShowShareMenu(false);
  };

  const handleShareIG = () => {
    // Instagram tidak punya deep link share URL, copy link tiket dulu baru buka IG
    navigator.clipboard.writeText(`${shareText}\n${eventUrl}`).catch(() => {});
    setShowShareMenu(false);
    // Beri jeda singkat supaya clipboard ter-set sebelum tab baru terbuka
    setTimeout(() => window.open('https://www.instagram.com/', '_blank'), 150);
  };

  const handleShareWA = () => {
    const fullText = encodeURIComponent(`${shareText}\n${eventUrl}`);
    window.open(`https://wa.me/?text=${fullText}`, '_blank');
    setShowShareMenu(false);
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`🎟️ ${shareTitle} — beli tiket sekarang!\n${eventUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    setShowShareMenu(false);
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: `🎟️ Beli tiket ${shareTitle} — sebelum habis!`,
        url: eventUrl,
      });
    } else {
      setShowShareMenu((v) => !v);
    }
  };

  const handleProceedCheckout = () => {
    if (totalItems === 0) return;
    const checkoutData = { event, selectedItems, items: selectedItems, totalAmount, totalItems };
    try {
      sessionStorage.setItem('loktik_active_checkout', JSON.stringify(checkoutData));
    } catch (e) {}
    navigate(`/event/${slug}/checkout`, { state: checkoutData });
  };

  const mapsQueryUrl = event.location
    ? event.location.startsWith('http')
      ? event.location
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 text-left pb-28 sm:pb-16 font-sans">
      
      {/* 1. Header Section: Title & Metadata (Full Width) */}
      <div className="border-b border-neutral-800 pb-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight">
            {event.name}
          </h1>

          {/* Share Button */}
          <div className="relative shrink-0">
            <button
              onClick={handleNativeShare}
              className="flex items-center gap-1.5 px-3 py-2 bg-brand-blue/10 border border-brand-blue/50 hover:bg-brand-blue hover:text-black text-brand-blue rounded-lg text-xs font-black uppercase transition-all duration-150 shadow-[0_0_12px_rgba(6,182,212,0.2)] hover:shadow-[0_0_18px_rgba(6,182,212,0.45)]"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>SHARE TIKET</span>
            </button>

            {/* Dropdown share menu (fallback jika native share tidak tersedia) */}
            {showShareMenu && (
              <>
                {/* overlay transparan untuk tutup menu klik di luar */}
                <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />
                <div className="absolute right-0 top-full mt-1.5 z-50 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden w-52">
                  <div className="px-4 py-2 border-b border-neutral-800">
                    <p className="text-[9px] font-black uppercase text-neutral-500 tracking-widest">BAGIKAN TIKET EVENT INI</p>
                  </div>
                  <button
                    onClick={handleShareIG}
                    className="flex items-center gap-3 w-full px-4 py-3 text-xs font-bold text-white hover:bg-neutral-800 transition-colors border-b border-neutral-800/60"
                  >
                    <span className="text-lg leading-none">📸</span>
                    <div className="text-left">
                      <p className="font-black">Instagram</p>
                      <p className="text-[10px] text-neutral-500 font-medium">Salin teks + buka IG</p>
                    </div>
                  </button>
                  <button
                    onClick={handleShareWA}
                    className="flex items-center gap-3 w-full px-4 py-3 text-xs font-bold text-white hover:bg-neutral-800 transition-colors border-b border-neutral-800/60"
                  >
                    <span className="text-lg leading-none">💬</span>
                    <div className="text-left">
                      <p className="font-black">WhatsApp</p>
                      <p className="text-[10px] text-neutral-500 font-medium">Kirim ke kontak / grup</p>
                    </div>
                  </button>
                  <button
                    onClick={handleShareTwitter}
                    className="flex items-center gap-3 w-full px-4 py-3 text-xs font-bold text-white hover:bg-neutral-800 transition-colors border-b border-neutral-800/60"
                  >
                    <span className="text-lg leading-none">🐦</span>
                    <div className="text-left">
                      <p className="font-black">Twitter / X</p>
                      <p className="text-[10px] text-neutral-500 font-medium">Post tweet tiket</p>
                    </div>
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-3 w-full px-4 py-3 text-xs font-bold text-white hover:bg-neutral-800 transition-colors"
                  >
                    {copied
                      ? <Check className="w-4 h-4 text-brand-green shrink-0" />
                      : <Copy className="w-4 h-4 shrink-0" />}
                    <div className="text-left">
                      <p className={`font-black ${copied ? 'text-brand-green' : ''}`}>
                        {copied ? 'Link Tersalin!' : 'Salin Link Tiket'}
                      </p>
                      <p className="text-[10px] text-neutral-500 font-medium">Copy URL halaman ini</p>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-y-2.5 gap-x-5 text-xs font-mono uppercase text-neutral-400 font-bold">
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-4 h-4 text-brand-blue" />
            <span className="text-white">{formatDate(event.event_date)}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-brand-blue" />
            <span className="text-white">GATE: {formatTime(event.open_gate)}</span>
          </div>
          {mapsQueryUrl && (
            <a
              href={mapsQueryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 text-brand-blue hover:text-white transition-colors"
              title={event.location}
            >
              <MapPin className="w-4 h-4" />
              <span className="text-brand-blue">LIHAT LOKASI</span>
            </a>
          )}
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Left Column: Poster & Organizer Badge */}
        <div className="md:col-span-1 space-y-4">
          <Card variant="dark" className="p-2 shadow-2xl border-neutral-800/80">
            <div className="w-full aspect-[4/5] bg-neutral-900 rounded-lg overflow-hidden relative border border-neutral-800/90">
              {event.poster_url ? (
                <img src={event.poster_url} alt={event.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-600 font-extrabold text-lg sm:text-xl uppercase">
                  LOKTIK POSTER
                </div>
              )}
            </div>
          </Card>

          {/* Verified Organizer Badge */}
          <Card variant="dark" className="p-3.5 border-neutral-800/80 bg-neutral-900/60 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-brand-blue/20 border border-brand-blue/40 flex items-center justify-center text-brand-blue shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black uppercase text-white truncate">PANITIA VERIFIED</h4>
                <p className="text-[10px] text-neutral-400 font-medium truncate">0% Komisi • Direct Transfer</p>
              </div>
            </div>
            <Badge variant="blue" className="text-[8px] px-1.5 py-0 font-extrabold shrink-0">DIRECT</Badge>
          </Card>
        </div>

        {/* Right Column: Description & Ticket Tiers */}
        <div className="md:col-span-2 space-y-6 sm:space-y-8">
          
          {/* Description Card */}
          <Card variant="dark" className="p-4 sm:p-5 border-neutral-800/85">
            <h3 className="font-extrabold text-xs uppercase text-brand-blue tracking-widest mb-2 border-b border-neutral-800 pb-1.5">DESKRIPSI ACARA</h3>
            <p className="text-xs sm:text-sm text-neutral-300 font-medium whitespace-pre-line leading-relaxed">
              {event.description || 'Tidak ada deskripsi rinci dari panitia.'}
            </p>
          </Card>

          {/* Ticket Categories Selection */}
          <section className="space-y-4">
            <div className="border-b border-neutral-800 pb-2 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-black uppercase text-white tracking-tight">
                PILIH KATEGORI TIKET
              </h2>
              <span className="text-[10px] font-mono text-brand-blue font-bold uppercase tracking-wider">DIRECT TRANSAKSI</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(event.ticket_categories || []).map((tier) => {
                const currentQty = quantities[tier.id] || 0;
                const isUnlimited = tier.quota === null || tier.quota === undefined;
                const isExpired = tier.end_po && new Date(tier.end_po) < new Date();
                const isSoldOut = !isUnlimited && tier.quota <= 0;
                const isDisabled = isSoldOut || isExpired;

                return (
                  <Card key={tier.id} variant="dark" hover className="flex flex-col justify-between space-y-4 p-4 sm:p-5 border border-neutral-800 hover:border-brand-blue/60 transition-colors">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-sm sm:text-base font-extrabold uppercase text-white leading-tight">{tier.name}</h3>
                        <Badge variant={isExpired ? 'red' : (isSoldOut ? 'red' : 'blue')} className="shrink-0 text-[9px] font-extrabold">
                          {isExpired ? 'EXPIRED' : (isSoldOut ? 'HABIS' : isUnlimited ? 'OPEN PO' : `SISA ${tier.quota}`)}
                        </Badge>
                      </div>
                      {tier.description && (
                        <p className="text-[11px] text-neutral-400 font-medium leading-normal">{tier.description}</p>
                      )}
                      <p className="text-base sm:text-xl font-black text-brand-blue tracking-tight font-mono">
                        {formatRupiah(tier.price)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
                      <span className="text-[10px] font-bold uppercase text-neutral-400">JUMLAH TIKET:</span>
                      <div className="flex items-center space-x-2.5">
                        <button
                          disabled={currentQty === 0 || isDisabled}
                          onClick={() => updateQuantity(tier.id, -1, tier.quota)}
                          className="w-8 h-8 bg-neutral-800 text-white rounded-lg flex items-center justify-center hover:bg-brand-red disabled:opacity-30 active:scale-95 transition-transform touch-press"
                          aria-label="Kurangi tiket"
                        >
                          <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                        <span className="w-6 text-center font-extrabold text-base text-white">{currentQty}</span>
                        <button
                          disabled={isDisabled}
                          onClick={() => updateQuantity(tier.id, 1, tier.quota)}
                          className="w-8 h-8 bg-brand-blue text-black rounded-lg flex items-center justify-center hover:bg-[#009fb9] disabled:opacity-30 active:scale-95 transition-transform touch-press"
                          aria-label="Tambah tiket"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Floating Mobile Bottom Cart Bar */}
      {totalItems > 0 && (
        <div className="mobile-sticky-bar">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] sm:text-[10px] font-extrabold uppercase text-neutral-400 tracking-wider">TOTAL {totalItems} TIKET</p>
              <p className="text-xl sm:text-2xl font-black text-brand-blue tracking-tight leading-tight font-mono">{formatRupiah(totalAmount)}</p>
            </div>
            <Button variant="blue" size="lg" onClick={handleProceedCheckout} className="min-h-[46px] px-5 text-xs sm:text-sm font-black tracking-wider uppercase touch-press">
              LANJUT CHECKOUT ({totalItems})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

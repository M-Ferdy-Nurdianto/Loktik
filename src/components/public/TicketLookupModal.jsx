import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, Ticket, CheckCircle2, AlertCircle, Edit3, X, Key, RefreshCw, Lock, Clock, Download } from 'lucide-react';
import { searchOrdersByBuyer, updateOrderWaNumber } from '../../services/apiOrders';
import { generatePrettyRedeemCode, formatRupiah } from '../../utils/formatters';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../services/supabase';
import html2canvas from 'html2canvas';
import { TicketGraphic } from '../dashboard/TicketGraphic';

export const TicketLookupModal = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [editingWaId, setEditingWaId] = useState(null);
  const [newWa, setNewWa] = useState('');
  const [updatingWa, setUpdatingWa] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [lazyTicket, setLazyTicket] = useState(null); // untuk lazy migration render

  const ticketRef   = useRef(null);
  const abortRef    = useRef(null);   // AbortController untuk batalkan request sebelumnya
  const lastQueryRef = useRef('');    // keyword request terakhir yang dikirim

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();

    if (!trimmed || trimmed.length < 2) {
      showToast('Masukkan minimal 2 karakter Kode Tiket', 'buyer');
      return;
    }

    // Skip jika keyword tidak berubah dan sudah ada hasil
    if (trimmed === lastQueryRef.current && results !== null) return;

    // Batalkan request sebelumnya
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    lastQueryRef.current = trimmed;

    try {
      setLoading(true);
      const data = await searchOrdersByBuyer(trimmed, controller.signal);
      if (controller.signal.aborted) return;
      setResults(data);
      if (data && data.length === 0) {
        showToast('Kode tiket tidak ditemukan. Pastikan kode sudah benar.', 'buyer');
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      showToast('Gagal mencari tiket. Coba beberapa saat lagi.', 'buyer');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  const handleSaveWa = async (orderId) => {
    if (!newWa || newWa.length < 10) {
      showToast('Nomor WhatsApp minimal 10 digit.', 'buyer');
      return;
    }
    try {
      setUpdatingWa(true);
      await updateOrderWaNumber(orderId, newWa);
      showToast('Nomor WA berhasil diperbarui! Silakan cari ulang tiket Anda.', 'buyer');
      setEditingWaId(null);
      setNewWa('');
      handleSearch();
    } catch (err) {
      showToast(err.message || 'Gagal memperbarui nomor WA.', 'buyer');
    } finally {
      setUpdatingWa(false);
    }
  };

  /**
   * Lazy migration: generate tiket lama (belum punya ticket_image_url) dengan
   * Template 2 (TicketGraphic + html2canvas), upload ke storage, simpan URL ke DB.
   */
  const generateAndUploadTicket = (order, prettyCode) => {
    return new Promise((resolve, reject) => {
      const eventName = order.events?.name || 'Event LokTik';
      const isPaid = order.status === 'paid';

      setLazyTicket({ eventName, guestName: order.guest_name, ticketCode: prettyCode, isPaid });

      setTimeout(async () => {
        try {
          const element = ticketRef.current;
          if (!element) throw new Error('Elemen tiket tidak ditemukan.');

          const canvas = await html2canvas(element, {
            useCORS: true,
            scale: 2,
            backgroundColor: '#0a0a0a',
            logging: false,
          });

          canvas.toBlob(async (blob) => {
            if (!blob) {
              setLazyTicket(null);
              reject(new Error('Gagal konversi tiket ke gambar.'));
              return;
            }
            try {
              const fileName = `${prettyCode}-${Date.now()}.png`;
              const { error: uploadError } = await supabase.storage
                .from('tickets')
                .upload(fileName, blob, { contentType: 'image/png', cacheControl: '3600', upsert: false });

              if (uploadError) throw new Error(`Upload gagal: ${uploadError.message}`);

              const { data } = supabase.storage.from('tickets').getPublicUrl(fileName);
              const publicUrl = data.publicUrl;

              // Simpan URL ke DB (lazy migration)
              if (order.ticket_id) {
                await supabase
                  .from('tickets')
                  .update({ ticket_image_url: publicUrl })
                  .eq('id', order.ticket_id);
              }

              setLazyTicket(null);
              resolve(publicUrl);
            } catch (err) {
              setLazyTicket(null);
              reject(err);
            }
          }, 'image/png');
        } catch (err) {
          setLazyTicket(null);
          reject(err);
        }
      }, 300);
    });
  };

  /**
   * Download tiket: fetch URL tersimpan (dari storage), atau lazy-generate jika belum ada.
   * TIDAK ada canvas inline Template 1 — hanya pakai Template 2 (TicketGraphic).
   */
  const handleDownloadTicket = async (order, prettyCode) => {
    setDownloadingId(order.id);
    try {
      let imageUrl = order.ticket_image_url;

      // Jika belum ada URL (tiket lama) → lazy migration generate + upload sekali
      if (!imageUrl) {
        showToast('Menyiapkan e-tiket... harap tunggu sebentar.', 'buyer');
        imageUrl = await generateAndUploadTicket(order, prettyCode);
        // Update local results agar tidak generate ulang di klik berikutnya
        setResults((prev) =>
          prev
            ? prev.map((o) => (o.id === order.id ? { ...o, ticket_image_url: imageUrl } : o))
            : prev
        );
      }

      // Download file dari storage URL
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Gagal mengambil file gambar tiket.');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `E-TICKET_${prettyCode}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      showToast(`E-Tiket ${prettyCode} berhasil diunduh!`, 'buyer');
    } catch (err) {
      showToast('Gagal mengunduh tiket. Coba lagi.', 'buyer');
      console.error(err);
    } finally {
      setDownloadingId(null);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      {/* Hidden TicketGraphic untuk lazy migration (off-screen render) */}
      {lazyTicket && (
        <TicketGraphic
          ref={ticketRef}
          eventName={lazyTicket.eventName}
          guestName={lazyTicket.guestName}
          ticketCode={lazyTicket.ticketCode}
          isPaid={lazyTicket.isPaid}
        />
      )}

      <Card variant="blue" className="w-full max-w-2xl max-h-[90vh] p-4 sm:p-6 bg-[#121212] border border-brand-blue/50 rounded-2xl flex flex-col justify-between text-left shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-neutral-800 pb-3 shrink-0 mb-3">
          <div className="flex items-center space-x-2">
            <Ticket className="w-5 h-5 text-brand-blue shrink-0" />
            <h3 className="text-sm sm:text-base font-black uppercase text-white tracking-wider">
              CARI &amp; CEK E-TIKET SAYA
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input — hanya by Kode Tiket (UID) */}
        <form onSubmit={handleSearch} className="flex gap-2 shrink-0 mb-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-brand-blue absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="Masukkan kode tiket kamu, contoh: IS7140"
              className="w-full pl-9 pr-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:border-brand-blue outline-none font-mono placeholder:text-neutral-500 uppercase tracking-widest"
            />
          </div>
          <Button type="submit" variant="blue" size="md" disabled={loading} className="text-xs font-black uppercase shrink-0 py-2.5">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'CARI TIKET'}
          </Button>
        </form>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1">
          {results === null ? (
            <div className="p-8 text-center bg-neutral-950/60 rounded-xl border border-neutral-800/80 space-y-2">
              <Ticket className="w-10 h-10 text-brand-blue/50 mx-auto" />
              <p className="text-xs font-bold text-neutral-300 uppercase">PENCARIAN E-TIKET</p>
              <p className="text-[11px] text-neutral-400 max-w-md mx-auto leading-relaxed">
                Ketik <span className="text-brand-blue font-bold">Kode Tiket</span> (contoh:{' '}
                <span className="font-mono text-white">IS7140</span>) yang tertera di e-tiket yang sudah dikirimkan panitia ke WA kamu.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center bg-neutral-950/60 rounded-xl border border-neutral-800/80 space-y-2">
              <AlertCircle className="w-10 h-10 text-brand-yellow/60 mx-auto" />
              <p className="text-xs font-black text-white uppercase">TIKET TIDAK DITEMUKAN</p>
              <p className="text-[11px] text-neutral-400">
                Pastikan kode tiket yang dicari sudah benar. Kode tiket tersedia di pesan WA yang dikirim panitia saat verifikasi pembayaran.
              </p>
            </div>
          ) : (
            results.map((ord) => {
              const eventName = ord.events?.name || 'Event LokTik';
              const seed = parseInt(ord.id.replace(/[^0-9]/g, '').substring(0, 4) || '1312');
              const prettyCode = generatePrettyRedeemCode(eventName, seed);
              const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${prettyCode}`;
              const isScanned = ord.is_scanned || false;
              const isPaid = ord.status === 'paid';
              const isPending = ord.status === 'pending';
              const isEditingWa = editingWaId === ord.id;
              const isDownloading = downloadingId === ord.id;

              return (
                <div key={ord.id} className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3 text-left">
                  <div className="flex justify-between items-start border-b border-neutral-800/80 pb-2">
                    <div>
                      <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold block">{eventName}</span>
                      <h4 className="text-sm font-black text-white uppercase">{ord.guest_name}</h4>
                    </div>
                    <Badge
                      variant={isScanned ? 'red' : isPaid ? 'green' : ord.status === 'need_reupload' ? 'red' : 'yellow'}
                      className="text-[10px]"
                    >
                      {isScanned ? 'SUDAH SCAN (HANGUS)' : isPaid ? 'AKTIF (LUNAS)' : ord.status === 'need_reupload' ? 'RE-UPLOAD BUKTI' : 'PENDING VERIFIKASI'}
                    </Badge>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* QR Code Box */}
                    {isScanned ? (
                      <div className="w-28 h-28 bg-red-950/40 p-2 rounded-lg border border-brand-red/60 shrink-0 flex flex-col items-center justify-center text-center space-y-1">
                        <CheckCircle2 className="w-7 h-7 text-brand-red shrink-0" />
                        <span className="text-[9px] font-black text-brand-red uppercase leading-tight">SUDAH SCAN</span>
                        <span className="text-[8px] text-neutral-400 leading-none">TIKET FISIK TERAMBIL</span>
                      </div>
                    ) : isPaid ? (
                      <div className="w-28 h-28 bg-white p-1 rounded-lg border border-neutral-700 shrink-0 shadow-md flex items-center justify-center">
                        <img src={qrImageUrl} alt="QR Tiket" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-28 h-28 bg-neutral-900/90 p-2 rounded-lg border border-brand-yellow/40 shrink-0 flex flex-col items-center justify-center text-center space-y-1">
                        <Lock className="w-6 h-6 text-brand-yellow shrink-0 animate-pulse" />
                        <span className="text-[9px] font-bold text-brand-yellow uppercase leading-tight">QR DIKUNCI</span>
                        <span className="text-[8px] text-neutral-400 leading-none">MENUNGGU ACC PANITIA</span>
                      </div>
                    )}

                    {/* Details & Actions */}
                    <div className="flex-1 text-xs space-y-2 w-full">
                      {/* Kode tiket + Download */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-neutral-400 font-bold text-[11px]">KODE TIKET:</span>
                          <span className="font-mono font-black text-brand-blue text-sm bg-neutral-900 px-2 py-0.5 rounded border border-brand-blue/30 flex items-center gap-1">
                            <Key className="w-3.5 h-3.5 text-brand-blue" /> {prettyCode}
                          </span>
                        </div>

                        {isPaid && !isScanned && (
                          <Button
                            type="button"
                            variant="blue"
                            size="md"
                            onClick={() => handleDownloadTicket(ord, prettyCode)}
                            disabled={isDownloading}
                            className="text-xs font-black uppercase py-2 px-4 flex items-center gap-1.5 w-full sm:w-auto justify-center"
                          >
                            {isDownloading ? (
                              <><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Menyiapkan...</span></>
                            ) : (
                              <><Download className="w-3.5 h-3.5" /><span>Download Tiket</span></>
                            )}
                          </Button>
                        )}
                      </div>

                      <div className="text-neutral-300 font-mono text-[11px]">
                        TOTAL BAYAR: <strong className="text-brand-green">{formatRupiah(ord.total_price)}</strong>
                      </div>

                      {isScanned ? (
                        <div className="p-2.5 bg-red-950/40 border border-brand-red/50 rounded-lg text-[11px] text-brand-red font-bold leading-tight flex items-start space-x-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-brand-red mt-0.5" />
                          <span>Tiket ini telah di-scan di pintu masuk venue dan tiket fisik diserahkan. QR Code sudah hangus.</span>
                        </div>
                      ) : isPending ? (
                        <div className="p-2.5 bg-brand-yellow/10 border border-brand-yellow/30 rounded-lg text-[11px] text-brand-yellow font-bold leading-tight flex items-start space-x-2">
                          <Clock className="w-4 h-4 shrink-0 text-brand-yellow mt-0.5" />
                          <span>Pembayaran Anda sedang dalam antrean verifikasi panitia. Harap tunggu beberapa saat lagi lalu lakukan cek ulang.</span>
                        </div>
                      ) : null}

                      {/* WA Number Info + Edit */}
                      <div className="pt-1.5 border-t border-neutral-800/60">
                        {isEditingWa ? (
                          <div className="flex gap-2 items-center pt-1">
                            <input
                              type="tel"
                              value={newWa}
                              onChange={(e) => setNewWa(e.target.value.replace(/[^0-9]/g, ''))}
                              placeholder="Masukkan No. WA Benar..."
                              className="flex-1 px-2.5 py-1 bg-neutral-900 border border-brand-blue rounded text-xs text-white font-mono"
                            />
                            <Button type="button" variant="blue" size="sm" disabled={updatingWa} onClick={() => handleSaveWa(ord.id)} className="text-[10px] py-1 px-2.5">
                              SIMPAN
                            </Button>
                            <button onClick={() => setEditingWaId(null)} className="text-[10px] text-neutral-400 hover:text-white underline">BATAL</button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-[11px] text-neutral-400">
                            <span className="font-mono">WA: <strong className="text-white">{ord.guest_wa}</strong></span>
                            <button
                              type="button"
                              onClick={() => { setEditingWaId(ord.id); setNewWa(ord.guest_wa); }}
                              className="text-brand-blue hover:underline font-bold text-[10px] flex items-center space-x-1"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>SALAH WA? UBAH</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-800 shrink-0 text-center">
          <p className="text-[10px] text-neutral-500 font-medium">
            Tunjukkan gambar QR Code atau Kode Tiket kepada staf gate venue saat penukaran tiket fisik.
          </p>
        </div>
      </Card>
    </div>,
    document.body
  );
};

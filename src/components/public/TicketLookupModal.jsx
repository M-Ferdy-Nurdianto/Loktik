import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, Ticket, CheckCircle2, AlertCircle, Edit3, Smartphone, X, Key, RefreshCw, Lock, Clock, Download } from 'lucide-react';
import { searchOrdersByBuyer, updateOrderWaNumber } from '../../services/apiOrders';
import { generatePrettyRedeemCode, formatRupiah, formatDate } from '../../utils/formatters';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../../context/ToastContext';

export const TicketLookupModal = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [editingWaId, setEditingWaId] = useState(null);
  const [newWa, setNewWa] = useState('');
  const [updatingWa, setUpdatingWa] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query || query.trim().length < 2) {
      showToast('Ketik minimal 2 karakter (Kode ID, WA, atau Nama)', 'buyer');
      return;
    }

    try {
      setLoading(true);
      const data = await searchOrdersByBuyer(query);
      setResults(data);
    } catch (err) {
      showToast('Gagal mencari tiket. Coba beberapa saat lagi.', 'buyer');
    } finally {
      setLoading(false);
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

  const handleDownloadQr = async (prettyCode, qrImageUrl, guestName, eventName, totalPrice) => {
    try {
      // Muat QR image dulu
      const qrImg = await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = qrImageUrl;
      });

      // Buat canvas tiket lengkap (sama persis dengan info yang dikirim via WA)
      const W = 600;
      const H = 780;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');

      // Background
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, W, H);

      // Border card
      ctx.strokeStyle = '#7c3aed';
      ctx.lineWidth = 3;
      ctx.strokeRect(12, 12, W - 24, H - 24);

      // Header bar
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(12, 12, W - 24, 56);

      // Logo teks kiri
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('LOKTIK', 30, 50);

      // Label kanan
      ctx.fillStyle = '#d8b4fe';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('E-TICKET', W - 30, 50);
      ctx.textAlign = 'left';

      // Nama event
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      const eventLines = wrapText(ctx, eventName.toUpperCase(), W - 60, 30);
      let y = 105;
      eventLines.forEach((line) => {
        ctx.fillText(line, 30, y);
        y += 34;
      });

      // Divider
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, y + 10);
      ctx.lineTo(W - 30, y + 10);
      ctx.stroke();
      y += 30;

      // Nama pembeli
      ctx.fillStyle = '#9ca3af';
      ctx.font = '13px sans-serif';
      ctx.fillText('NAMA PEMBELI', 30, y);
      y += 22;
      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(guestName.toUpperCase(), 30, y);
      y += 36;

      // Total bayar
      ctx.fillStyle = '#9ca3af';
      ctx.font = '13px sans-serif';
      ctx.fillText('TOTAL BAYAR', 30, y);
      y += 22;
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`Rp ${Number(totalPrice).toLocaleString('id-ID')}`, 30, y);
      y += 36;

      // Status
      ctx.fillStyle = '#9ca3af';
      ctx.font = '13px sans-serif';
      ctx.fillText('STATUS', 30, y);
      y += 22;
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 15px monospace';
      ctx.fillText('LUNAS — AKTIF', 30, y);
      y += 36;

      // QR Code (center)
      const qrSize = 200;
      const qrX = (W - qrSize) / 2;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrX - 8, y - 8, qrSize + 16, qrSize + 16);
      ctx.drawImage(qrImg, qrX, y, qrSize, qrSize);
      y += qrSize + 24;

      // Kode tiket
      ctx.fillStyle = '#c4b5fd';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(prettyCode, W / 2, y);
      ctx.textAlign = 'left';
      y += 26;

      // Instruksi kecil
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Tunjukkan QR ini ke staf gate saat penukaran tiket fisik', W / 2, y);
      y += 20;
      ctx.fillStyle = '#374151';
      ctx.font = '11px monospace';
      ctx.fillText('loktik.vercel.app', W / 2, y);
      ctx.textAlign = 'left';

      // Download
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `E-TICKET_${prettyCode}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(`E-Tiket ${prettyCode} berhasil diunduh!`, 'buyer');
    } catch (err) {
      showToast('Gagal mengunduh tiket.', 'buyer');
    }
  };

  // Helper: wrap teks panjang di canvas
  const wrapText = (ctx, text, maxWidth, fontSize) => {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden">
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

        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="flex gap-2 shrink-0 mb-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-brand-blue absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Masukkan Kode ID Pesanan (misal: GM1972) atau Nomor WA..."
              className="w-full pl-9 pr-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:border-brand-blue outline-none font-medium placeholder:text-neutral-500"
            />
          </div>
          <Button type="submit" variant="blue" size="md" disabled={loading} className="text-xs font-black uppercase shrink-0 py-2.5">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'CARI TIKET'}
          </Button>
        </form>

        {/* Search Results Container */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1">
          {results === null ? (
            <div className="p-8 text-center bg-neutral-950/60 rounded-xl border border-neutral-800/80 space-y-2">
              <Ticket className="w-10 h-10 text-brand-blue/50 mx-auto" />
              <p className="text-xs font-bold text-neutral-300 uppercase">PENCARIAN E-TIKET AMAN &amp; PRIVASI</p>
              <p className="text-[11px] text-neutral-400 max-w-md mx-auto leading-relaxed">
                Ketik <span className="text-brand-blue font-bold">Kode ID Pesanan</span> (contoh: <span className="font-mono text-white">GM1972</span>) atau <span className="text-brand-blue font-bold">Nomor WhatsApp</span> Anda untuk menampilkan QR Code e-ticket &amp; status persetujuan panitia.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center bg-neutral-950/60 rounded-xl border border-neutral-800/80 space-y-2">
              <AlertCircle className="w-10 h-10 text-brand-yellow/60 mx-auto" />
              <p className="text-xs font-black text-white uppercase">TIKET TIDAK DITEMUKAN</p>
              <p className="text-[11px] text-neutral-400">
                Pastikan nama atau nomor WA yang dicari sesuai dengan yang diisi saat checkout pesanan.
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

              return (
                <div key={ord.id} className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3 text-left">
                  <div className="flex justify-between items-start border-b border-neutral-800/80 pb-2">
                    <div>
                      <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold block">{eventName}</span>
                      <h4 className="text-sm font-black text-white uppercase">{ord.guest_name}</h4>
                    </div>
                    <Badge variant={isScanned ? 'red' : isPaid ? 'green' : ord.status === 'need_reupload' ? 'red' : 'yellow'} className="text-[10px]">
                      {isScanned ? 'SUDAH SCAN (HANGUS)' : isPaid ? 'AKTIF (LUNAS)' : ord.status === 'need_reupload' ? 'RE-UPLOAD BUKTI' : 'PENDING VERIFIKASI'}
                    </Badge>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* QR Code or Locked/Scanned Indicator Box */}
                    {isScanned ? (
                      <div className="w-28 h-28 bg-red-950/40 p-2 rounded-lg border border-brand-red/60 shrink-0 flex flex-col items-center justify-center text-center space-y-1">
                        <CheckCircle2 className="w-7 h-7 text-brand-red shrink-0" />
                        <span className="text-[9px] font-black text-brand-red uppercase leading-tight">
                          SUDAH SCAN
                        </span>
                        <span className="text-[8px] text-neutral-400 leading-none">
                          TIKET FISIK TERAMBIL
                        </span>
                      </div>
                    ) : isPaid ? (
                      <div className="w-28 h-28 bg-white p-1 rounded-lg border border-neutral-700 shrink-0 shadow-md flex items-center justify-center">
                        <img src={qrImageUrl} alt="QR Tiket" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-28 h-28 bg-neutral-900/90 p-2 rounded-lg border border-brand-yellow/40 shrink-0 flex flex-col items-center justify-center text-center space-y-1">
                        <Lock className="w-6 h-6 text-brand-yellow shrink-0 animate-pulse" />
                        <span className="text-[9px] font-bold text-brand-yellow uppercase leading-tight">
                          QR DIKUNCI
                        </span>
                        <span className="text-[8px] text-neutral-400 leading-none">
                          MENUNGGU ACC PANITIA
                        </span>
                      </div>
                    )}

                    {/* Details & Actions */}
                    <div className="flex-1 text-xs space-y-2 w-full">
                      {/* Kode tiket + Download button */}
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
                            onClick={() => handleDownloadQr(prettyCode, qrImageUrl, ord.guest_name, eventName, ord.total_price)}
                            className="text-xs font-black uppercase py-2 px-4 flex items-center gap-1.5 w-full sm:w-auto justify-center"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Tiket</span>
                          </Button>
                        )}
                      </div>

                      <div className="text-neutral-300 font-mono text-[11px]">
                        TOTAL BAYAR: <strong className="text-brand-green">{formatRupiah(ord.total_price)}</strong>
                      </div>

                      {/* Scanned / Pending Notice Box */}
                      {isScanned ? (
                        <div className="p-2.5 bg-red-950/40 border border-brand-red/50 rounded-lg text-[11px] text-brand-red font-bold leading-tight flex items-start space-x-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-brand-red mt-0.5" />
                          <span>
                            Tiket ini telah di-scan di pintu masuk venue dan tiket fisik diserahkan. QR Code sudah hangus.
                          </span>
                        </div>
                      ) : isPending ? (
                        <div className="p-2.5 bg-brand-yellow/10 border border-brand-yellow/30 rounded-lg text-[11px] text-brand-yellow font-bold leading-tight flex items-start space-x-2">
                          <Clock className="w-4 h-4 shrink-0 text-brand-yellow mt-0.5" />
                          <span>
                            Pembayaran Anda sedang dalam antrean verifikasi panitia. Harap tunggu beberapa saat lagi lalu lakukan cek ulang.
                          </span>
                        </div>
                      ) : null}

                      {/* WA Number Info + Edit Action */}
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
                            <Button
                              type="button"
                              variant="blue"
                              size="sm"
                              disabled={updatingWa}
                              onClick={() => handleSaveWa(ord.id)}
                              className="text-[10px] py-1 px-2.5"
                            >
                              SIMPAN
                            </Button>
                            <button onClick={() => setEditingWaId(null)} className="text-[10px] text-neutral-400 hover:text-white underline">
                              BATAL
                            </button>
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
            💡 Tunjukkan gambar QR Code / Kode Tiket di atas kepada staf gate venue saat penukaran tiket fisik.
          </p>
        </div>
      </Card>
    </div>,
    document.body
  );
};

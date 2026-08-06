import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Copy, Download, AlertTriangle, Lock, Unlock, Frown } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { TicketGraphic } from '../../components/dashboard/TicketGraphic';
import { formatRupiah, generatePrettyRedeemCode } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

const STORAGE_KEY = 'savedTicketId';
const DRAFT_KEY = 'loktik_last_order_success';

export const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [checkoutData, setCheckoutData] = useState(null);
  const [hasSavedTicket, setHasSavedTicket] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const ticketRef = useRef(null);

  useEffect(() => {
    const state = location.state || {};
    const data = {
      event: state.event || null,
      order: state.order || null,
      items: state.items || [],
      totalAmount: state.totalAmount,
      guestName: state.guestName || '',
    };

    if (data.order && data.event) {
      try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      } catch (e) {}
      setCheckoutData(data);
      return;
    }

    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.order && parsed?.event) {
          setCheckoutData(parsed);
          return;
        }
      }
    } catch (e) {}
    setCheckoutData(null);
  }, [location]);

  const orderId = checkoutData?.order?.id || '';
  const eventName = checkoutData?.event?.name || 'Event LokTik';
  const seed = parseInt(String(orderId).replace(/[^0-9]/g, '').substring(0, 4) || '1312');
  const prettyCode = generatePrettyRedeemCode(eventName, seed);
  const totalAmount = checkoutData?.totalAmount ?? checkoutData?.order?.total_price;

  useEffect(() => {
    if (!orderId) return;
    try {
      localStorage.setItem(STORAGE_KEY, prettyCode);
    } catch (e) {}
  }, [orderId, prettyCode]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasSavedTicket) return;
      e.preventDefault();
      e.returnValue = 'Kode ID Pesanan Anda belum disimpan. Yakin ingin meninggalkan halaman ini?';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasSavedTicket]);

  const unlockNavigation = () => {
    if (!hasSavedTicket) {
      setHasSavedTicket(true);
      showToast('KODE ID PESANAN TERSIMPAN! ANDA BISA KEMBALI KE BERANDA.', 'buyer');
    }
  };

  const handleCopyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(prettyCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      unlockNavigation();
      showToast(`KODE ID ${prettyCode} BERHASIL DISALIN!`, 'buyer');
    } catch (err) {
      showToast('Gagal menyalin kode. Silakan salin manual dari layar.', 'buyer');
    }
  };

  const handleDownloadStruk = async () => {
    const element = ticketRef.current;
    if (!element || isDownloading) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#0a0a0a',
        logging: false,
      });
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Konversi gambar gagal.');
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Struk-Pesanan-${prettyCode}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      unlockNavigation();
      showToast(`STRUK PESANAN (${prettyCode}) BERHASIL DIUNDUH!`, 'buyer');
    } catch (err) {
      showToast('Gagal mengunduh struk. Coba lagi.', 'buyer');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!checkoutData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4 py-16">
        <Card variant="dark" className="p-8 text-center space-y-4 border-brand-red/30 max-w-md">
          <Frown className="w-12 h-12 text-brand-red mx-auto" />
          <h2 className="text-xl font-black uppercase text-white tracking-wider">PESANAN TIDAK DITEMUKAN</h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Data pesanan tidak ditemukan di sesi ini. Kembali ke beranda dan gunakan menu{' '}
            <span className="font-black text-brand-blue">"CEK TIKET"</span> dengan Kode ID yang sudah tersimpan.
          </p>
          <Button variant="blue" fullWidth onClick={() => navigate('/')} className="min-h-[48px] font-black uppercase">
            KEMBALI KE BERANDA
          </Button>
        </Card>
      </div>
    );
  }

  const { order, items, guestName } = checkoutData;
  const categoryName = items?.[0]?.categoryName || items?.[0]?.name || 'Tiket';

  return (
    <div className="min-h-screen bg-black px-4 py-12 sm:py-16">
      <div className="max-w-xl mx-auto space-y-6">
        <Card variant="blue" className="p-5 sm:p-8 space-y-5 border border-brand-blue/50 shadow-[0_0_50px_rgba(6,182,212,0.3)]">
          <div className="flex items-center space-x-3 border-b border-neutral-800 pb-4">
            <CheckCircle2 className="w-9 h-9 text-brand-blue shrink-0" />
            <div>
              <h1 className="text-xl sm:text-2xl font-black uppercase text-white tracking-wider leading-tight">
                PESANAN TERKIRIM!
              </h1>
              <p className="text-[10px] sm:text-xs font-bold text-neutral-300 uppercase tracking-wider">
                TIKET SEDANG DIVERIFIKASI PANITIA EVENT
              </p>
            </div>
          </div>

          <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800/80 space-y-1.5 text-xs font-bold">
            <div className="flex justify-between text-neutral-400 gap-4">
              <span className="shrink-0">STATUS:</span>
              <span className="text-brand-yellow font-mono text-right">MENUNGGU VERIFIKASI BUKTI</span>
            </div>
            <div className="flex justify-between text-neutral-400 gap-4">
              <span className="shrink-0">TOTAL BAYAR:</span>
              <span className="text-brand-yellow font-mono">{formatRupiah(totalAmount)}</span>
            </div>
          </div>

          <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3 text-center">
            <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">
              KODE ID PESANAN (SIMPAN BAIK-BAIK)
            </p>
            <p className="text-3xl sm:text-4xl font-black font-mono text-brand-blue tracking-widest select-all break-all">
              {prettyCode}
            </p>
            <Button
              type="button"
              variant={copied ? 'green' : 'outline'}
              onClick={handleCopyOrderId}
              className="min-h-[48px] w-full mt-1 px-4 py-2 text-xs font-black uppercase inline-flex items-center justify-center space-x-2"
            >
              <Copy className={`w-4 h-4 ${copied ? 'text-black' : 'text-brand-blue'}`} />
              <span>{copied ? 'KODE TERSALIN! TIKET TERSIMPAN' : 'SALIN KODE ID PESANAN'}</span>
            </Button>
          </div>

          <div className="p-3 bg-brand-red/10 border border-brand-red/40 rounded-lg text-xs text-neutral-300 font-medium leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-brand-red inline-block mr-1 -mt-0.5" />
            <span className="font-black text-brand-red">PENTING:</span> Layanan bot WhatsApp sedang maintenance sehingga e-ticket tidak terkirim otomatis.
            <span className="font-black text-white"> Simpan Kode ID di atas</span> untuk mengecek e-ticket lewat tombol <span className="font-black text-brand-blue">"CEK TIKET"</span>.
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest text-center">
              SIMPAN STRUK PESANAN SEBAGAI BUKTI PEMBELIAN:
            </p>
            <Button
              type="button"
              variant="purple"
              fullWidth
              onClick={handleDownloadStruk}
              disabled={isDownloading}
              className="min-h-[48px] py-3 font-black text-xs uppercase tracking-wider"
            >
              <Download className="w-4 h-4 mr-2" />
              {isDownloading ? 'MENGUNDUH STRUK...' : 'DOWNLOAD STRUK TIKET'}
            </Button>
          </div>

          <Button
            variant={hasSavedTicket ? 'blue' : 'dark'}
            fullWidth
            disabled={!hasSavedTicket}
            onClick={() => navigate('/')}
            className="min-h-[52px] py-3 font-black text-xs uppercase tracking-wider touch-press flex items-center justify-center space-x-2"
          >
            {hasSavedTicket ? <Unlock className="w-4 h-4 shrink-0" /> : <Lock className="w-4 h-4 shrink-0" />}
            <span>{hasSavedTicket ? 'KEMBALI KE BERANDA' : 'SIMPAN TIKET UNTUK MELANJUTKAN'}</span>
          </Button>

          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800/60 text-[10px] text-neutral-500 font-bold uppercase text-center tracking-widest leading-relaxed">
            {hasSavedTicket
              ? 'KODE ID TERSIMPAN AMAN. ANDA BISA MENINGGALKAN HALAMAN INI.'
              : 'SALIN KODE ID ATAU DOWNLOAD STRUK UNTUK MENGAKTIFKAN TOMBOL BAWAH (PERLINDUNGAN ANTI-KEHILANGAN).'}
          </div>
        </Card>

        <div className="relative">
          <TicketGraphic
            ref={ticketRef}
            eventName={eventName}
            guestName={guestName || 'Pembeli'}
            ticketCode={prettyCode}
            displayUid={prettyCode}
            isPaid={false}
            isReady={true}
            categoryName={categoryName}
            ticketLabel="STRUK PESANAN / BUKTI ORDER"
            orderLookupCode={prettyCode}
          />
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
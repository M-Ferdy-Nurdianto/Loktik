import React, { useState, useEffect, useRef } from 'react';
import { QrCode, CheckCircle2, XCircle, Upload, RefreshCw, Users } from 'lucide-react';
import jsQR from 'jsqr';
import { supabase } from '../../services/supabase';
import { checkTicketValidity, redeemTicket } from '../../services/apiTickets';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const Scanner = ({ eventId, eventName }) => {
  const [scanMode, setScanMode] = useState('camera');
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [totalScanned, setTotalScanned] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(document.createElement('canvas'));
  const animFrameRef = useRef(null);
  const lastScannedRef = useRef('');

  const fetchAttendance = async () => {
    try {
      const { data: eventOrders } = await supabase.from('orders').select('id').eq('event_id', eventId);
      if (!eventOrders || eventOrders.length === 0) return setTotalScanned(0);

      const orderIds = eventOrders.map((o) => o.id);
      const { count } = await supabase
        .from('tickets')
        .select('id', { count: 'exact', head: true })
        .in('order_id', orderIds)
        .eq('is_scanned', true);

      setTotalScanned(count || 0);
    } catch (e) {
      console.warn('Realtime attendance error:', e);
    }
  };

  useEffect(() => {
    if (!eventId) return;
    fetchAttendance();

    const channel = supabase
      .channel(`gate-tickets-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
        fetchAttendance();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const processCode = async (rawCode) => {
    if (!rawCode || scanning || redeeming) return;
    const cleanCode = rawCode.trim();
    if (lastScannedRef.current === cleanCode && scanResult?.status === 'SUCCESS') return;
    lastScannedRef.current = cleanCode;

    try {
      setScanning(true);
      const check = await checkTicketValidity(cleanCode);
      if (!check.success || check.is_scanned) {
        setScanResult({
          status: 'FAILED',
          msg: check.is_scanned ? 'TIKET SUDAH HANGUS (PERNAH DI-SCAN)' : check.message || 'TIKET TIDAK DITEMUKAN',
          guest: check.guest_name,
          category: check.category_name,
        });
        return;
      }

      setRedeeming(true);
      const redeem = await redeemTicket(check.ticket_id, 'Gate Venue');
      if (redeem.success) {
        setScanResult({
          status: 'SUCCESS',
          msg: 'TIKET VALID! GANTI GELANG SEKARANG.',
          guest: check.guest_name,
          category: check.category_name,
          ticketId: check.ticket_id,
        });
        fetchAttendance();
      } else {
        setScanResult({ status: 'FAILED', msg: redeem.message });
      }
    } catch (err) {
      setScanResult({ status: 'FAILED', msg: err.message || 'Gagal memproses tiket.' });
    } finally {
      setScanning(false);
      setRedeeming(false);
    }
  };

  useEffect(() => {
    let stream = null;
    let isActive = true;

    if (scanMode === 'camera') {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } } })
        .then((s) => {
          if (!isActive) return;
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
          }

          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          const tick = () => {
            if (!isActive) return;
            const video = videoRef.current;
            if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const qr = jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: 'attemptBoth' });
              if (qr && qr.data) processCode(qr.data);
            }
            animFrameRef.current = requestAnimationFrame(tick);
          };
          animFrameRef.current = requestAnimationFrame(tick);
        })
        .catch(() => {});
    }

    return () => {
      isActive = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [scanMode]);

  const handleFileUpload = (e) => {
    if (!e.target.files?.[0]) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const qr = jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: 'attemptBoth' });
      if (qr?.data) processCode(qr.data);
      else alert('QR Code tidak terbaca!');
    };
    img.src = URL.createObjectURL(e.target.files[0]);
  };

  return (
    <div className="space-y-4 text-left font-sans">
      {/* Live Attendance Counter */}
      <Card variant="dark" className="p-4 border-neutral-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-brand-green/20 text-brand-green border border-brand-green/40 rounded">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-neutral-400">TOTAL HADIR DI VENUE (REALTIME)</p>
            <p className="text-2xl font-black font-mono text-brand-green">{totalScanned} TIKET DI-SCAN</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAttendance}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </Card>

      {/* RESULT FEEDBACK SCREEN (STREETWEAR DARK ACCENT) */}
      {scanResult && (
        <div
          className={`p-5 rounded border space-y-2 text-white ${
            scanResult.status === 'SUCCESS'
              ? 'bg-brand-green/10 border-brand-green text-brand-green'
              : 'bg-brand-red/10 border-brand-red text-brand-red'
          }`}
        >
          <div className="flex items-center justify-between border-b border-current pb-2">
            <span className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              {scanResult.status === 'SUCCESS' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
              {scanResult.status === 'SUCCESS' ? 'TIKET VALID — GELANG DISERAHKAN' : 'TIKET INVALID — DITOLAK'}
            </span>
            <Button variant="outline" size="sm" onClick={() => setScanResult(null)} className="text-white border-current">
              TUTUP
            </Button>
          </div>
          <p className="text-base font-black uppercase font-mono">{scanResult.msg}</p>
          {scanResult.guest && (
            <div className="bg-[#121212] text-white p-3 rounded border border-neutral-800 font-mono text-xs space-y-1">
              <p>PEMBELI: <strong className="text-brand-yellow uppercase">{scanResult.guest}</strong></p>
              <p>KATEGORI: <strong className="text-brand-purple uppercase">{scanResult.category}</strong></p>
            </div>
          )}
        </div>
      )}

      {/* SCAN CONTROLLER CARD */}
      <Card variant="dark" className="p-4 border-neutral-800 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {['camera', 'upload', 'manual'].map((mode) => (
            <button
              key={mode}
              onClick={() => setScanMode(mode)}
              className={`py-2 px-2 text-xs font-black uppercase rounded transition-colors ${
                scanMode === mode
                  ? 'bg-brand-green text-black font-black'
                  : 'bg-[#181818] text-neutral-400 border border-neutral-800 hover:text-white'
              }`}
            >
              {mode === 'camera' ? '📷 KAMERA' : mode === 'upload' ? '🖼️ UPLOAD' : '⌨️ MANUAL'}
            </button>
          ))}
        </div>

        {scanMode === 'camera' && (
          <div className="relative bg-black border border-neutral-800 rounded aspect-video overflow-hidden flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-cover" />
            <div className="absolute inset-0 border-2 border-brand-green/40 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-dashed border-brand-green rounded" />
            </div>
          </div>
        )}

        {scanMode === 'upload' && (
          <label className="block p-8 border border-dashed border-neutral-700 bg-[#181818] rounded text-center cursor-pointer hover:bg-neutral-800">
            <Upload className="w-8 h-8 mx-auto mb-2 text-brand-green" />
            <span className="text-xs font-black uppercase text-neutral-300">PILIH FOTO QR CODE TIKET</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        )}

        {scanMode === 'manual' && (
          <form onSubmit={(e) => { e.preventDefault(); processCode(manualCode); }} className="space-y-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Ketik UUID / Kode Cantik (RB1029)"
              className="w-full p-3 bg-[#181818] border border-neutral-800 rounded font-mono font-black text-base text-white uppercase focus:outline-none focus:border-brand-green"
            />
            <Button type="submit" variant="green" fullWidth className="py-3 text-xs font-black justify-center">
              VERIFIKASI CODE TIKET
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};

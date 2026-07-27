import React, { useState, useEffect, useRef } from 'react';
import { QrCode, CheckCircle2, XCircle, Camera, Upload, Sparkles, RefreshCw, Users } from 'lucide-react';
import jsQR from 'jsqr';
import { supabase } from '../../services/supabase';
import { checkTicketValidity, redeemTicket } from '../../services/apiTickets';

export const Scanner = ({ eventId, eventName }) => {
  const [scanMode, setScanMode] = useState('camera'); // 'camera' | 'upload' | 'manual'
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [scanResult, setScanResult] = useState(null); // { status: 'SUCCESS'|'FAILED', msg, guest, category, ticketId }
  const [totalScanned, setTotalScanned] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(document.createElement('canvas'));
  const animFrameRef = useRef(null);
  const lastScannedRef = useRef('');

  // Fetch Live Attendance Count & Subscribe to Realtime WebSocket
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

  // Camera Scanner Loop
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
      <div className="bg-[#000] text-white p-4 border-4 border-black shadow-[4px_4px_0px_#FFE600] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#39FF14] text-black border-2 border-black">
            <Users className="w-6 h-6 stroke-[3]" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-neutral-400">TOTAL HADIR DI VENUE (REALTIME)</p>
            <p className="text-2xl font-black font-mono text-[#39FF14]">{totalScanned} TIKET DI-SCAN</p>
          </div>
        </div>
        <button onClick={fetchAttendance} className="p-2 bg-white text-black border-2 border-black font-black text-xs uppercase cursor-pointer">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* RESULT FEEDBACK SCREEN (STRICT NEO-BRUTALISM FULL PEKAT) */}
      {scanResult && (
        <div className={`p-5 border-4 border-black shadow-[6px_6px_0px_#000] space-y-2 text-white ${scanResult.status === 'SUCCESS' ? 'bg-[#00CC00]' : 'bg-[#FF0000]'}`}>
          <div className="flex items-center justify-between border-b-4 border-black pb-2">
            <span className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              {scanResult.status === 'SUCCESS' ? <CheckCircle2 className="w-7 h-7 stroke-[3]" /> : <XCircle className="w-7 h-7 stroke-[3]" />}
              {scanResult.status === 'SUCCESS' ? 'TIKET VALID (HIJAU)' : 'TIKET INVALID (MERAH)'}
            </span>
            <button onClick={() => setScanResult(null)} className="px-3 py-1 bg-black text-white font-black text-xs border-2 border-black uppercase cursor-pointer">TUTUP</button>
          </div>
          <p className="text-lg font-black uppercase font-mono">{scanResult.msg}</p>
          {scanResult.guest && (
            <div className="bg-black/90 text-white p-3 border-2 border-black font-mono text-xs space-y-1">
              <p>NAMA: <strong className="text-[#FFE600] uppercase">{scanResult.guest}</strong></p>
              <p>KATEGORI: <strong className="text-[#39FF14] uppercase">{scanResult.category}</strong></p>
            </div>
          )}
        </div>
      )}

      {/* SCAN CONTROLLER */}
      <div className="bg-white p-4 border-4 border-black shadow-[4px_4px_0px_#000] space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {['camera', 'upload', 'manual'].map((mode) => (
            <button
              key={mode}
              onClick={() => setScanMode(mode)}
              className={`py-2 px-1 text-xs font-black uppercase border-2 border-black ${scanMode === mode ? 'bg-[#39FF14] text-black shadow-[2px_2px_0px_#000]' : 'bg-[#F4F4F4] text-black'}`}
            >
              {mode === 'camera' ? '📷 KAMERA' : mode === 'upload' ? '🖼️ UPLOAD' : '⌨️ MANUAL'}
            </button>
          ))}
        </div>

        {scanMode === 'camera' && (
          <div className="relative bg-black border-4 border-black aspect-video overflow-hidden flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-cover" />
            <div className="absolute inset-0 border-4 border-[#39FF14]/50 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 border-4 border-dashed border-[#39FF14]" />
            </div>
          </div>
        )}

        {scanMode === 'upload' && (
          <label className="block p-8 border-4 border-dashed border-black bg-[#F4F4F4] text-center cursor-pointer hover:bg-white">
            <Upload className="w-8 h-8 mx-auto mb-2 text-black" />
            <span className="text-xs font-black uppercase">PILIH FOTO QR CODE TIKET</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        )}

        {scanMode === 'manual' && (
          <form onSubmit={(e) => { e.preventDefault(); processCode(manualCode); }} className="space-y-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Ketik UUID / Code Cantik (RB1029)"
              className="w-full p-3 bg-[#F4F4F4] border-4 border-black font-mono font-black text-lg text-black uppercase"
            />
            <button type="submit" className="w-full py-3 bg-[#FFE600] text-black font-black text-sm uppercase border-4 border-black shadow-[3px_3px_0px_#000]">
              VERIFIKASI CODE TIKET
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

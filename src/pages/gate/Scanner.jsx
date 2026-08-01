import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { QrCode, CheckCircle2, XCircle, Upload, RefreshCw, Users, Camera, ShieldCheck, Zap } from 'lucide-react';
import jsQR from 'jsqr';
import { supabase } from '../../services/supabase';
import { checkTicketValidity, redeemTicket } from '../../services/apiTickets';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';

export const Scanner = ({ eventId }) => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [scanMode, setScanMode] = useState('camera'); // 'camera' | 'upload' | 'manual'
  const [manualCode, setManualCode] = useState('');
  const [totalScanned, setTotalScanned] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(document.createElement('canvas'));
  const animFrameRef = useRef(null);

  const fetchAttendance = async () => {
    if (!eventId) return;
    try {
      const { data: eventOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('event_id', eventId);

      if (!eventOrders || eventOrders.length === 0) {
        setTotalScanned(0);
        return;
      }

      const orderIds = eventOrders.map((o) => o.id);
      const { count } = await supabase
        .from('tickets')
        .select('id', { count: 'exact', head: true })
        .in('order_id', orderIds)
        .eq('is_scanned', true);

      setTotalScanned(count || 0);
    } catch (e) {
      console.warn('Gagal memuat total kehadiran:', e);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [eventId]);

  const verifyStaffActive = async () => {
    if (user && user.role === 'staff') {
      const { data } = await supabase
        .from('staff_accounts')
        .select('status')
        .eq('id', user.id)
        .single();
      if (data && data.status === 'suspended') {
        throw new Error('Akun staf Anda ditangguhkan/nonaktif. Silakan hubungi EO.');
      }
    }
  };

  const processCode = async (rawCode) => {
    if (!rawCode || scanning || redeeming) return;
    const cleanCode = rawCode.trim();
    if (!cleanCode) return;

    try {
      setScanning(true);
      await verifyStaffActive();

      const check = await checkTicketValidity(cleanCode);
      if (!check.success) {
        setScanResult({ status: 'FAILED', msg: check.message || 'TIKET TIDAK DITEMUKAN DALAM DATABASE SISTEM.' });
        return;
      }

      // Periksa status pembayaran order dari database
      let orderStatus = null;
      
      // 1. Coba cari apakah ID yang direturn adalah ticket ID
      const { data: ticketData } = await supabase
        .from('tickets')
        .select('orders(status)')
        .eq('id', check.ticket_id)
        .maybeSingle();

      if (ticketData?.orders) {
        const obj = Array.isArray(ticketData.orders) ? ticketData.orders[0] : ticketData.orders;
        orderStatus = obj?.status;
      } else {
        // 2. Jika bukan ticket, mungkin ID adalah Order ID (dari fallback pencarian)
        const { data: orderData } = await supabase
          .from('orders')
          .select('status')
          .eq('id', check.ticket_id)
          .maybeSingle();
        if (orderData) orderStatus = orderData.status;
      }

      if (!orderStatus) {
        setScanResult({ status: 'FAILED', msg: 'GAGAL MEMERIKSA STATUS PEMBAYARAN TIKET. ID TIDAK DITEMUKAN.' });
        return;
      }

      if (orderStatus !== 'paid' && orderStatus !== 'success' && orderStatus !== 'settlement') {
        setScanResult({
          status: 'FAILED',
          msg: `TIKET DITOLAK! STATUS PEMBAYARAN MASIH: ${orderStatus?.toUpperCase() || 'BELUM LUNAS'}. KONFIRMASI KE EO.`,
          guest: check.guest_name,
          category: check.category_name,
        });
        return;
      }

      if (check.is_scanned) {
        setScanResult({
          status: 'ALREADY_SCANNED',
          msg: 'TIKET INI SUDAH DI-SCAN SEBELUMNYA! TIDAK BISA DIPAKAI DUA KALI.',
          guest: check.guest_name,
          category: check.category_name,
          scannedAt: check.scanned_at ? new Date(check.scanned_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : 'Sebelumnya',
        });
        return;
      }

      // Tiket valid & belum di-scan -> Pop-up minta Konfirmasi Pakai dari Staf Gate
      setScanResult({
        status: 'PENDING_CONFIRM',
        msg: check.message || 'TIKET VALID (BELUM DI-SCAN) — KONFIRMASI PENUKARAN TIKET FISIK',
        ticketId: check.ticket_id,
        guest: check.guest_name,
        category: check.category_name,
        progress: check.ticket_progress || '1/1',
      });
    } catch (err) {
      setScanResult({ status: 'FAILED', msg: err.message || 'Gagal memproses tiket.' });
    } finally {
      setScanning(false);
    }
  };

  const handleConfirmRedeem = async () => {
    if (!scanResult || !scanResult.ticketId || redeeming) return;
    try {
      setRedeeming(true);
      await verifyStaffActive();
      const redeem = await redeemTicket(scanResult.ticketId, 'Gate Staff Scanner');
      if (redeem.success) {
        const msgText = `TIKET KE-${scanResult.progress || '1/1'} BERHASIL DI-REDEEM & TIKET FISIK DISERAHKAN!`;
        setScanResult({
          status: 'SUCCESS',
          msg: msgText,
          guest: scanResult.guest,
          category: scanResult.category,
          progress: scanResult.progress,
        });
        showToast(msgText, 'staff');
        fetchAttendance();
      } else {
        const errText = redeem.message || 'Gagal meredem tiket.';
        setScanResult({
          status: 'FAILED',
          msg: errText,
        });
        showToast(errText, 'staff');
      }
    } catch (err) {
      const errText = err.message || 'Gagal meredem tiket.';
      setScanResult({ status: 'FAILED', msg: errText });
      showToast(errText, 'staff');
    } finally {
      setRedeeming(false);
    }
  };

  useEffect(() => {
    let stream = null;
    let isActive = true;
    setCameraError(null);

    const startCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Browser tidak mendukung akses kamera. Gunakan HTTPS atau opsi Manual.');
        return;
      }

      try {
        // Try ideal environment rear camera first
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
        });
      } catch (err1) {
        try {
          // Fallback to default video device
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (err2) {
          if (isActive) {
            setCameraError('Izin kamera ditolak atau kamera tidak ditemukan. Izinkan kamera di browser atau gunakan opsi Upload/Manual.');
          }
          return;
        }
      }

      if (!isActive) {
        if (stream) stream.getTracks().forEach((t) => t.stop());
        return;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
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
    };

    if (scanMode === 'camera') {
      startCamera();
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
      else showToast('QR Code tidak terbaca!', 'staff');
    };
    img.src = URL.createObjectURL(e.target.files[0]);
  };

  return (
    <div className="space-y-4 text-left font-sans">
      <Card variant="dark" className="p-4 border-neutral-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-brand-purple/20 text-brand-purple border border-brand-purple/40 rounded">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-neutral-400">TOTAL HADIR DI VENUE (REALTIME)</p>
            <p className="text-2xl font-black font-mono text-brand-purple">{totalScanned} TIKET DI-SCAN</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAttendance}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </Card>

      {scanResult && createPortal(
        <div className="fixed inset-0 z-[99999] w-screen h-screen bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <Card
            variant="dark"
            className={`w-full max-w-lg p-6 space-y-4 my-auto text-left shadow-[0_0_50px_rgba(0,0,0,0.9)] border-2 ${
              scanResult.status === 'SUCCESS'
                ? 'border-brand-green bg-[#0d170f]'
                : scanResult.status === 'PENDING_CONFIRM'
                ? 'border-brand-purple bg-[#140d21]'
                : 'border-brand-red bg-[#1a0a0a]'
            }`}
          >
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <span className={`text-base font-black uppercase tracking-tight flex items-center gap-2 ${
                scanResult.status === 'SUCCESS'
                  ? 'text-brand-green'
                  : scanResult.status === 'PENDING_CONFIRM'
                  ? 'text-brand-purple'
                  : 'text-brand-red'
              }`}>
                {scanResult.status === 'SUCCESS' && <CheckCircle2 className="w-6 h-6 shrink-0" />}
                {scanResult.status === 'PENDING_CONFIRM' && <ShieldCheck className="w-6 h-6 shrink-0" />}
                {scanResult.status !== 'SUCCESS' && scanResult.status !== 'PENDING_CONFIRM' && <XCircle className="w-6 h-6 shrink-0" />}
                
                {scanResult.status === 'SUCCESS' && 'TIKET VALID — TIKET FISIK DISERAHKAN'}
                {scanResult.status === 'PENDING_CONFIRM' && 'KONFIRMASI'}
                {scanResult.status === 'ALREADY_SCANNED' && 'TIKET SUDAH TER-SCAN (DITOLAK)'}
                {scanResult.status === 'FAILED' && 'TIKET INVALID (DITOLAK)'}
              </span>
              <Button variant="outline" size="sm" onClick={() => setScanResult(null)} className="text-xs">
                TUTUP
              </Button>
            </div>

            <p className="text-sm font-black uppercase font-mono leading-snug">{scanResult.msg}</p>

            {scanResult.guest && (
              <div className="bg-[#121212] text-white p-4 rounded border border-neutral-800 font-mono text-xs space-y-2">
                <div className="flex justify-between items-center border-b border-neutral-800/80 pb-2">
                  <span className="text-neutral-400 font-bold">NAMA PEMBELI:</span>
                  <strong className="text-brand-yellow text-sm font-black uppercase">{scanResult.guest}</strong>
                </div>
                <div className="flex justify-between items-center border-b border-neutral-800/80 pb-2">
                  <span className="text-neutral-400 font-bold">KATEGORI TIKET:</span>
                  <strong className="text-brand-purple text-xs font-black uppercase">{scanResult.category}</strong>
                </div>
                {scanResult.progress && (
                  <div className="flex justify-between items-center bg-brand-purple/15 border border-brand-purple/40 p-2 rounded text-xs">
                    <span className="text-neutral-300 font-bold">STATUS PROGRES PENUKARAN:</span>
                    <span className="font-black font-mono text-brand-purple bg-brand-purple/30 px-2 py-0.5 rounded border border-brand-purple/60">
                      TIKET KE-{scanResult.progress}
                    </span>
                  </div>
                )}
                {scanResult.scannedAt && (
                  <div className="flex justify-between items-center border-t border-neutral-800/80 pt-2">
                    <span className="text-neutral-400 font-bold">WAKTU DI-SCAN:</span>
                    <strong className="text-brand-red text-xs font-black">{scanResult.scannedAt}</strong>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2">
              {scanResult.status === 'PENDING_CONFIRM' ? (
                <Button
                  onClick={handleConfirmRedeem}
                  disabled={redeeming}
                  variant="purple"
                  fullWidth
                  className="py-4 text-xs font-black uppercase justify-center tracking-wider shadow-[0_0_20px_rgba(139,92,246,0.6)]"
                >
                  {redeeming ? (
                    <span className="flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin text-white" />
                      MEMPROSES REDEEM...
                    </span>
                  ) : (
                    'KONFIRMASI TIKET'
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => setScanResult(null)}
                  variant="outline"
                  fullWidth
                  className="py-3 text-xs font-black uppercase justify-center"
                >
                  TUTUP &amp; SCAN TIKET SELANJUTNYA
                </Button>
              )}
            </div>
          </Card>
        </div>,
        document.body
      )}

      <Card variant="dark" className="p-4 sm:p-5 border-neutral-800 space-y-4 text-left">
        {/* Top: Fast Manual Code Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (manualCode) processCode(manualCode);
          }}
          className="space-y-2 p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 shadow-inner"
        >
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black uppercase text-brand-purple tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-brand-purple fill-brand-purple" />
              <span>INPUT KODE TIKET MANUAL (TANPA SCAN):</span>
            </label>
            <span className="text-[9px] font-mono text-neutral-500 font-bold">FASTER GATE</span>
          </div>

          <div className="flex items-center gap-2 w-full">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Masukkan Kode Tiket"
              className="flex-1 bg-[#121212] border border-neutral-800 rounded-lg px-4 py-3 font-mono font-black text-sm text-white uppercase focus:outline-none focus:border-brand-purple"
            />
            <Button type="submit" variant="purple" className="text-xs font-black uppercase px-5 shrink-0 py-3">
              VERIF
            </Button>
          </div>
        </form>

        {/* Below: Live Camera Scanner Viewport */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-neutral-400" />
              <span>SCANNER QR CODE KAMERA LIVE:</span>
            </label>
            <label className="cursor-pointer text-[10px] font-extrabold text-brand-purple hover:underline flex items-center gap-1">
              <Upload className="w-3 h-3" />
              <span>UPLOAD FOTO QR</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div className="relative bg-black border border-neutral-800 rounded-xl aspect-[4/5] sm:aspect-video overflow-hidden flex items-center justify-center shadow-lg">
            {cameraError ? (
              <div className="p-4 text-center space-y-2 text-neutral-400">
                <Camera className="w-8 h-8 text-brand-red mx-auto" />
                <p className="text-xs font-bold text-brand-red uppercase max-w-xs mx-auto leading-relaxed">
                  {cameraError}
                </p>
                <p className="text-[11px] text-neutral-500">Gunakan kolom Input Kode Manual di atas atau opsi Upload Foto QR.</p>
              </div>
            ) : (
              <>
                <video ref={videoRef} playsInline autoPlay muted className="w-full h-full object-cover" />
                <div className="absolute bottom-4 inset-x-0 mx-auto w-max bg-black/70 backdrop-blur text-white px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest border border-white/10 uppercase shadow-md">
                  Posisikan QR di mana saja
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

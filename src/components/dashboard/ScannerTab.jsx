import React, { useState, useEffect, useRef } from 'react';
import { QrCode, CheckCircle2, XCircle, RefreshCw, Camera, Keyboard, Upload, Image, Sparkles, ShieldCheck, Ticket, Check } from 'lucide-react';
import jsQR from 'jsqr';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { checkTicketValidity, redeemTicket } from '../../services/apiTickets';

export const ScannerTab = () => {
  const [scanMode, setScanMode] = useState('camera'); // 'camera' | 'upload' | 'manual'
  const [barcodeInput, setBarcodeInput] = useState('');
  const [gateStaff, setGateStaff] = useState('Gate Utama 1');
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [isRedeemed, setIsRedeemed] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [scanErrorMsg, setScanErrorMsg] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(document.createElement('canvas'));
  const animFrameIdRef = useRef(null);
  const lastScannedCodeRef = useRef('');

  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setCameras(videoDevices);
        if (videoDevices.length > 0) {
          const backCam = videoDevices.find((d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
          setSelectedCameraId(backCam ? backCam.deviceId : videoDevices[0].deviceId);
        }
      });
    }
  }, []);

  const processScanCode = async (rawCode) => {
    if (!rawCode || scanning) return;

    const cleanCode = rawCode.trim();
    if (lastScannedCodeRef.current === cleanCode && scanResult) return;
    lastScannedCodeRef.current = cleanCode;

    try {
      setScanning(true);
      setScanErrorMsg(null);
      setIsRedeemed(false);

      // Step 1: Check ticket validity without burning it automatically
      const res = await checkTicketValidity(cleanCode);
      setScanResult(res);

      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        osc.type = res.success ? 'sine' : 'square';
        osc.frequency.setValueAtTime(res.success ? 880 : 330, audioCtx.currentTime);
        osc.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } catch (e) {
        // Ignore audio errors
      }
    } catch (err) {
      setScanResult({
        success: false,
        message: err.message || 'Gagal memverifikasi tiket pada database.',
      });
    } finally {
      setScanning(false);
    }
  };

  // Step 2: Staff confirms & burns ticket when handing over wristband
  const handleStaffConfirmRedeem = async () => {
    if (!scanResult || !scanResult.ticket_id || redeeming) return;

    try {
      setRedeeming(true);
      const redeemRes = await redeemTicket(scanResult.ticket_id, gateStaff);
      if (redeemRes.success) {
        setIsRedeemed(true);
      } else {
        alert(redeemRes.message);
      }
    } catch (err) {
      alert(err.message || 'Gagal memperbarui status tiket.');
    } finally {
      setRedeeming(false);
    }
  };

  // Live Camera Scanner Hook
  useEffect(() => {
    let stream = null;
    let isActive = true;

    if (scanMode === 'camera') {
      const constraints = {
        video: selectedCameraId
          ? { deviceId: { exact: selectedCameraId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      };

      navigator.mediaDevices
        .getUserMedia(constraints)
        .then((mediaStream) => {
          if (!isActive) return;
          stream = mediaStream;
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
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

              let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              let code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
              });

              if (!code) {
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                  const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                  const threshold = avg > 140 ? 255 : 0;
                  data[i] = threshold;
                  data[i + 1] = threshold;
                  data[i + 2] = threshold;
                }
                code = jsQR(data, imageData.width, imageData.height, {
                  inversionAttempts: 'attemptBoth',
                });
              }

              if (code && code.data) {
                processScanCode(code.data);
              }
            }

            animFrameIdRef.current = requestAnimationFrame(tick);
          };

          animFrameIdRef.current = requestAnimationFrame(tick);
        })
        .catch(() => {
          setScanErrorMsg('Gagal menyalakan kamera. Gunakan tab "UNGGAH FOTO QR".');
        });
    }

    return () => {
      isActive = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [scanMode, selectedCameraId]);

  const handleQrFileUpload = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setScanErrorMsg(null);

    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });

      if (code && code.data) {
        processScanCode(code.data);
      } else {
        setScanErrorMsg('Foto QR Code tidak terbaca. Pastikan foto jelas.');
      }
    };
    img.src = URL.createObjectURL(file);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      lastScannedCodeRef.current = '';
      processScanCode(barcodeInput.trim());
    }
  };

  const handleResetScan = () => {
    setBarcodeInput('');
    setScanResult(null);
    setScanErrorMsg(null);
    setIsRedeemed(false);
    lastScannedCodeRef.current = '';
  };

  return (
    <Card variant="dark" className="p-6 space-y-6 text-left border-neutral-800">
      <div className="border-b border-neutral-800 pb-3 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-black uppercase text-white tracking-tight flex items-center space-x-2">
            <span>GATE SCANNER VERIFIKASI 2-LANGKAH STAF</span>
            <Badge variant="green" className="text-[10px]">MANUAL CONFIRM</Badge>
          </h3>
          <p className="text-xs text-neutral-400">Scan QR Code &rarr; Tampil Info Tiket &rarr; Staf Klik 'GANTI GELANG &amp; PAKAI TIKET'.</p>
        </div>
        <Badge variant="purple">● STAFF CONFIRM MODE</Badge>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-3 gap-2 bg-neutral-950 p-1.5 rounded-lg border border-neutral-800">
        <button
          type="button"
          onClick={() => setScanMode('camera')}
          className={`py-2 px-3 rounded-md text-xs font-black uppercase flex items-center justify-center space-x-1.5 transition-all ${
            scanMode === 'camera'
              ? 'bg-brand-green text-black shadow-[0_0_10px_rgba(57,255,20,0.3)]'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>1. KAMERA LIVE</span>
        </button>

        <button
          type="button"
          onClick={() => setScanMode('upload')}
          className={`py-2 px-3 rounded-md text-xs font-black uppercase flex items-center justify-center space-x-1.5 transition-all ${
            scanMode === 'upload'
              ? 'bg-brand-purple text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>2. UNGGAH FOTO QR</span>
        </button>

        <button
          type="button"
          onClick={() => setScanMode('manual')}
          className={`py-2 px-3 rounded-md text-xs font-black uppercase flex items-center justify-center space-x-1.5 transition-all ${
            scanMode === 'manual'
              ? 'bg-brand-blue text-black shadow-[0_0_10px_rgba(6,182,212,0.3)]'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Keyboard className="w-3.5 h-3.5" />
          <span>3. INPUT KODE</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* SCANNER INPUT CONTAINER */}
        <div className="space-y-4">
          <Input
            label="NAMA POS GATE STAF"
            value={gateStaff}
            onChange={(e) => setGateStaff(e.target.value)}
          />

          {scanMode === 'camera' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase text-brand-green flex items-center space-x-1">
                  <Sparkles className="w-4 h-4" />
                  <span>VIEWFINDER KAMERA LIVE</span>
                </label>

                {cameras.length > 1 && (
                  <select
                    value={selectedCameraId}
                    onChange={(e) => setSelectedCameraId(e.target.value)}
                    className="bg-neutral-900 text-xs text-brand-green border border-neutral-700 rounded px-2 py-1 font-bold"
                  >
                    {cameras.map((c) => (
                      <option key={c.deviceId} value={c.deviceId}>
                        📷 {c.label || `Kamera ${c.deviceId.substring(0, 5)}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="w-full bg-black rounded-lg border-2 border-brand-green overflow-hidden relative min-h-[260px] flex items-center justify-center shadow-[0_0_15px_rgba(57,255,20,0.2)]">
                <video ref={videoRef} className="w-full h-auto max-h-[300px] object-cover" />
              </div>
            </div>
          )}

          {scanMode === 'upload' && (
            <div className="p-6 bg-neutral-900 rounded-lg border-2 border-brand-purple space-y-4 text-center">
              <Image className="w-12 h-12 text-brand-purple mx-auto" />
              <div>
                <h4 className="text-sm font-black uppercase text-white">UNGGAH FOTO / SCREENSHOT QR CODE TIKET</h4>
                <p className="text-xs text-neutral-400 font-medium mt-1">Pilih file gambar QR Code dari komputer untuk scan instan.</p>
              </div>

              <label className="inline-flex items-center justify-center px-4 py-2.5 bg-brand-purple text-white text-xs font-black uppercase rounded-md cursor-pointer hover:bg-purple-600 transition-colors space-x-2">
                <Upload className="w-4 h-4" />
                <span>PILIH FILE FOTO QR CODE</span>
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleQrFileUpload} className="hidden" />
              </label>
            </div>
          )}

          {scanMode === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-3 p-4 bg-neutral-900 rounded-md border border-neutral-800">
              <span className="text-xs font-bold uppercase text-brand-blue tracking-wider flex items-center space-x-1">
                <Keyboard className="w-4 h-4" />
                <span>OPSI BACKUP: KETIK KODE MANUAL</span>
              </span>
              <Input label="KODE BARCODE / ORDER ID" placeholder="Ketik Order ID..." value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} required />
              <Button type="submit" variant="green" fullWidth disabled={scanning}>
                {scanning ? 'MEMERIKSA...' : 'VERIFIKASI KODE'}
              </Button>
            </form>
          )}

          {scanErrorMsg && (
            <p className="text-xs text-brand-red font-bold uppercase bg-red-950/40 p-2.5 rounded border border-brand-red/40 text-center">
              ⚠️ {scanErrorMsg}
            </p>
          )}

          <Button type="button" variant="outline" size="sm" fullWidth onClick={handleResetScan}>
            RESET LAYAR SCAN
          </Button>
        </div>

        {/* STAFF CONFIRMATION DISPLAY SCREEN */}
        <div className="flex flex-col justify-center">
          {!scanResult ? (
            <div className="p-10 border-2 border-dashed border-neutral-800 rounded-lg text-center space-y-3">
              <QrCode className="w-12 h-12 text-neutral-600 mx-auto" />
              <p className="text-xs font-bold text-neutral-500 uppercase">SIAP MEMINDAI TIKET</p>
              <p className="text-[11px] text-neutral-600">Scan QR Code &rarr; Tampil Detail &rarr; Klik Tombol Konfirmasi Staf.</p>
            </div>
          ) : scanResult.success ? (
            <div className="p-6 bg-neutral-900 border-2 border-brand-green rounded-lg text-center space-y-4 shadow-[0_0_20px_rgba(57,255,20,0.2)]">
              <CheckCircle2 className="w-12 h-12 text-brand-green mx-auto animate-pulse" />

              <div className="space-y-1">
                <Badge variant={isRedeemed ? 'red' : 'green'}>
                  {isRedeemed ? '🔒 TIKET TELAH DIGUNAKAN (HANGUS)' : '🟢 TIKET VALID - SIAP GANTI GELANG'}
                </Badge>
                <h3 className="text-xl font-black uppercase text-white">{scanResult.guest_name || 'PEMBELI VALID'}</h3>
                <p className="text-xs font-mono font-bold text-brand-yellow">KATEGORI: {scanResult.category_name || 'REGULER'}</p>
              </div>

              {!isRedeemed ? (
                <div className="p-4 bg-brand-green/10 border border-brand-green/40 rounded-md space-y-3">
                  <p className="text-xs font-bold text-brand-green">PERIKSA IDENTITAS PEMBELI &amp; SERAHKAN GELANG:</p>
                  <Button
                    type="button"
                    variant="green"
                    fullWidth
                    size="lg"
                    onClick={handleStaffConfirmRedeem}
                    disabled={redeeming}
                    className="h-12 text-sm font-black tracking-wider shadow-[0_0_15px_rgba(57,255,20,0.4)]"
                  >
                    {redeeming ? 'MEMPROSES...' : '🎟️ KLIK SERAHKAN GELANG & PAKAI TIKET'}
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-red-950/60 border border-brand-red rounded-md space-y-1">
                  <p className="text-xs font-extrabold text-brand-red uppercase">✓ TIKET BERHASIL DIGUNAKAN (GELANG TERKIRIM)</p>
                  <p className="text-[10px] text-neutral-400 font-mono">Diverifikasi oleh Staf: {gateStaff}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 bg-red-950/80 border-2 border-brand-red rounded-lg text-center space-y-3 shadow-[0_0_20px_rgba(255,0,0,0.2)]">
              <XCircle className="w-16 h-16 text-brand-red mx-auto" />
              <h2 className="text-2xl font-black uppercase text-brand-red">{scanResult.message}</h2>
              <p className="text-xs font-bold text-neutral-300">TIKET SUDAH HANGUS ATAU INVALID!</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

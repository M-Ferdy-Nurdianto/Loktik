import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Landmark, QrCode, Copy, AlertCircle, Smartphone, RefreshCw, Download } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { compressImageToWebP } from '../../utils/imageCompress';
import { uploadPaymentProof, createGuestOrder } from '../../services/apiOrders';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatRupiah, generatePrettyRedeemCode } from '../../utils/formatters';

export const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const getActiveCheckoutData = () => {
    const state = location.state;
    const stateItems = state?.selectedItems || state?.items;
    if (state && state.event && stateItems && stateItems.length > 0) {
      const payload = {
        event: state.event,
        items: stateItems,
        selectedItems: stateItems,
        totalAmount: state.totalAmount,
      };
      try {
        sessionStorage.setItem('loktik_active_checkout', JSON.stringify(payload));
      } catch (e) {}
      return payload;
    }

    try {
      const saved = sessionStorage.getItem('loktik_active_checkout');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.event && (parsed.items || parsed.selectedItems)) {
          return {
            event: parsed.event,
            items: parsed.items || parsed.selectedItems,
            selectedItems: parsed.items || parsed.selectedItems,
            totalAmount: parsed.totalAmount,
          };
        }
      }
    } catch (e) {}
    return null;
  };

  const checkoutState = getActiveCheckoutData();

  const [paymentTab, setPaymentTab] = useState('bank');
  const [formData, setFormData] = useState({
    guestName: '',
    guestWa: '',
    guestIg: '',
    agreeTnC: false,
  });

  const [proofFile, setProofFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showWaConfirmModal, setShowWaConfirmModal] = useState(false);

  if (!checkoutState || !checkoutState.event || !checkoutState.items || checkoutState.items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <Card variant="dark" className="p-8 space-y-4 border-brand-red/30">
          <AlertCircle className="w-12 h-12 text-brand-red mx-auto" />
          <h2 className="text-lg font-black uppercase text-white">SESI TRANSAKSI KADALUARSA</h2>
          <p className="text-xs text-neutral-400">Silakan pilih kembali tiket yang ingin dibeli dari katalog event.</p>
          <Button variant="blue" fullWidth onClick={() => navigate('/')}>
            KEMBALI KE BERANDA
          </Button>
        </Card>
      </div>
    );
  }

  const { event, items: selectedItems, totalAmount } = checkoutState;
  const paymentDetails = event.payment_details || {};

  const handleCopyAccount = () => {
    if (paymentDetails.number) {
      navigator.clipboard.writeText(paymentDetails.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQris = async (url) => {
    if (!url) return;
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `QRIS-${event?.name ? event.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Panitia'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProofFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!formData.agreeTnC) {
      setErrorMsg('Anda wajib menyetujui Syarat & Ketentuan platform.');
      return;
    }
    if (!proofFile) {
      setErrorMsg('Silakan unggah foto bukti transfer pembayaran.');
      return;
    }
    if (!formData.guestWa || formData.guestWa.length < 10) {
      setErrorMsg('Nomor WhatsApp tidak valid. Masukkan minimal 10 digit.');
      return;
    }
    setErrorMsg(null);
    setShowWaConfirmModal(true);
  };

  const handleFinalConfirmOrder = async () => {
    try {
      setSubmitting(true);
      setErrorMsg(null);

      // 1. Compress payment proof to WebP client side (<200KB)
      const compressedWebP = await compressImageToWebP(proofFile, 1000, 0.75);

      // 2. Upload WebP to Supabase Storage 'payment-proofs' bucket
      const proofUrl = await uploadPaymentProof(compressedWebP);

      // 3. Create guest order in Supabase DB
      const orderPayload = {
        event_id: event.id,
        guest_name: formData.guestName,
        guest_wa: formData.guestWa,
        guest_ig: formData.guestIg,
        total_price: totalAmount,
        payment_proof_url: proofUrl,
        status: 'pending',
      };

      const newOrder = await createGuestOrder(orderPayload, selectedItems);
      setShowWaConfirmModal(false);
      setCompletedOrder(newOrder);
      showToast('PESANAN BERHASIL DIBUAT! TIKET SEDANG DIVERIFIKASI PANITIA.', 'buyer');
    } catch (err) {
      setShowWaConfirmModal(false);
      const errTxt = err.message || 'Gagal memproses transaksi. Coba lagi.';
      setErrorMsg(errTxt);
      showToast(errTxt, 'buyer');
    } finally {
      setSubmitting(false);
    }
  };

  if (completedOrder) {
    const seed = parseInt(completedOrder.id.replace(/[^0-9]/g, '').substring(0, 4) || '1312');
    const prettyCode = generatePrettyRedeemCode(event.name, seed);

    const handleCopyCode = () => {
      navigator.clipboard.writeText(prettyCode);
      showToast(`KODE ID ${prettyCode} BERHASIL DISALIN!`, 'buyer');
    };

    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-left space-y-6">
        <Card variant="blue" className="space-y-5 p-6 sm:p-8 border border-brand-blue/50 shadow-[0_0_50px_rgba(6,182,212,0.3)]">
          <div className="flex items-center space-x-3 border-b border-neutral-800 pb-4">
            <CheckCircle2 className="w-8 h-8 text-brand-blue shrink-0" />
            <div>
              <h1 className="text-xl sm:text-2xl font-black uppercase text-white tracking-wider">PESANAN TERKIRIM!</h1>
              <p className="text-xs font-bold text-neutral-300 uppercase">TIKET SEDANG DIVERIFIKASI PANITIA EVENT</p>
            </div>
          </div>

          {/* Copyable Order ID Code Box */}
          <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2 text-center">
            <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider">KODE ID PESANAN (UNTUK CEK TIKET):</p>
            <p className="text-3xl font-black font-mono text-brand-blue tracking-widest">{prettyCode}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              className="mt-2 text-xs font-black uppercase inline-flex items-center space-x-1.5 py-1.5 px-4"
            >
              <Copy className="w-3.5 h-3.5 text-brand-blue" />
              <span>SALIN KODE ID PESANAN</span>
            </Button>
          </div>

          <div className="p-3 bg-brand-blue/10 border border-brand-blue/30 rounded-lg text-xs text-neutral-300 font-medium leading-relaxed">
            📌 <span className="font-bold text-brand-blue">SIMPAN KODE ANDA:</span> Salin dan simpan Kode ID <span className="font-black text-white font-mono">{prettyCode}</span> di atas. Kode ini dapat Anda gunakan kapan saja untuk mengecek status persetujuan e-ticket resmi Anda melalui tombol <span className="font-bold text-brand-blue">"CEK TIKET"</span> di navigasi atas.
          </div>

          <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800/80 space-y-1.5 text-xs font-bold">
            <div className="flex justify-between text-neutral-400">
              <span>STATUS:</span>
              <Badge variant="purple" className="text-[10px]">MENUNGGU VERIFIKASI BUKTI</Badge>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>TOTAL BAYAR:</span>
              <span className="text-brand-yellow font-mono">{formatRupiah(totalAmount)}</span>
            </div>
          </div>

          <Button variant="blue" fullWidth onClick={() => navigate('/')} className="py-3 font-black text-xs uppercase">
            KEMBALI KE BERANDA
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8 text-left pb-16">
      <div className="border-b border-neutral-800 pb-2">
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">CHECKOUT &amp; PEMBAYARAN</h1>
        <p className="text-xs font-bold text-brand-blue uppercase tracking-wider">{event.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Order Summary & Dual Payment Options */}
        <div className="space-y-6">
          <Card variant="dark" className="space-y-3.5 p-4 sm:p-5">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase text-brand-blue tracking-widest border-b border-neutral-800 pb-2">
              RINGKASAN PESANAN
            </h3>
            <div className="space-y-2 text-xs font-medium">
              {selectedItems.map((item, idx) => (
                <div key={idx} className="flex justify-between text-neutral-300">
                  <span>{item.categoryName} x{item.quantity}</span>
                  <span className="font-mono">{formatRupiah(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-neutral-800 pt-2 flex justify-between text-sm sm:text-base font-black text-white">
                <span>TOTAL:</span>
                <span className="text-brand-blue font-mono">{formatRupiah(totalAmount)}</span>
              </div>
            </div>
          </Card>

          {/* DUAL PAYMENT METHOD TABS */}
          <Card variant="dark" className="space-y-4 p-4 sm:p-5">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="text-xs font-extrabold uppercase text-neutral-300 tracking-widest">METODE PEMBAYARAN PANITIA</h3>
              <Badge variant="blue" className="text-[10px] px-2">2 OPSI</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentTab('bank')}
                className={`min-h-[44px] px-3 rounded-lg text-xs font-extrabold uppercase flex items-center justify-center space-x-1.5 transition-colors touch-press ${
                  paymentTab === 'bank'
                    ? 'bg-brand-blue text-black font-black'
                    : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                }`}
              >
                <Landmark className="w-4 h-4 shrink-0" />
                <span>TRANSFER BANK</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentTab('qris')}
                className={`min-h-[44px] px-3 rounded-lg text-xs font-extrabold uppercase flex items-center justify-center space-x-1.5 transition-colors touch-press ${
                  paymentTab === 'qris'
                    ? 'bg-brand-blue text-black font-black'
                    : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4 shrink-0" />
                <span>SCAN QRIS</span>
              </button>
            </div>

            {/* Tab 1: Bank Transfer Details */}
            {paymentTab === 'bank' && (
              <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800 font-mono text-xs space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">BANK: <span className="text-brand-yellow font-bold">{paymentDetails.bank || 'BCA'}</span></span>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="min-h-[36px] bg-neutral-900 text-brand-blue px-3 py-1 rounded-md border border-neutral-700 flex items-center space-x-1.5 hover:bg-brand-blue hover:text-black font-extrabold text-xs touch-press"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'TERSALIN!' : 'SALIN REK'}</span>
                  </button>
                </div>
                <p className="text-neutral-400">NO. REK: <span className="text-brand-blue font-bold text-base select-all">{paymentDetails.number || '1234567890'}</span></p>
                <p className="text-neutral-400">A.N: <span className="text-white font-bold">{paymentDetails.holder || 'PANITIA EVENT'}</span></p>
              </div>
            )}

            {/* Tab 2: QRIS Image Scanner */}
            {paymentTab === 'qris' && (
              <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800 text-center space-y-3">
                <span className="text-xs font-bold text-brand-blue uppercase">SCAN BARCODE QRIS PANITIA</span>
                {paymentDetails.qris_url ? (
                  <div className="space-y-3">
                    <div className="w-48 h-48 sm:w-56 sm:h-56 mx-auto bg-white p-2 rounded-lg border border-neutral-700 overflow-hidden shadow-md">
                      <img src={paymentDetails.qris_url} alt="QRIS Panitia" className="w-full h-full object-contain" />
                    </div>
                    <Button
                      type="button"
                      variant="blue"
                      size="sm"
                      onClick={() => handleDownloadQris(paymentDetails.qris_url)}
                      className="mx-auto flex items-center space-x-1.5 text-xs font-black uppercase tracking-wider"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>UNDUH BARCODE QRIS</span>
                    </Button>
                  </div>
                ) : (
                  <div className="p-8 border border-dashed border-neutral-800 rounded-lg text-neutral-500 text-xs font-bold uppercase">
                    PANITIA HANYA MENYEDIAKAN TRANSFER BANK
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Buyer Form & WebP Proof Upload */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card variant="dark" className="space-y-4 p-4 sm:p-5">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase text-brand-blue tracking-widest border-b border-neutral-800 pb-2">
              DATA PEMBELI
            </h3>
            <Input
              label="NAMA LENGKAP"
              required
              placeholder="Contoh: Budi Santoso"
              value={formData.guestName}
              onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
            />
            <Input
              label="NO. WHATSAPP"
              required
              type="tel"
              inputMode="numeric"
              placeholder="Contoh: 081234567890"
              value={formData.guestWa}
              onChange={(e) => setFormData({ ...formData, guestWa: e.target.value.replace(/[^0-9]/g, '') })}
            />

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold uppercase text-neutral-300">UNGGAH BUKTI TRANSFER / SCAN *</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                required
                className="w-full text-xs text-neutral-300 bg-neutral-900 p-2.5 rounded-lg border border-neutral-800 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-brand-blue file:text-black file:font-black file:text-xs"
              />
            </div>

            {/* Embedded S&K Rules Box */}
            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-black uppercase text-brand-blue tracking-wider block">SYARAT &amp; KETENTUAN (S&amp;K) PEMBELIAN:</label>
              <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800/80 space-y-1.5 text-[11px] text-neutral-300 font-medium leading-relaxed max-h-32 overflow-y-auto no-scrollbar">
                <p>1. <span className="font-bold text-white">Non-Refundable:</span> Tiket yang sudah dibeli tidak dapat dikembalikan / di-refund (kecuali acara resmi dibatalkan panitia).</p>
                <p>2. <span className="font-bold text-white">Direct Transfer:</span> Pembayaran ditransfer langsung ke rekening/QRIS panitia tanpa potongan pihak ketiga.</p>
                <p>3. <span className="font-bold text-white">Penukaran Tiket Fisik:</span> 1 QR Code tiket berlaku di pintu masuk venue sesuai jumlah tiket yang dibeli (bisa di-scan bertahap).</p>
                <p>4. <span className="font-bold text-white">Keabsahan Data:</span> Pastikan nomor WhatsApp aktif untuk penerimaan e-ticket resmi.</p>
              </div>

              {/* Custom Styled Cyber-Blue Checkbox Card */}
              <div
                onClick={() => setFormData({ ...formData, agreeTnC: !formData.agreeTnC })}
                className={`p-3 rounded-lg border flex items-center space-x-3 cursor-pointer transition-all duration-200 select-none ${
                  formData.agreeTnC
                    ? 'bg-brand-blue/15 border-brand-blue text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                    formData.agreeTnC
                      ? 'bg-brand-blue border-brand-blue text-black font-black'
                      : 'bg-neutral-950 border-neutral-700'
                  }`}
                >
                  {formData.agreeTnC && <CheckCircle2 className="w-4 h-4 stroke-[3] text-black" />}
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">
                  SAYA SUDAH MEMBACA &amp; MENYETUJUI S&amp;K DI ATAS
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center space-x-2 text-xs text-brand-red font-bold uppercase bg-red-950/40 p-3 rounded-lg border border-brand-red/50">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="blue"
              fullWidth
              size="lg"
              disabled={submitting}
              className="min-h-[48px] font-black tracking-wider uppercase text-xs sm:text-sm touch-press"
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin text-white" />
                  MEMPROSES & MENGUNGGAH...
                </span>
              ) : (
                'KIRIM BUKTI & AMANKAN TIKET'
              )}
            </Button>
          </Card>
        </form>
      </div>

      {showWaConfirmModal && (
        <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <Card variant="blue" className="w-full max-w-md p-6 bg-[#121212] border border-brand-blue/50 space-y-4 text-left shadow-[0_0_50px_rgba(6,182,212,0.3)]">
            <div className="flex items-center space-x-3 border-b border-neutral-800 pb-3">
              <Smartphone className="w-6 h-6 text-brand-blue shrink-0" />
              <h3 className="text-sm font-black uppercase text-white tracking-wider">KONFIRMASI NOMOR WHATSAPP</h3>
            </div>

            <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2 text-center">
              <p className="text-xs text-neutral-400 font-bold uppercase">NAMA PEMBELI: <span className="text-white">{formData.guestName}</span></p>
              <p className="text-xs text-neutral-400 font-bold uppercase">NOMOR WA YANG DITULIS:</p>
              <p className="text-2xl font-black font-mono text-brand-blue tracking-wider">{formData.guestWa}</p>
            </div>

            <div className="p-3 bg-brand-blue/10 border border-brand-blue/30 rounded text-xs text-neutral-300 font-medium leading-relaxed">
              ⚠️ <span className="font-bold text-brand-blue">PENTING:</span> Pastikan nomor di atas <span className="font-black text-white">SUDAH BENAR & AKTIF</span>. E-ticket resmi dan pemberitahuan persetujuan akan dikirimkan langsung ke nomor WhatsApp tersebut.
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowWaConfirmModal(false)}
                className="w-1/3 text-xs font-bold uppercase"
              >
                PERIKSA LAGI
              </Button>
              <Button
                type="button"
                variant="blue"
                onClick={handleFinalConfirmOrder}
                disabled={submitting}
                className="w-2/3 text-xs font-black uppercase justify-center py-3"
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin text-white" />
                    MEMPROSES...
                  </span>
                ) : (
                  'YA, NOMOR BENAR & PROSES'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Landmark, QrCode, Copy, AlertCircle } from 'lucide-react';
import { compressImageToWebP } from '../../utils/imageCompress';
import { uploadPaymentProof, createGuestOrder } from '../../services/apiOrders';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatRupiah } from '../../utils/formatters';

export const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const checkoutState = location.state;

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

  if (!checkoutState || !checkoutState.event) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <Card variant="dark" className="border-brand-red space-y-4">
          <p className="font-bold text-sm text-brand-red uppercase">TIDAK ADA DATA CHECKOUT. SILAKAN PILIH TIKET.</p>
          <Button variant="white" onClick={() => navigate('/')}>KEMBALI</Button>
        </Card>
      </div>
    );
  }

  const { event, selectedItems, totalAmount, totalItems } = checkoutState;
  const paymentDetails = event.payment_details || {};

  const handleCopyAccount = () => {
    if (paymentDetails.number) {
      navigator.clipboard.writeText(paymentDetails.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProofFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.agreeTnC) {
      setErrorMsg('Anda wajib menyetujui Syarat & Ketentuan platform.');
      return;
    }
    if (!proofFile) {
      setErrorMsg('Silakan unggah foto bukti transfer pembayaran.');
      return;
    }

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
      setCompletedOrder(newOrder);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memproses transaksi. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (completedOrder) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-left space-y-6">
        <Card variant="blue" className="space-y-4 p-8 border border-brand-blue/40">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-8 h-8 text-brand-blue" />
            <div>
              <h1 className="text-2xl font-black uppercase text-white">TIKET DIAMANKAN!</h1>
              <p className="text-xs font-bold text-neutral-300 uppercase">PESANAN TERKIRIM KE PANITIA EVENT.</p>
            </div>
          </div>
          <p className="text-xs font-semibold text-neutral-300">
            Status pesanan saat ini: <Badge variant="purple">MENUNGGU VERIFIKASI BUKTI</Badge>
          </p>
          <div className="p-4 bg-neutral-950 rounded-md border border-neutral-800 space-y-1 text-xs font-bold">
            <p className="text-neutral-400">ID PESANAN: <span className="text-brand-blue font-mono">{completedOrder.id}</span></p>
            <p className="text-neutral-400">TOTAL BAYAR: <span className="text-brand-yellow">{formatRupiah(totalAmount)}</span></p>
          </div>
          <Button variant="blue" fullWidth onClick={() => navigate('/')}>
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
                  <div className="w-48 h-48 sm:w-56 sm:h-56 mx-auto bg-white p-2 rounded-lg border border-neutral-700 overflow-hidden shadow-md">
                    <img src={paymentDetails.qris_url} alt="QRIS Panitia" className="w-full h-full object-contain" />
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
              placeholder="Contoh: 081234567890"
              value={formData.guestWa}
              onChange={(e) => setFormData({ ...formData, guestWa: e.target.value })}
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

            <div className="flex items-start space-x-2.5 pt-2">
              <input
                type="checkbox"
                id="tnc"
                checked={formData.agreeTnC}
                onChange={(e) => setFormData({ ...formData, agreeTnC: e.target.checked })}
                className="mt-0.5 w-5 h-5 text-brand-blue bg-neutral-900 border-neutral-700 rounded focus:ring-brand-blue cursor-pointer shrink-0"
              />
              <label htmlFor="tnc" className="text-xs text-neutral-400 font-medium leading-normal cursor-pointer select-none">
                Saya menyetujui <Link to="/terms" target="_blank" className="text-brand-blue font-bold underline">Syarat &amp; Ketentuan (S&amp;K)</Link> LokTik.
              </label>
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
              {submitting ? 'MEMPROSES & MENGUNGGAH...' : 'KIRIM BUKTI & AMANKAN TIKET'}
            </Button>
          </Card>
        </form>
      </div>
    </div>
  );
};

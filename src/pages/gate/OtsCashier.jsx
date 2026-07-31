import React, { useState, useEffect } from 'react';
import { Banknote, QrCode, Zap, RefreshCw } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { createGuestOrder } from '../../services/apiOrders';
import { formatRupiah } from '../../utils/formatters';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';

export const OtsCashier = ({ eventId }) => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [qty, setQty] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchCategories = async () => {
    if (!eventId) return;
    try {
      const { data } = await supabase.from('ticket_categories').select('*').eq('event_id', eventId);
      setCategories(data || []);
      if (data && data.length > 0) setSelectedCatId(data[0].id);
    } catch (e) {
      console.warn('Gagal memuat kategori tiket:', e);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [eventId]);

  const selectedCat = categories.find((c) => c.id === selectedCatId) || categories[0];
  const unitPrice = selectedCat ? parseFloat(selectedCat.price) : 0;
  const totalPrice = unitPrice * qty;

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: `${cat.name.toUpperCase()} — ${formatRupiah(cat.price)} ${cat.quota !== null ? `(SISA: ${cat.quota})` : '(UNLIMITED)'}`,
  }));

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

  const handleSubmitOts = async (e) => {
    if (e) e.preventDefault();
    if (submitting) return;
    if (!selectedCat) return showToast('Silakan pilih kategori tiket!', 'staff');

    try {
      setSubmitting(true);
      await verifyStaffActive();
      setSuccessMsg(null);

      const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const orderPayload = {
        event_id: eventId,
        guest_name: `Pembeli OTS (${paymentMethod === 'QRIS' ? 'QRIS/TF' : 'CASH'})`,
        guest_wa: '080000000000',
        guest_ig: 'OTS Venue',
        total_price: totalPrice,
        payment_proof_url: 'OTS_CASHIER_DIRECT',
        status: 'paid',
        is_ots: true,
      };

      const orderItems = [
        {
          categoryId: selectedCat.id,
          categoryName: selectedCat.name,
          quantity: qty,
          isScanned: true,
        },
      ];

      await createGuestOrder(orderPayload, orderItems);

      const succMsg = `BERHASIL! ${qty} TIKET '${selectedCat.name.toUpperCase()}' LUNAS (${paymentMethod}). TIKET FISIK DISERAHKAN.`;
      setSuccessMsg(succMsg);
      showToast(succMsg, 'staff');
      setQty(1);
    } catch (err) {
      showToast(err.message || 'Gagal memproses transaksi OTS.', 'staff');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 text-left font-sans">
      <Card variant="dark" className="p-5 border-neutral-800 space-y-4">
        <div className="border-b border-neutral-800 pb-3 flex items-center justify-between">
          <span className="text-base font-black uppercase text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand-purple fill-brand-purple" /> KASIR CEPAT OTS VENUE
          </span>
          <Badge variant="purple" className="text-[9px] px-2 py-0.5">FAST ISSUE</Badge>
        </div>

        {successMsg && (
          <div className="p-4 bg-brand-purple/10 text-brand-purple font-bold text-xs border border-brand-purple/40 rounded flex items-center justify-between">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)} className="underline cursor-pointer">OK</button>
          </div>
        )}

        <form onSubmit={handleSubmitOts} className="space-y-4">
          {/* Ticket Category 1-Tap Selectable Cards */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">PILIH KATEGORI TIKET:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {categories.map((cat) => {
                const isSelected = selectedCatId === cat.id;
                const isSoldOut = cat.quota !== null && cat.quota !== undefined && cat.quota <= 0;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    disabled={isSoldOut}
                    onClick={() => setSelectedCatId(cat.id)}
                    className={`p-3 rounded-lg border text-left transition-all duration-150 relative cursor-pointer ${
                      isSelected
                        ? 'bg-brand-purple/20 border-brand-purple text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] ring-1 ring-brand-purple'
                        : isSoldOut
                        ? 'bg-neutral-900/50 border-neutral-800 text-neutral-600 opacity-50 cursor-not-allowed'
                        : 'bg-[#181818] border-neutral-800 text-neutral-300 hover:border-neutral-600 hover:text-white'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-black uppercase tracking-wider truncate text-white">{cat.name}</span>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isSoldOut ? 'bg-red-950/60 text-brand-red' : 'bg-neutral-900 text-brand-purple border border-brand-purple/30'
                      }`}>
                        {cat.quota !== null && cat.quota !== undefined ? `SISA: ${cat.quota}` : 'UNLIMITED'}
                      </span>
                    </div>
                    <div className="text-sm font-mono font-black text-brand-yellow">
                      {formatRupiah(cat.price)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">JUMLAH TIKET (QTY):</label>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-12 h-12 bg-neutral-900 text-white font-black text-2xl border border-neutral-800 rounded hover:bg-neutral-800 cursor-pointer"
              >
                -
              </button>
              <span className="flex-1 py-2.5 bg-[#181818] text-brand-purple font-mono font-black text-2xl border border-neutral-800 rounded text-center">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(20, q + 1))}
                className="w-12 h-12 bg-neutral-900 text-white font-black text-2xl border border-neutral-800 rounded hover:bg-neutral-800 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">METODE PEMBAYARAN:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`py-3 rounded font-black text-xs uppercase border transition-colors flex items-center justify-center space-x-2 cursor-pointer ${
                  paymentMethod === 'CASH'
                    ? 'bg-brand-purple text-white border-brand-purple font-black'
                    : 'bg-[#181818] text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                <Banknote className="w-4 h-4" /> <span>TUNAI (CASH)</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('QRIS')}
                className={`py-3 rounded font-black text-xs uppercase border transition-colors flex items-center justify-center space-x-2 cursor-pointer ${
                  paymentMethod === 'QRIS'
                    ? 'bg-brand-purple text-white border-brand-purple font-black'
                    : 'bg-[#181818] text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4" /> <span>QRIS / TF</span>
              </button>
            </div>
          </div>

          {/* Total Summary & Submit */}
          <div className="p-4 bg-[#181818] rounded border border-neutral-800 space-y-3">
            <div className="flex justify-between items-center text-xs font-black uppercase text-neutral-400">
              <span>TOTAL BAYAR:</span>
              <span className="text-xl font-mono font-black text-brand-purple">{formatRupiah(totalPrice)}</span>
            </div>
            <Button
              type="submit"
              variant="purple"
              fullWidth
              disabled={submitting}
              className="py-3 text-sm font-black justify-center"
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin text-white" />
                  MEMPROSES TRANSAKSI...
                </span>
              ) : (
                'KONFIRMASI BAYAR'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

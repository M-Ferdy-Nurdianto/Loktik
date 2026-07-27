import React, { useState, useEffect } from 'react';
import { Banknote, QrCode, Zap } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { createGuestOrder } from '../../services/apiOrders';
import { formatRupiah } from '../../utils/formatters';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const OtsCashier = ({ eventId }) => {
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

  const handleSubmitOts = async (e) => {
    e.preventDefault();
    if (!selectedCat) return alert('Silakan pilih kategori tiket!');

    try {
      setSubmitting(true);
      setSuccessMsg(null);

      const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const orderPayload = {
        event_id: eventId,
        guest_name: `Pembeli OTS (${paymentMethod}) ${timestamp}`,
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

      setSuccessMsg(`BERHASIL! 🎟️ ${qty} TIKET '${selectedCat.name.toUpperCase()}' LUNAS (${paymentMethod}). GELANG DISERAHKAN.`);
      setQty(1);
    } catch (err) {
      alert(err.message || 'Gagal memproses transaksi OTS.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 text-left font-sans">
      <Card variant="dark" className="p-5 border-neutral-800 space-y-4">
        <div className="border-b border-neutral-800 pb-3 flex items-center justify-between">
          <span className="text-base font-black uppercase text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand-yellow fill-brand-yellow" /> KASIR CEPAT OTS VENUE
          </span>
          <Badge variant="yellow" className="text-[9px] px-2 py-0.5">FAST ISSUE</Badge>
        </div>

        {successMsg && (
          <div className="p-4 bg-brand-green/10 text-brand-green font-bold text-xs border border-brand-green/40 rounded flex items-center justify-between">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)} className="underline cursor-pointer">OK</button>
          </div>
        )}

        <form onSubmit={handleSubmitOts} className="space-y-4">
          {/* Ticket Category Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">PILIH KATEGORI TIKET:</label>
            <select
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              className="w-full p-3 bg-[#181818] text-white font-bold text-sm border border-neutral-800 rounded uppercase focus:outline-none focus:border-brand-yellow"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name.toUpperCase()} — {formatRupiah(cat.price)} {cat.quota !== null ? `(SISA: ${cat.quota})` : '(UNLIMITED)'}
                </option>
              ))}
            </select>
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
              <span className="flex-1 py-2.5 bg-[#181818] text-brand-yellow font-mono font-black text-2xl border border-neutral-800 rounded text-center">
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
                    ? 'bg-brand-green text-black border-brand-green font-black'
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
                <QrCode className="w-4 h-4" /> <span>QRIS BENDAHARA</span>
              </button>
            </div>
          </div>

          {/* Total Summary & Submit */}
          <div className="p-4 bg-[#181818] rounded border border-neutral-800 space-y-3">
            <div className="flex justify-between items-center text-xs font-black uppercase text-neutral-400">
              <span>TOTAL BAYAR:</span>
              <span className="text-xl font-mono font-black text-brand-green">{formatRupiah(totalPrice)}</span>
            </div>
            <Button
              type="submit"
              variant="yellow"
              fullWidth
              disabled={submitting}
              className="py-3 text-sm font-black justify-center text-black"
            >
              {submitting ? 'MEMPROSES...' : '⚡ LUNAS & CETAK GELANG (OTS)'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

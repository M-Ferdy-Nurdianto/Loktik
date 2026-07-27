import React, { useState, useEffect } from 'react';
import { Banknote, QrCode, Plus, Minus, Ticket, CheckCircle2, Zap } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { createGuestOrder } from '../../services/apiOrders';
import { formatRupiah } from '../../utils/formatters';

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
          isScanned: true, // Auto-issue wristband at OTS Cashier
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
      {/* Fast Input Form Card */}
      <div className="bg-white p-5 border-4 border-black shadow-[6px_6px_0px_#000] space-y-4">
        <div className="border-b-4 border-black pb-3 flex items-center justify-between">
          <span className="text-lg font-black uppercase tracking-tight text-black flex items-center gap-2">
            <Zap className="w-6 h-6 text-[#FFE600] fill-[#FFE600] stroke-black stroke-[2]" /> KASIR CEPAT OTS VENUE
          </span>
          <span className="bg-black text-white px-2 py-0.5 text-[10px] font-black uppercase">FAST ISSUE</span>
        </div>

        {successMsg && (
          <div className="p-4 bg-[#00CC00] text-black font-black text-xs border-4 border-black shadow-[3px_3px_0px_#000] flex items-center justify-between">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)} className="px-2 py-0.5 bg-black text-white font-black text-xs uppercase cursor-pointer">OK</button>
          </div>
        )}

        <form onSubmit={handleSubmitOts} className="space-y-4">
          {/* Ticket Category Dropdown */}
          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-black block">PILIH KATEGORI TIKET:</label>
            <select
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              className="w-full p-3 bg-[#F4F4F4] text-black font-black text-base border-4 border-black uppercase focus:outline-none focus:bg-white"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name.toUpperCase()} — {formatRupiah(cat.price)} {cat.quota !== null ? `(SISA: ${cat.quota})` : '(UNLIMITED)'}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity Selector */}
          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-black block">JUMLAH TIKET (QTY):</label>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-14 h-14 bg-[#FF3333] text-white font-black text-2xl border-4 border-black shadow-[3px_3px_0px_#000] cursor-pointer"
              >
                -
              </button>
              <span className="flex-1 py-2 bg-[#F4F4F4] text-black font-mono font-black text-3xl border-4 border-black text-center">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(20, q + 1))}
                className="w-14 h-14 bg-[#39FF14] text-black font-black text-2xl border-4 border-black shadow-[3px_3px_0px_#000] cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-black block">METODE PEMBAYARAN:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`py-3 font-black text-sm uppercase border-4 border-black flex items-center justify-center space-x-2 ${paymentMethod === 'CASH' ? 'bg-[#39FF14] text-black shadow-[4px_4px_0px_#000]' : 'bg-[#F4F4F4] text-black'}`}
              >
                <Banknote className="w-5 h-5" /> <span>TUNAI (CASH)</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('QRIS')}
                className={`py-3 font-black text-sm uppercase border-4 border-black flex items-center justify-center space-x-2 ${paymentMethod === 'QRIS' ? 'bg-[#8B5CF6] text-white shadow-[4px_4px_0px_#000]' : 'bg-[#F4F4F4] text-black'}`}
              >
                <QrCode className="w-5 h-5" /> <span>QRIS BENDAHARA</span>
              </button>
            </div>
          </div>

          {/* Total Summary & Submit */}
          <div className="p-4 bg-black text-white border-4 border-black space-y-3">
            <div className="flex justify-between items-center text-sm font-black uppercase">
              <span>TOTAL BAYAR:</span>
              <span className="text-2xl font-mono text-[#39FF14]">{formatRupiah(totalPrice)}</span>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-[#FFE600] hover:bg-[#ebd300] text-black font-black text-base uppercase border-4 border-black shadow-[4px_4px_0px_#000] cursor-pointer"
            >
              {submitting ? 'MEMPROSES...' : '⚡ LUNAS & CETAK GELANG (OTS)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

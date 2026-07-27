import React, { useState, useEffect } from 'react';
import { Ticket, DollarSign, Banknote, QrCode, Plus, Minus, Zap, Calendar, RefreshCw, AlertCircle, CheckCircle2, TrendingUp, History } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { getAllEventsForEo } from '../../services/apiEvents';
import { createGuestOrder, getLiveOrdersForEo } from '../../services/apiOrders';
import { formatRupiah } from '../../utils/formatters';

export const OtsCashierTab = () => {
  const { user } = useAuth();
  const eoUsername = user?.username || user?.name || 'eo_lokal';

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [categoryName, setCategoryName] = useState('Tiket OTS Normal');
  const [ticketPrice, setTicketPrice] = useState(60000);
  const [qty, setQty] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [submitting, setSubmitting] = useState(false);
  const [otsOrders, setOtsOrders] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [liveEvents, allOrders] = await Promise.all([
        getAllEventsForEo(eoUsername),
        getLiveOrdersForEo(eoUsername),
      ]);
      setEvents(liveEvents);
      if (liveEvents.length > 0 && !selectedEventId) {
        setSelectedEventId(liveEvents[0].id);
      }
      const otsOnly = allOrders.filter((o) => o.guest_name.startsWith('Pembeli OTS'));
      setOtsOrders(otsOnly);
    } catch (e) {
      console.warn('Gagal memuat data kasir OTS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [eoUsername]);

  const currentEvent = events.find((e) => e.id === selectedEventId) || events[0];
  const totalPrice = (parseFloat(ticketPrice) || 0) * qty;

  // Calculate Live OTS Sales Metrics
  const filteredOts = otsOrders.filter((o) => !selectedEventId || o.event_id === selectedEventId);
  const totalOtsRevenue = filteredOts.reduce((sum, o) => sum + (o.total_price || 0), 0);
  const totalOtsTickets = filteredOts.length;
  const cashOtsCount = filteredOts.filter((o) => o.guest_name.includes('CASH')).length;
  const qrisOtsCount = filteredOts.filter((o) => o.guest_name.includes('QRIS')).length;

  const handleIncrement = () => setQty((prev) => Math.min(prev + 1, 20));
  const handleDecrement = () => setQty((prev) => Math.max(prev - 1, 1));

  const handleFastIssueTicket = async (e) => {
    e.preventDefault();
    if (!ticketPrice || !currentEvent) return;

    try {
      setSubmitting(true);

      const orderPayload = {
        event_id: currentEvent.id,
        guest_name: `Pembeli OTS (${paymentMethod})`,
        guest_wa: `08000000000`,
        total_price: totalPrice,
        status: 'paid',
      };

      const items = [
        {
          categoryId: null,
          categoryName,
          quantity: qty,
          price: parseFloat(ticketPrice),
          isScanned: true,
        },
      ];

      await createGuestOrder(orderPayload, items);
      setQty(1);
      fetchData(); // Refresh summary metrics & history
    } catch (err) {
      alert(err.message || 'Gagal mencatat transaksi OTS.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
      {/* LEFT PANEL: CASHIER CONTROL PANEL */}
      <Card variant="dark" className="p-6 space-y-6 border-neutral-800">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
          <div>
            <h3 className="text-lg font-black uppercase text-white">KASIR OTS VENUE (LANGSUNG GELANG)</h3>
            <p className="text-xs text-neutral-400">Pembayaran tunai/QRIS &rarr; Langsung serahkan gelang fisik di kasir.</p>
          </div>
          <Badge variant="green">DIRECT WRISTBAND</Badge>
        </div>

        <div className="p-3 bg-neutral-900 rounded-md border border-neutral-800 space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black uppercase text-brand-yellow tracking-wider flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>PILIH EVENT AKTIF:</span>
            </label>
            <button type="button" onClick={fetchData} className="text-[10px] text-neutral-400 hover:text-brand-green flex items-center space-x-1">
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>REFRESH</span>
            </button>
          </div>

          {loading ? (
            <p className="text-xs text-neutral-400 font-mono">Memuat daftar event live dari DB...</p>
          ) : events.length === 0 ? (
            <div className="p-3 bg-neutral-950 rounded text-xs text-brand-yellow font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Belum ada event di DB. Buat event terlebih dahulu di menu "Buat Event Baru".</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {events.map((evt) => (
                <button
                  key={evt.id}
                  type="button"
                  onClick={() => setSelectedEventId(evt.id)}
                  className={`px-3 py-1.5 rounded text-xs font-black uppercase border transition-all ${
                    selectedEventId === evt.id
                      ? 'bg-brand-green text-black border-brand-green shadow-[0_0_10px_rgba(57,255,20,0.3)]'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  🎯 {evt.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleFastIssueTicket} className="space-y-4">
          <div className="p-4 bg-neutral-900/90 rounded-md border border-neutral-800 space-y-3">
            <span className="text-[11px] font-black uppercase text-brand-green tracking-wider flex items-center space-x-1">
              <DollarSign className="w-3.5 h-3.5" />
              <span>SETTING NAMA &amp; HARGA TIKET OTS</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="NAMA TIKET OTS" required value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
              <Input label="HARGA TIKET (RP)" type="number" required value={ticketPrice} onChange={(e) => setTicketPrice(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-neutral-300">JUMLAH TIKET</label>
              <div className="flex items-center space-x-2 bg-neutral-900 p-1.5 rounded-md border border-neutral-700">
                <button type="button" onClick={handleDecrement} className="w-10 h-10 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white font-black text-lg rounded flex items-center justify-center transition-transform">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="flex-1 text-center font-mono font-black text-xl text-brand-green">{qty}</span>
                <button type="button" onClick={handleIncrement} className="w-10 h-10 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white font-black text-lg rounded flex items-center justify-center transition-transform">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-neutral-300">METODE BAYAR *</label>
              <div className="grid grid-cols-2 gap-2 h-11">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`rounded-md text-xs font-black uppercase flex items-center justify-center space-x-1 border transition-all ${
                    paymentMethod === 'CASH'
                      ? 'bg-brand-green text-black border-brand-green shadow-[0_0_10px_rgba(57,255,20,0.3)]'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>CASH</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('QRIS')}
                  className={`rounded-md text-xs font-black uppercase flex items-center justify-center space-x-1 border transition-all ${
                    paymentMethod === 'QRIS'
                      ? 'bg-brand-purple text-white border-brand-purple shadow-[0_0_10px_rgba(139,92,246,0.3)]'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QRIS</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-neutral-900 rounded-md border border-neutral-800 flex justify-between items-center">
            <span className="text-xs font-extrabold text-neutral-300 uppercase">TOTAL PEMBAYARAN:</span>
            <span className="text-2xl font-black text-brand-green">{formatRupiah(totalPrice)}</span>
          </div>

          <Button type="submit" variant="green" fullWidth size="lg" disabled={submitting || events.length === 0} className="h-12 text-sm">
            <Zap className="w-4 h-4 mr-2" /> {submitting ? 'MEMPROSES TRANSAKSI...' : '🎟️ TRANSAKSI OTS & SERAHKAN GELANG'}
          </Button>
        </form>
      </Card>

      {/* RIGHT PANEL: TOTAL PENJUALAN OTS SUMMARY */}
      <Card variant="dark" className="p-6 space-y-6 border-neutral-800">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
          <h3 className="text-lg font-black uppercase text-white flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-brand-green inline mr-1" />
            <span>TOTAL PENJUALAN OTS (REALTIME)</span>
          </h3>
          <Badge variant="yellow">SUMMARY OTS</Badge>
        </div>

        {/* METRICS STAT CARDS */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-neutral-900 rounded-md border border-neutral-800 space-y-1">
            <p className="text-[10px] font-bold text-neutral-400 uppercase">TOTAL REKAP DANA OTS</p>
            <p className="text-2xl font-black text-brand-green">{formatRupiah(totalOtsRevenue)}</p>
            <p className="text-[10px] text-neutral-500 font-mono">Tunai &amp; QRIS Masuk Kasir</p>
          </div>

          <div className="p-4 bg-neutral-900 rounded-md border border-neutral-800 space-y-1">
            <p className="text-[10px] font-bold text-neutral-400 uppercase">TOTAL TIKET TERJUAL</p>
            <p className="text-2xl font-black text-brand-yellow font-mono">{totalOtsTickets} <span className="text-xs font-normal text-white">Transaksi</span></p>
            <p className="text-[10px] text-neutral-500 font-mono">Gelang Diserahkan</p>
          </div>
        </div>

        {/* PAYMENT METHOD BREAKDOWN */}
        <div className="p-4 bg-neutral-900/80 rounded-md border border-neutral-800 space-y-3">
          <p className="text-[11px] font-black text-white uppercase tracking-wider">RINCIAN METODE PEMBAYARAN KASIR:</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-neutral-950 rounded border border-neutral-800 flex justify-between items-center">
              <span className="text-xs font-bold text-brand-green flex items-center space-x-1">
                <Banknote className="w-3.5 h-3.5" />
                <span>CASH:</span>
              </span>
              <span className="text-sm font-mono font-black text-white">{cashOtsCount} Transaksi</span>
            </div>

            <div className="p-3 bg-neutral-950 rounded border border-neutral-800 flex justify-between items-center">
              <span className="text-xs font-bold text-brand-purple flex items-center space-x-1">
                <QrCode className="w-3.5 h-3.5" />
                <span>QRIS:</span>
              </span>
              <span className="text-sm font-mono font-black text-white">{qrisOtsCount} Transaksi</span>
            </div>
          </div>
        </div>

        {/* RECENT OTS TRANSACTIONS LOG */}
        <div className="space-y-3">
          <p className="text-xs font-black text-white uppercase flex items-center space-x-1">
            <History className="w-4 h-4 text-brand-blue" />
            <span>RIWAYAT TRANSAKSI OTS TERBARU</span>
          </p>

          {filteredOts.length === 0 ? (
            <div className="py-8 text-center space-y-1 bg-neutral-900/50 rounded-md border border-neutral-800">
              <p className="text-xs font-bold text-neutral-500 uppercase">BELUM ADA TRANSAKSI OTS UNTUK EVENT INI</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar">
              {filteredOts.slice(0, 5).map((o) => (
                <div key={o.id} className="p-3 bg-neutral-900 rounded-md border border-neutral-800 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-white uppercase">{o.guest_name}</p>
                    <p className="text-[10px] font-mono text-neutral-400">ID: {o.id.substring(0, 8)}...</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="font-black text-brand-green">{formatRupiah(o.total_price)}</p>
                    <Badge variant={o.guest_name.includes('CASH') ? 'green' : 'purple'} className="text-[9px]">
                      {o.guest_name.includes('CASH') ? 'CASH' : 'QRIS'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

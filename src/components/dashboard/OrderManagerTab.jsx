import React, { useState, useEffect, useRef } from 'react';
import { Check, X, MessageSquare, Inbox, RefreshCw, Eye, Send, Bot, Banknote, ShoppingBag, Clock, Filter, Layers, ChevronDown, ChevronUp, Sparkles, Key } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { getLiveOrdersForEo, updateOrderStatus } from '../../services/apiOrders';
import { getAllEventsForEo } from '../../services/apiEvents';
import { formatRupiah, formatDateTime, generatePrettyRedeemCode } from '../../utils/formatters';

export const OrderManagerTab = () => {
  const { user } = useAuth();
  const eoUsername = user?.username || user?.name || 'eo_lokal';

  const [orders, setOrders] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('ALL');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [previewProofUrl, setPreviewProofUrl] = useState(null);
  const [botStatus, setBotStatus] = useState('checking');

  const dropdownRef = useRef(null);
  const botServerUrl = import.meta.env.VITE_WA_BOT_URL || 'http://localhost:5000';

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [ordersData, eventsData] = await Promise.all([
        getLiveOrdersForEo(eoUsername),
        getAllEventsForEo(eoUsername),
      ]);
      setOrders(ordersData);
      setEvents(eventsData);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memuat data dari DB.');
    } finally {
      setLoading(false);
    }
  };

  const checkBotStatus = async () => {
    try {
      const res = await fetch(`${botServerUrl}/api/status`);
      if (res.ok) {
        const data = await res.json();
        setBotStatus(data.botState === 'connected' ? 'online' : 'connecting');
      } else {
        setBotStatus('offline');
      }
    } catch (e) {
      setBotStatus('offline');
    }
  };

  useEffect(() => {
    fetchData();
    checkBotStatus();

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [eoUsername]);

  const filteredOrders = selectedEventId === 'ALL'
    ? orders
    : orders.filter((o) => o.event_id === selectedEventId);

  const poOrders = filteredOrders.filter((o) => !o.guest_name.startsWith('Pembeli OTS'));
  const otsOrders = filteredOrders.filter((o) => o.guest_name.startsWith('Pembeli OTS'));

  const selectedEventObj = events.find((e) => e.id === selectedEventId);

  const sendManualWhatsAppMessage = (order) => {
    const waNumber = order.guest_wa.replace(/[^0-9]/g, '');
    const cleanNumber = waNumber.startsWith('0') ? `62${waNumber.substring(1)}` : waNumber;
    const eventName = order.events?.name || 'Event LokTik';
    const seed = parseInt(order.id.replace(/[^0-9]/g, '').substring(0, 4) || '1029');
    const prettyCode = generatePrettyRedeemCode(eventName, seed);
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${prettyCode}`;

    const messageText = `Halo Kak *${order.guest_name}*,

Tiket pesanan Anda untuk event *${eventName}* telah *LUNAS & DIVERIFIKASI!* 🎉

📋 *DETAIL TIKET:*
- Kode Tiket / Barcode: *${prettyCode}*
- Total Bayar: ${formatRupiah(order.total_price)}
- Status: LUNAS (Verified)

🔗 *LINK QR CODE BARCODE TIKET ANDA:*
${qrImageUrl}

Silakan sebutkan Kode *${prettyCode}* atau tunjukkan gambar QR Code di atas pada pintu masuk venue saat penukaran gelang.

Terima Kasih!
- Panitia ${eventName} via LokTik.web.id`;

    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(messageText)}`, '_blank');
  };

  const sendAutoTicketViaBot = async (order) => {
    const waNumber = order.guest_wa.replace(/[^0-9]/g, '');
    const eventName = order.events?.name || 'Event LokTik';
    const seed = parseInt(order.id.replace(/[^0-9]/g, '').substring(0, 4) || '1029');
    const prettyCode = generatePrettyRedeemCode(eventName, seed);
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${prettyCode}`;

    try {
      const response = await fetch(`${botServerUrl}/api/send-ticket-wa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waNumber,
          guestName: order.guest_name,
          eventName,
          orderId: prettyCode,
          totalPrice: order.total_price,
          ticketQrUrl: qrImageUrl,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert(`Tiket Kode ${prettyCode} & QR Code otomatis terkirim via WA ke ${order.guest_name}!`);
        return true;
      }
    } catch (e) {
      console.warn('Bot WA offline, mengalihkan ke WA Manual...');
    }

    sendManualWhatsAppMessage(order);
  };

  const handleApprove = async (order, mode = 'bot') => {
    try {
      await updateOrderStatus(order.id, 'paid');
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: 'paid' } : o))
      );

      if (mode === 'bot') {
        sendAutoTicketViaBot(order);
      } else {
        sendManualWhatsAppMessage(order);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReject = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'need_reupload');
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'need_reupload' } : o))
      );
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {previewProofUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg max-w-lg w-full space-y-3 text-center">
            <h4 className="text-xs font-black uppercase text-brand-green">BUKTI TRANSFER PEMBELI</h4>
            <div className="max-h-96 overflow-y-auto bg-black rounded p-2">
              <img src={previewProofUrl} alt="Bukti Transfer" className="w-full h-auto object-contain mx-auto" />
            </div>
            <Button variant="white" size="sm" onClick={() => setPreviewProofUrl(null)}>TUTUP PREVIEW</Button>
          </div>
        </div>
      )}

      {/* CUSTOM STYLED DROPDOWN FILTER BAR */}
      <Card variant="dark" className="p-4 border-neutral-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 overflow-visible relative z-30">
        <div className="flex flex-col space-y-1.5 w-full sm:w-auto">
          <label className="text-[10px] font-black uppercase text-brand-yellow tracking-wider flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span>FILTER EVENT PESANAN (AKUN: {eoUsername}):</span>
          </label>

          <div className="relative w-full sm:w-80" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-4 py-2.5 bg-[#181818] border-2 border-brand-green/60 rounded-md text-xs font-black text-white uppercase flex items-center justify-between shadow-[0_0_15px_rgba(57,255,20,0.15)] hover:border-brand-green transition-all"
            >
              <div className="flex items-center space-x-2 truncate">
                {selectedEventId === 'ALL' ? (
                  <>
                    <Layers className="w-4 h-4 text-brand-green shrink-0" />
                    <span className="truncate">🌐 SEMUA EVENT ({orders.length} PESANAN)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-brand-yellow shrink-0" />
                    <span className="truncate">🎯 {selectedEventObj?.name || 'EVENT DILAYANI'}</span>
                  </>
                )}
              </div>
              {isDropdownOpen ? <ChevronUp className="w-4 h-4 text-brand-green" /> : <ChevronDown className="w-4 h-4 text-brand-green" />}
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#121212] border-2 border-brand-green rounded-md shadow-[0_15px_30px_rgba(0,0,0,0.9)] overflow-hidden z-50 py-1 divide-y divide-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEventId('ALL');
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-xs font-black uppercase text-left flex items-center justify-between transition-colors ${
                    selectedEventId === 'ALL'
                      ? 'bg-brand-green text-black font-extrabold'
                      : 'text-white hover:bg-brand-green/20 hover:text-brand-green'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <Layers className="w-4 h-4" />
                    <span>🌐 SEMUA EVENT ({orders.length} PESANAN)</span>
                  </span>
                  {selectedEventId === 'ALL' && <Check className="w-4 h-4" />}
                </button>

                {events.map((evt) => {
                  const evtCount = orders.filter((o) => o.event_id === evt.id).length;
                  const isSelected = selectedEventId === evt.id;
                  return (
                    <button
                      key={evt.id}
                      type="button"
                      onClick={() => {
                        setSelectedEventId(evt.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-xs font-black uppercase text-left flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-brand-yellow text-black font-extrabold'
                          : 'text-white hover:bg-brand-yellow/20 hover:text-brand-yellow'
                      }`}
                    >
                      <span className="flex items-center space-x-2 truncate">
                        <span>🎯 {evt.name}</span>
                      </span>
                      <span className="flex items-center space-x-2">
                        <Badge variant={isSelected ? 'white' : 'yellow'} className="text-[9px]">
                          {evtCount} PESANAN
                        </Badge>
                        {isSelected && <Check className="w-4 h-4" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant={botStatus === 'online' ? 'green' : 'yellow'}>
            <Bot className="w-3 h-3 mr-1 inline" />
            {botStatus === 'online' ? 'BOT WA ONLINE' : 'BOT WA STANDBY'}
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} /> REFRESH DB
          </Button>
        </div>
      </Card>

      {/* TABLE 1: PRE-ORDER (PO) ONLINE BUYER ORDERS */}
      <Card variant="dark" className="p-6 space-y-6 border-neutral-800">
        <div className="border-b border-neutral-800 pb-3">
          <h3 className="text-lg font-black uppercase text-white flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-brand-green inline mr-1" />
            <span>1. DAFTAR PESANAN ONLINE (PRE-ORDER / PO)</span>
          </h3>
          <p className="text-xs text-neutral-400">Verifikasi bukti transfer &amp; kirim tiket ke pembeli online website.</p>
        </div>

        {errorMsg && (
          <p className="text-xs text-brand-red font-bold uppercase bg-red-950/40 p-3 rounded-md border border-brand-red/40">
            ⚠️ {errorMsg}
          </p>
        )}

        {loading ? (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-brand-green animate-spin mx-auto" />
            <p className="text-xs font-bold text-neutral-400 uppercase">MEMUAT PESANAN ONLINE...</p>
          </div>
        ) : poOrders.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Inbox className="w-10 h-10 text-neutral-600 mx-auto" />
            <p className="font-extrabold text-xs text-neutral-400 uppercase">BELUM ADA PESANAN ONLINE (PO)</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-900 text-neutral-400 font-bold uppercase border-b border-neutral-800">
                <tr>
                  <th className="p-3">KODE TIKET</th>
                  <th className="p-3">NAMA PEMBELI</th>
                  <th className="p-3">WHATSAPP</th>
                  <th className="p-3">TOTAL</th>
                  <th className="p-3">BUKTI BAYAR</th>
                  <th className="p-3">STATUS BAYAR</th>
                  <th className="p-3">STATUS TIKET (GATE)</th>
                  <th className="p-3 text-right">AKSI VERIFIKASI &amp; WA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 font-medium text-neutral-200">
                {poOrders.map((o) => {
                  const hasScannedTicket = o.tickets && o.tickets.some((t) => t.is_scanned);
                  const seed = parseInt(o.id.replace(/[^0-9]/g, '').substring(0, 4) || '1029');
                  const prettyCode = generatePrettyRedeemCode(o.events?.name, seed);
                  return (
                    <tr key={o.id} className="hover:bg-neutral-900/50">
                      <td className="p-3 font-mono font-black text-brand-green text-sm flex items-center space-x-1">
                        <Key className="w-3.5 h-3.5 text-brand-green shrink-0" />
                        <span>{prettyCode}</span>
                      </td>
                      <td className="p-3 font-bold text-white">{o.guest_name}</td>
                      <td className="p-3">
                        <a
                          href={`https://wa.me/${o.guest_wa.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 text-brand-blue hover:underline font-mono"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{o.guest_wa}</span>
                        </a>
                      </td>
                      <td className="p-3 font-bold text-white">{formatRupiah(o.total_price)}</td>
                      <td className="p-3">
                        {o.payment_proof_url ? (
                          <button
                            type="button"
                            onClick={() => setPreviewProofUrl(o.payment_proof_url)}
                            className="text-brand-purple hover:underline font-bold flex items-center space-x-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>LIHAT BUKTI</span>
                          </button>
                        ) : (
                          <span className="text-neutral-500">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant={o.status === 'paid' ? 'green' : o.status === 'need_reupload' ? 'red' : 'yellow'}>
                          {o.status === 'paid' ? 'LUNAS' : o.status === 'need_reupload' ? 'RE-UPLOAD' : 'PENDING'}
                        </Badge>
                      </td>

                      <td className="p-3">
                        {hasScannedTicket ? (
                          <Badge variant="red" className="text-[10px]">
                            🔒 SUDAH SCAN (GELANG)
                          </Badge>
                        ) : o.status === 'paid' ? (
                          <Badge variant="green" className="text-[10px]">
                            🎫 BELUM SCAN (AKTIF)
                          </Badge>
                        ) : (
                          <span className="text-neutral-500 font-mono text-[11px]">-</span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        {o.status === 'pending' && (
                          <div className="flex items-center justify-end space-x-1.5">
                            <Button variant="green" size="sm" onClick={() => handleApprove(o, 'bot')}>
                              <Bot className="w-3.5 h-3.5 mr-1" /> APPROVE (BOT)
                            </Button>
                            <Button variant="purple" size="sm" onClick={() => handleApprove(o, 'manual')}>
                              <Send className="w-3.5 h-3.5 mr-1" /> WA MANUAL
                            </Button>
                            <Button variant="red" size="sm" onClick={() => handleReject(o.id)}>
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                        {o.status === 'paid' && (
                          <div className="flex items-center justify-end space-x-1.5">
                            <Button variant="outline" size="sm" onClick={() => sendAutoTicketViaBot(o)}>
                              <Bot className="w-3.5 h-3.5 mr-1 text-brand-green" /> BOT RE-SEND
                            </Button>
                            <Button variant="purple" size="sm" onClick={() => sendManualWhatsAppMessage(o)}>
                              <Send className="w-3.5 h-3.5 mr-1" /> WA MANUAL
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* TABLE 2: OTS VENUE CASHIER TRANSACTIONS */}
      <Card variant="dark" className="p-6 space-y-6 border-neutral-800">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
          <div>
            <h3 className="text-lg font-black uppercase text-white flex items-center space-x-2">
              <Banknote className="w-5 h-5 text-brand-yellow inline mr-1" />
              <span>2. DAFTAR TRANSAKSI KASIR OTS (VENUE)</span>
            </h3>
            <p className="text-xs text-neutral-400">Pembayaran di kasir &amp; penyerahan gelang fisik langsung di konter venue.</p>
          </div>
          <Badge variant="yellow">DIRECT WRISTBAND</Badge>
        </div>

        {loading ? (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-brand-yellow animate-spin mx-auto" />
            <p className="text-xs font-bold text-neutral-400 uppercase">MEMUAT TRANSAKSI OTS...</p>
          </div>
        ) : otsOrders.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Inbox className="w-10 h-10 text-neutral-600 mx-auto" />
            <p className="font-extrabold text-xs text-neutral-400 uppercase">BELUM ADA TRANSAKSI KASIR OTS</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-900 text-neutral-400 font-bold uppercase border-b border-neutral-800">
                <tr>
                  <th className="p-3">KODE OTS</th>
                  <th className="p-3">WAKTU TRANSAKSI</th>
                  <th className="p-3">KETERANGAN TRANSAKSI</th>
                  <th className="p-3">TOTAL BAYAR</th>
                  <th className="p-3">STATUS BAYAR</th>
                  <th className="p-3">STATUS PENYERAHAN GELANG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 font-medium text-neutral-200">
                {otsOrders.map((o) => {
                  const seed = parseInt(o.id.replace(/[^0-9]/g, '').substring(0, 4) || '1029');
                  const prettyCode = generatePrettyRedeemCode(o.events?.name, seed);
                  return (
                    <tr key={o.id} className="hover:bg-neutral-900/50">
                      <td className="p-3 font-mono font-black text-brand-yellow text-sm flex items-center space-x-1">
                        <Key className="w-3.5 h-3.5 text-brand-yellow shrink-0" />
                        <span>{prettyCode}</span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-brand-yellow font-bold flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-brand-yellow shrink-0" />
                        <span>{formatDateTime(o.created_at)}</span>
                      </td>
                      <td className="p-3 font-bold text-white">{o.guest_name}</td>
                      <td className="p-3 font-bold text-brand-green">{formatRupiah(o.total_price)}</td>
                      <td className="p-3">
                        <Badge variant="green">LUNAS (OTS)</Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="green" className="text-[10px]">
                          🎟️ GELANG DISERAHKAN (KASIR)
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

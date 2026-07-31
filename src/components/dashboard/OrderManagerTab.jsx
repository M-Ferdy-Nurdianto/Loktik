import React, { useState, useEffect, useRef } from 'react';
import { Check, X, MessageSquare, Inbox, RefreshCw, Eye, Send, Bot, Banknote, ShoppingBag, Clock, Filter, Layers, ChevronDown, ChevronUp, Sparkles, Key, FileSpreadsheet, FileText } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { getLiveOrdersForEo, updateOrderStatus } from '../../services/apiOrders';
import { getAllEventsForEo } from '../../services/apiEvents';
import { formatRupiah, formatDateTime, generatePrettyRedeemCode } from '../../utils/formatters';
import html2canvas from 'html2canvas';
import { TicketGraphic } from './TicketGraphic';
import { supabase } from '../../services/supabase';
import { useToast } from '../../context/ToastContext';

export const OrderManagerTab = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const eoUsername = user?.username || user?.name || 'eo_lokal';
  const userPlan = user?.subscriptionPlan || '1_month';
  const hasBotAccess = user?.role === 'admin' || userPlan === '3_months' || userPlan === '1_year';

  const formatOrderTicketCategories = (order) => {
    if (!order.tickets || order.tickets.length === 0) return 'Standard Ticket';
    const counts = {};
    for (const t of order.tickets) {
      const catName = t.ticket_categories?.name || 'Tiket';
      counts[catName] = (counts[catName] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([catName, qty]) => `${qty}x ${catName}`)
      .join(', ');
  };

  const [orders, setOrders] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('ALL');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [previewProofUrl, setPreviewProofUrl] = useState(null);
  const [botStatus, setBotStatus] = useState('checking');
  const [generatingTicket, setGeneratingTicket] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, activeName: '' });

  const dropdownRef = useRef(null);
  const ticketRef = useRef(null);
  const lastWaSendTimeRef = useRef(0);
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

  const generateTicketImage = (order) => {
    return new Promise((resolve, reject) => {
      const eventName = order.events?.name || 'Event LokTik';
      const seed = parseInt(order.id.replace(/[^0-9]/g, '').substring(0, 4) || '1029');
      const prettyCode = generatePrettyRedeemCode(eventName, seed);

      setGeneratingTicket({
        eventName,
        guestName: order.guest_name,
        ticketCode: prettyCode,
        isPaid: order.status === 'paid' || true,
      });

      setTimeout(async () => {
        try {
          const element = ticketRef.current;
          if (!element) {
            throw new Error('Elemen e-ticket tidak ditemukan di DOM.');
          }

          const canvas = await html2canvas(element, {
            useCORS: true,
            scale: 2,
            backgroundColor: '#0a0a0a',
            logging: false,
          });

          canvas.toBlob(async (blob) => {
            if (!blob) {
              reject(new Error('Gagal mengonversi e-ticket ke gambar.'));
              return;
            }

            try {
              const fileName = `${prettyCode}-${Date.now()}.png`;
              const { error: uploadError } = await supabase.storage
                .from('tickets')
                .upload(fileName, blob, {
                  contentType: 'image/png',
                  cacheControl: '3600',
                  upsert: false,
                });

              if (uploadError) {
                throw new Error(`Gagal mengunggah tiket ke storage: ${uploadError.message}`);
              }

              const { data } = supabase.storage
                .from('tickets')
                .getPublicUrl(fileName);

              setGeneratingTicket(null);
              resolve(data.publicUrl);
            } catch (err) {
              setGeneratingTicket(null);
              reject(err);
            }
          }, 'image/png');
        } catch (err) {
          setGeneratingTicket(null);
          reject(err);
        }
      }, 300);
    });
  };

  const sendManualWhatsAppMessage = (order, ticketUrl) => {
    const waNumber = order.guest_wa.replace(/[^0-9]/g, '');
    const cleanNumber = waNumber.startsWith('0') ? `62${waNumber.substring(1)}` : waNumber;
    const eventName = order.events?.name || 'Event LokTik';
    const seed = parseInt(order.id.replace(/[^0-9]/g, '').substring(0, 4) || '1312');
    const prettyCode = generatePrettyRedeemCode(eventName, seed);
    const qrImageUrl = ticketUrl || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${prettyCode}`;

    const ticketQty = order.tickets && order.tickets.length > 0 ? order.tickets.length : (order.quantity || 1);
    const categoryDetails = formatOrderTicketCategories(order);
    const qtyText = ticketQty > 1
      ? `- Jumlah Tiket: *${ticketQty} Tiket* (${categoryDetails})\n⚠️ *PENTING:* Kode / QR Code ini dapat di-scan sebanyak *${ticketQty}x* di gate venue (bisa bersamaan atau bertahap).`
      : `- Kategori Tiket: *${categoryDetails}*`;

    const messageText = `Halo Kak *${order.guest_name}*,

Tiket pesanan Anda untuk event *${eventName}* telah *LUNAS & DIVERIFIKASI!*

*DETAIL TIKET:*
- Kode Tiket / Barcode: *${prettyCode}*
${qtyText}
- Total Bayar: ${formatRupiah(order.total_price)}
- Status: LUNAS (Verified)

*LINK E-TIKET RESMI ANDA:*
${qrImageUrl}

Silakan sebutkan Kode *${prettyCode}* atau tunjukkan gambar QR Code di atas pada pintu masuk venue saat penukaran gelang.

Terima Kasih!
- Panitia ${eventName} via LokTik.web.id`;

    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(messageText)}`, '_blank');
  };

  const sendAutoTicketViaBot = async (order, ticketUrl) => {
    const waNumber = order.guest_wa.replace(/[^0-9]/g, '');
    const eventName = order.events?.name || 'Event LokTik';
    const seed = parseInt(order.id.replace(/[^0-9]/g, '').substring(0, 4) || '1312');
    const prettyCode = generatePrettyRedeemCode(eventName, seed);
    const qrImageUrl = ticketUrl || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${prettyCode}`;

    const ticketQty = order.tickets ? order.tickets.length : (order.quantity || 1);
    const categoryDetails = formatOrderTicketCategories(order);

    try {
      const response = await fetch(`${botServerUrl}/api/send-ticket-wa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waNumber,
          guestName: order.guest_name,
          eventName,
          orderId: prettyCode,
          ticketCount: ticketQty,
          ticketDetails: categoryDetails,
          totalPrice: order.total_price,
          ticketQrUrl: qrImageUrl,
        }),
      });

      const result = await response.json();
      if (result.success) {
        showToast(`Tiket Kode ${prettyCode} & QR Code otomatis terkirim via WA ke ${order.guest_name}!`, 'eo');
        return true;
      }
    } catch (e) {
      console.warn('Bot WA offline, mengalihkan ke WA Manual...');
    }

    sendManualWhatsAppMessage(order, ticketUrl);
  };

  const handleApprove = async (order, mode = 'bot') => {
    const now = Date.now();
    const cooldown = 5000;
    if (now - lastWaSendTimeRef.current < cooldown) {
      const waitSec = Math.ceil((cooldown - (now - lastWaSendTimeRef.current)) / 1000);
      showToast(`Harap tunggu ${waitSec} detik sebelum mengirim WhatsApp lagi.`, 'eo');
      return;
    }
    lastWaSendTimeRef.current = now;

    try {
      setLoading(true);
      await updateOrderStatus(order.id, 'paid');
      
      const updatedOrder = { ...order, status: 'paid' };
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? updatedOrder : o))
      );

      let ticketUrl = '';
      try {
        ticketUrl = await generateTicketImage(updatedOrder);
      } catch (genErr) {
        console.error('Gagal generate e-ticket premium:', genErr);
        showToast('Gagal menghasilkan e-ticket premium. Mengalihkan ke QR code standar...', 'eo');
      }

      if (mode === 'bot') {
        await sendAutoTicketViaBot(updatedOrder, ticketUrl);
      } else {
        sendManualWhatsAppMessage(updatedOrder, ticketUrl);
      }
    } catch (err) {
      showToast(err.message || 'Gagal memproses persetujuan.', 'eo');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (order, mode = 'bot') => {
    const now = Date.now();
    const cooldown = 5000;
    if (now - lastWaSendTimeRef.current < cooldown) {
      const waitSec = Math.ceil((cooldown - (now - lastWaSendTimeRef.current)) / 1000);
      showToast(`Harap tunggu ${waitSec} detik sebelum mengirim WhatsApp lagi.`, 'eo');
      return;
    }
    lastWaSendTimeRef.current = now;

    try {
      setLoading(true);
      let ticketUrl = '';
      try {
        ticketUrl = await generateTicketImage(order);
      } catch (genErr) {
        console.error('Gagal generate e-ticket premium:', genErr);
        showToast('Gagal menghasilkan e-ticket premium. Mengalihkan ke QR code standar...', 'eo');
      }

      if (mode === 'bot') {
        await sendAutoTicketViaBot(order, ticketUrl);
      } else {
        sendManualWhatsAppMessage(order, ticketUrl);
      }
    } catch (err) {
      showToast(err.message || 'Gagal mengirim ulang e-ticket.', 'eo');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'need_reupload');
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'need_reupload' } : o))
      );
    } catch (err) {
      showToast(err.message, 'eo');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedOrders.length === 0) return;
    if (selectedOrders.length > 10) {
      showToast('Maksimal 10 pesanan yang dapat disetujui sekaligus.', 'eo');
      return;
    }

    setBulkProcessing(true);
    setLoading(true);

    const ordersToApprove = selectedOrders.map(id => orders.find(o => o.id === id)).filter(Boolean);
    const total = ordersToApprove.length;

    for (let i = 0; i < total; i++) {
      const order = ordersToApprove[i];
      setBulkProgress({ current: i + 1, total, activeName: order.guest_name });

      try {
        await updateOrderStatus(order.id, 'paid');
        const updatedOrder = { ...order, status: 'paid' };
        
        setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? updatedOrder : o))
        );

        let ticketUrl = '';
        try {
          ticketUrl = await generateTicketImage(updatedOrder);
        } catch (genErr) {
          console.error('Gagal generate e-ticket premium:', genErr);
        }

        await sendAutoTicketViaBot(updatedOrder, ticketUrl);
      } catch (err) {
        console.error(`Gagal memproses order ${order.id}:`, err);
      }

      if (i < total - 1) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    setSelectedOrders([]);
    setBulkProcessing(false);
    setLoading(false);
    showToast(`Selesai memproses ${total} pesanan secara massal!`, 'eo');
  };

  const exportToExcel = () => {
    if (filteredOrders.length === 0) {
      showToast('Tidak ada data pesanan untuk di-export ke Excel/CSV.', 'eo');
      return;
    }

    const eventTitle = selectedEventObj ? selectedEventObj.name : 'Semua Event';
    const filename = `Rekap_Penjualan_LokTik_${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;

    const headers = [
      'No',
      'Tipe Pesanan',
      'Kode Tiket / Barcode',
      'Nama Pembeli',
      'No WhatsApp',
      'Nama Event',
      'Kategori Tiket',
      'Jumlah Tiket',
      'Total Bayar (Rp)',
      'Status Pesanan',
      'Tanggal Pesan',
    ];

    const rows = filteredOrders.map((o, idx) => {
      const seed = parseInt(o.id.replace(/[^0-9]/g, '').substring(0, 4) || '1312');
      const prettyCode = generatePrettyRedeemCode(o.events?.name || 'Event', seed);
      const isOts = o.guest_name.startsWith('Pembeli OTS');
      const orderType = isOts ? 'OTS VENUE' : 'PO ONLINE';
      return [
        idx + 1,
        `"${orderType}"`,
        `"${prettyCode}"`,
        `"${o.guest_name.replace(/"/g, '""')}"`,
        `"${o.guest_wa}"`,
        `"${(o.events?.name || '').replace(/"/g, '""')}"`,
        `"${(o.ticket_categories?.name || 'Tiket Standard').replace(/"/g, '""')}"`,
        o.quantity || 1,
        o.total_price || 0,
        `"${o.status === 'paid' ? 'LUNAS' : o.status === 'need_reupload' ? 'REUPLOAD' : 'PENDING'}"`,
        `"${formatDateTime(o.created_at)}"`,
      ];
    });

    const titleRow = `"LOKTIK TICKETING DIRECT — LAPORAN REKAPITULASI PENJUALAN"`;
    const metaRow = `"EVENT: ${eventTitle.replace(/"/g, '""')}"` + `,"TANGGAL CETAK: ${new Date().toLocaleDateString('id-ID')}"`;

    const csvContent = '\uFEFF' + ['sep=,', titleRow, metaRow, '', headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    if (filteredOrders.length === 0) {
      showToast('Tidak ada data pesanan untuk di-export ke PDF.', 'eo');
      return;
    }

    const eventTitle = selectedEventObj ? selectedEventObj.name : 'SEMUA EVENT LOKTIK';

    // Separate PO Online vs OTS Venue Orders
    const poOrders = filteredOrders.filter((o) => !o.guest_name.startsWith('Pembeli OTS'));
    const otsOrders = filteredOrders.filter((o) => o.guest_name.startsWith('Pembeli OTS'));

    const poPaid = poOrders.filter((o) => o.status === 'paid');
    const otsPaid = otsOrders.filter((o) => o.status === 'paid');

    const poOmset = poPaid.reduce((sum, o) => sum + (o.total_price || 0), 0);
    const otsOmset = otsPaid.reduce((sum, o) => sum + (o.total_price || 0), 0);
    const totalOmset = poOmset + otsOmset;

    const poTickets = poPaid.reduce((sum, o) => sum + (o.quantity || 1), 0);
    const otsTickets = otsPaid.reduce((sum, o) => sum + (o.quantity || 1), 0);
    const totalTicketsSold = poTickets + otsTickets;

    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      showToast('Pop-up terblokir oleh browser. Izinkan pop-up untuk mencetak PDF.', 'eo');
      return;
    }

    const generatePoRows = (orderList) => {
      if (orderList.length === 0) {
        return `<tr><td colspan="7" style="padding:12px;text-align:center;color:#6b7280;font-style:italic;">Tidak ada transaksi Online Pre-Order (PO).</td></tr>`;
      }
      return orderList.map((o, idx) => {
        const seed = parseInt(o.id.replace(/[^0-9]/g, '').substring(0, 4) || '1312');
        const prettyCode = generatePrettyRedeemCode(o.events?.name || 'Event', seed);
        const categoryName = o.ticket_categories?.name || 'Tiket Standard';
        return `
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:7px 10px;text-align:center;color:#64748b;font-weight:600;">${idx + 1}</td>
            <td style="padding:7px 10px;font-family:monospace;font-weight:700;color:#0f172a;">${prettyCode}</td>
            <td style="padding:7px 10px;font-weight:700;color:#1e293b;">${o.guest_name}</td>
            <td style="padding:7px 10px;font-family:monospace;color:#475569;">${o.guest_wa}</td>
            <td style="padding:7px 10px;color:#334155;font-weight:600;">${categoryName} (${o.quantity || 1}x)</td>
            <td style="padding:7px 10px;text-align:right;font-family:monospace;font-weight:700;color:#0f172a;">${formatRupiah(o.total_price)}</td>
            <td style="padding:7px 10px;text-align:center;">
              <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:800;background:${o.status === 'paid' ? '#f0fdf4' : '#fef2f2'};color:${o.status === 'paid' ? '#15803d' : '#b91c1c'};border:1px solid ${o.status === 'paid' ? '#bbf7d0' : '#fecaca'};">
                ${o.status.toUpperCase()}
              </span>
            </td>
          </tr>
        `;
      }).join('');
    };

    const generateOtsRows = (orderList) => {
      if (orderList.length === 0) {
        return `<tr><td colspan="6" style="padding:12px;text-align:center;color:#6b7280;font-style:italic;">Tidak ada transaksi Kasir Venue (OTS).</td></tr>`;
      }
      return orderList.map((o, idx) => {
        const seed = parseInt(o.id.replace(/[^0-9]/g, '').substring(0, 4) || '1312');
        const prettyCode = generatePrettyRedeemCode(o.events?.name || 'Event', seed);
        const categoryName = o.ticket_categories?.name || 'Tiket Standard';
        const methodLabel = o.guest_name.includes('QRIS') ? 'QRIS VENUE' : 'TUNAI / CASH';
        return `
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:7px 10px;text-align:center;color:#64748b;font-weight:600;">${idx + 1}</td>
            <td style="padding:7px 10px;font-family:monospace;font-weight:700;color:#0f172a;">${prettyCode}</td>
            <td style="padding:7px 10px;font-weight:700;color:#0369a1;">${methodLabel}</td>
            <td style="padding:7px 10px;color:#334155;font-weight:600;">${categoryName} (${o.quantity || 1}x)</td>
            <td style="padding:7px 10px;text-align:right;font-family:monospace;font-weight:700;color:#0f172a;">${formatRupiah(o.total_price)}</td>
            <td style="padding:7px 10px;text-align:center;">
              <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:800;background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;">
                LUNAS (OTS)
              </span>
            </td>
          </tr>
        `;
      }).join('');
    };

    reportWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>REKAP LAPORAN PENJUALAN - ${eventTitle}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 30px; color: #1e293b; font-size: 11px; background: #fff; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 900; text-transform: uppercase; color: #0f172a; letter-spacing: -0.5px; }
          .header p { margin: 4px 0 0 0; color: #475569; font-size: 11px; font-weight: 500; }
          
          .stats-grid { display: flex; gap: 12px; margin-bottom: 24px; }
          .stat-box { border: 1px solid #cbd5e1; padding: 12px 14px; flex: 1; border-radius: 6px; background: #f8fafc; }
          .stat-box h4 { margin: 0 0 4px 0; color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; }
          .stat-box .val { font-size: 18px; font-weight: 900; margin: 0; color: #0f172a; }
          .stat-box .sub { font-size: 10px; color: #64748b; margin-top: 2px; font-weight: 600; }
          
          .section-title { font-size: 12px; font-weight: 900; text-transform: uppercase; margin: 20px 0 8px 0; padding-bottom: 4px; border-bottom: 1.5px solid #0f172a; color: #0f172a; display: flex; justify-content: space-between; align-items: center; }
          .section-badge { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; color: #334155; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
          th { background: #0f172a; color: #ffffff; padding: 8px 10px; border: 1px solid #0f172a; text-align: left; text-transform: uppercase; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; }
          
          .footer-section { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 10px; color: #64748b; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="background-color:#0a0a0a; padding:6px 12px; border-radius:6px; display:inline-flex; align-items:center; justify-content:center;">
              <img src="/logo.png" style="height:32px;width:auto;display:block;" alt="LokTik Logo" />
            </div>
            <div>
              <h1>LOKTIK — LAPORAN REKAPITULASI PENJUALAN</h1>
              <p><strong>EVENT:</strong> ${eventTitle} | <strong>PANITIA EO:</strong> ${eoUsername}</p>
            </div>
          </div>
          <div style="text-align:right;">
            <p><strong>TANGGAL CETAK:</strong> ${new Date().toLocaleDateString('id-ID')}</p>
          </div>
        </div>

        <!-- SUMMARY STATS GRID -->
        <div class="stats-grid">
          <div class="stat-box">
            <h4>Total Omset Keseluruhan</h4>
            <p class="val">${formatRupiah(totalOmset)}</p>
            <p class="sub">${totalTicketsSold} Tiket Terjual</p>
          </div>
          <div class="stat-box">
            <h4>1. Omset Pre-Order (PO Online)</h4>
            <p class="val">${formatRupiah(poOmset)}</p>
            <p class="sub">${poTickets} Tiket (${poPaid.length} Transaksi)</p>
          </div>
          <div class="stat-box">
            <h4>2. Omset Kasir Venue (OTS)</h4>
            <p class="val">${formatRupiah(otsOmset)}</p>
            <p class="sub">${otsTickets} Tiket (${otsPaid.length} Transaksi)</p>
          </div>
        </div>

        <!-- TABLE 1: PRE-ORDER (PO ONLINE) -->
        <div class="section-title">
          <span>1. DAFTAR PESANAN ONLINE (PRE-ORDER / PO)</span>
          <span class="section-badge">${poOrders.length} PESANAN</span>
        </div>
        <table>
          <thead>
            <tr>
              <th style="text-align:center;width:30px;">#</th>
              <th>Kode Tiket</th>
              <th>Nama Pembeli</th>
              <th>No WhatsApp</th>
              <th>Kategori Tiket</th>
              <th style="text-align:right;">Total Bayar</th>
              <th style="text-align:center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${generatePoRows(poOrders)}
          </tbody>
        </table>

        <!-- TABLE 2: ON THE SPOT (OTS VENUE) -->
        <div class="section-title" style="margin-top:30px;">
          <span>2. DAFTAR PENJUALAN VENUE (ON THE SPOT / OTS)</span>
          <span class="section-badge">${otsOrders.length} TRANSAKSI</span>
        </div>
        <table>
          <thead>
            <tr>
              <th style="text-align:center;width:30px;">#</th>
              <th>Kode Tiket</th>
              <th>Metode Pembayaran</th>
              <th>Kategori Tiket</th>
              <th style="text-align:right;">Total Bayar</th>
              <th style="text-align:center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${generateOtsRows(otsOrders)}
          </tbody>
        </table>

        <div class="footer-section">
          <p>Dokumen rekapitulasi penjualan ini diringkas secara otomatis oleh platform LokTik Direct Event Ticketing (loktik.web.id).</p>
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `);
    reportWindow.document.close();
  };

  return (
    <div className="space-y-6 text-left">
      <TicketGraphic
        ref={ticketRef}
        eventName={generatingTicket?.eventName || 'Event LokTik'}
        guestName={generatingTicket?.guestName || 'Nama Tamu'}
        ticketCode={generatingTicket?.ticketCode || 'LT1029'}
        isPaid={generatingTicket?.isPaid !== false}
      />

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

      {bulkProcessing && (
        <Card variant="dark" className="p-4 border-2 border-brand-green bg-[#0d1c10] space-y-3 shadow-[0_0_30px_rgba(57,255,20,0.25)] animate-pulse mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-brand-green">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <h3 className="text-xs font-black uppercase tracking-wider">SEDANG MEMPROSES APPROVE MASSAL...</h3>
            </div>
            <span className="text-xs font-mono font-black text-brand-green">
              {bulkProgress.current} / {bulkProgress.total} PESANAN
            </span>
          </div>
          <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-brand-green h-1.5 transition-all duration-500"
              style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-neutral-400 font-bold uppercase">
            MENGIRIM WA BOT KE: <span className="text-white font-black">{bulkProgress.activeName}</span> (Jeda cooldown 5 detik...)
          </p>
        </Card>
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
                    <span className="truncate">SEMUA EVENT ({orders.length} PESANAN)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-brand-yellow shrink-0" />
                    <span className="truncate">{selectedEventObj?.name || 'EVENT DILAYANI'}</span>
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
                    <span>SEMUA EVENT ({orders.length} PESANAN)</span>
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
                        <span>{evt.name}</span>
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

        <div className="flex flex-wrap items-center gap-2">
          {hasBotAccess ? (
            <Badge variant={botStatus === 'online' ? 'green' : 'yellow'}>
              <Bot className="w-3 h-3 mr-1 inline" />
              {botStatus === 'online' ? 'BOT WA ONLINE' : 'BOT WA STANDBY'}
            </Badge>
          ) : (
            <Badge variant="blue">
              <MessageSquare className="w-3 h-3 mr-1 inline" />
              MANUAL WA (PAKET 1 BULAN)
            </Badge>
          )}
          <Button variant="green" size="sm" onClick={exportToExcel} className="font-bold">
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> EXPORT EXCEL
          </Button>
          <Button variant="purple" size="sm" onClick={exportToPDF} className="font-bold">
            <FileText className="w-3.5 h-3.5 mr-1" /> EXPORT PDF
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} /> REFRESH
          </Button>
        </div>
      </Card>

      {/* TABLE 1: PRE-ORDER (PO) ONLINE BUYER ORDERS */}
      <Card variant="dark" className="p-6 space-y-6 border-neutral-800">
        <div className="border-b border-neutral-800 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-lg font-black uppercase text-white flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-brand-green inline mr-1" />
              <span>1. DAFTAR PESANAN ONLINE (PRE-ORDER / PO)</span>
            </h3>
            <p className="text-xs text-neutral-400">Verifikasi bukti transfer &amp; kirim tiket ke pembeli online website.</p>
          </div>

          {selectedOrders.length > 0 && hasBotAccess && (
            <div className="flex items-center space-x-3 w-full sm:w-auto bg-[#141414] p-1.5 rounded-lg border border-brand-green/30 animate-fade-in">
              <span className="text-[10px] font-black uppercase text-brand-green font-mono pl-1">
                {selectedOrders.length} TERPILIH (MAX 10)
              </span>
              <Button
                variant="green"
                size="sm"
                onClick={handleBulkApprove}
                disabled={selectedOrders.length > 10 || bulkProcessing}
                className="font-black text-[10px] uppercase min-h-[32px] px-3.5"
              >
                {bulkProcessing ? `MEMPROSES...` : `APPROVE MASSAL (BOT)`}
              </Button>
            </div>
          )}
        </div>

        {errorMsg && (
          <p className="text-xs text-brand-red font-bold uppercase bg-red-950/40 p-3 rounded-md border border-brand-red/40">
            [!] {errorMsg}
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
                  <th className="p-3 w-10 text-center">
                    {hasBotAccess && (
                      <button
                        type="button"
                        onClick={() => {
                          const pendingIds = poOrders.filter(o => o.status === 'pending').map(o => o.id);
                          const allSelected = pendingIds.length > 0 && selectedOrders.length === pendingIds.length;
                          if (allSelected) {
                            setSelectedOrders([]);
                          } else {
                            setSelectedOrders(pendingIds);
                          }
                        }}
                        className={`w-5 h-5 rounded border mx-auto flex items-center justify-center transition-all duration-150 cursor-pointer ${
                          poOrders.filter(o => o.status === 'pending').length > 0 &&
                          selectedOrders.length === poOrders.filter(o => o.status === 'pending').length
                            ? 'bg-brand-green border-brand-green text-black shadow-[0_0_10px_rgba(57,255,20,0.4)]'
                            : 'bg-neutral-950 border-neutral-700 text-transparent hover:border-neutral-500'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    )}
                  </th>
                  <th className="p-3">KODE TIKET</th>
                  <th className="p-3">TIER TIKET</th>
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
                      <td className="p-3 w-10 text-center">
                        {o.status === 'pending' && hasBotAccess ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedOrders.includes(o.id)) {
                                setSelectedOrders(selectedOrders.filter(id => id !== o.id));
                              } else {
                                setSelectedOrders([...selectedOrders, o.id]);
                              }
                            }}
                            className={`w-5 h-5 rounded border mx-auto flex items-center justify-center transition-all duration-150 cursor-pointer ${
                              selectedOrders.includes(o.id)
                                ? 'bg-brand-green border-brand-green text-black shadow-[0_0_10px_rgba(57,255,20,0.4)]'
                                : 'bg-neutral-950 border-neutral-700 text-transparent hover:border-brand-green/60'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        ) : (
                          <span className="text-neutral-600 font-bold">-</span>
                        )}
                      </td>
                      <td className="p-3 font-mono font-black text-brand-green text-sm">
                        <div className="flex items-center space-x-1">
                          <Key className="w-3.5 h-3.5 text-brand-green shrink-0" />
                          <span>{prettyCode}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="inline-block px-2 py-0.5 bg-neutral-900 border border-brand-yellow/30 rounded text-[11px] font-extrabold text-brand-yellow font-mono">
                          {formatOrderTicketCategories(o)}
                        </span>
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
                            SUDAH SCAN
                          </Badge>
                        ) : o.status === 'paid' ? (
                          <Badge variant="green" className="text-[10px]">
                            AKTIF
                          </Badge>
                        ) : (
                          <span className="text-neutral-500 font-mono text-[11px]">-</span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        {o.status === 'pending' && (
                          <div className="flex items-center justify-end space-x-1.5">
                            {hasBotAccess && (
                              <Button variant="green" size="sm" onClick={() => handleApprove(o, 'bot')}>
                                <Bot className="w-3.5 h-3.5 mr-1" /> APPROVE (BOT)
                              </Button>
                            )}
                            <Button variant={hasBotAccess ? "purple" : "green"} size="sm" onClick={() => handleApprove(o, 'manual')}>
                              <Send className="w-3.5 h-3.5 mr-1" /> {hasBotAccess ? 'WA MANUAL' : 'APPROVE (WA MANUAL)'}
                            </Button>
                            <Button variant="red" size="sm" onClick={() => handleReject(o.id)}>
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                        {o.status === 'paid' && (
                          <div className="flex items-center justify-end space-x-1.5">
                            {hasBotAccess && (
                              <Button variant="outline" size="sm" onClick={() => handleResend(o, 'bot')}>
                                <Bot className="w-3.5 h-3.5 mr-1 text-brand-green" /> BOT RE-SEND
                              </Button>
                            )}
                            <Button variant="purple" size="sm" onClick={() => handleResend(o, 'manual')}>
                              <Send className="w-3.5 h-3.5 mr-1" /> {hasBotAccess ? 'WA MANUAL' : 'KIRIM ULANG WA'}
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
            <p className="text-xs text-neutral-400">Pembayaran di kasir &amp; penyerahan tiket fisik langsung di konter venue.</p>
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
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-neutral-900 text-neutral-400 font-bold uppercase border-b border-neutral-800 text-[11px]">
                <tr>
                  <th className="p-3 w-32">KODE OTS</th>
                  <th className="p-3">METODE &amp; WAKTU TRANSAKSI</th>
                  <th className="p-3">TIER TIKET</th>
                  <th className="p-3">TOTAL BAYAR</th>
                  <th className="p-3">STATUS BAYAR</th>
                  <th className="p-3">TIKET FISIK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 font-medium text-neutral-200">
                {otsOrders.map((o) => {
                  const seed = parseInt(o.id.replace(/[^0-9]/g, '').substring(0, 4) || '1312');
                  const prettyCode = generatePrettyRedeemCode(o.events?.name, seed);
                  const cleanName = (o.guest_name || 'Pembeli OTS').replace(/\s*\d{2}\.\d{2}\s*/g, '').trim();

                  return (
                    <tr key={o.id} className="hover:bg-neutral-900/50">
                      <td className="p-3">
                        <div className="flex items-center space-x-1 text-brand-yellow font-mono font-black text-sm">
                          <Key className="w-3.5 h-3.5 text-brand-yellow shrink-0" />
                          <span>{prettyCode}</span>
                        </div>
                      </td>
                      <td className="p-3 space-y-1">
                        <div className="font-bold text-white text-xs">{cleanName}</div>
                        <div className="flex items-center space-x-1 text-neutral-400 font-mono text-[10px]">
                          <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{formatDateTime(o.created_at)}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="inline-block px-2 py-0.5 bg-neutral-900 border border-brand-yellow/30 rounded text-[11px] font-extrabold text-brand-yellow font-mono">
                          {formatOrderTicketCategories(o)}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-brand-green font-mono text-sm">{formatRupiah(o.total_price)}</td>
                      <td className="p-3">
                        <Badge variant="green">LUNAS (OTS)</Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="green" className="text-[10px]">
                          DISERAHKAN (KASIR)
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

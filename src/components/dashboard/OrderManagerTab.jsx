import React, { useState, useEffect, useRef } from 'react';
import { Check, X, MessageSquare, Inbox, RefreshCw, Eye, Send, Bot, Banknote, ShoppingBag, Clock, Filter, Layers, ChevronDown, ChevronUp, Sparkles, Key, FileSpreadsheet, FileText } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { getLiveOrdersForEo, updateOrderStatus } from '../../services/apiOrders';
import { getAllEventsForEo } from '../../services/apiEvents';
import { formatRupiah, formatDateTime, generatePrettyRedeemCode, formatTicketUnitCode } from '../../utils/formatters';
import html2canvas from 'html2canvas';
import { TicketGraphic } from './TicketGraphic';
import { supabase } from '../../services/supabase';
import { useToast } from '../../context/ToastContext';
import { resolveWhatsAppMode } from '../../utils/resolveWhatsAppMode';
import { deductWaQuota } from '../../services/apiEo';

export const OrderManagerTab = () => {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const eoUsername = user?.username || user?.name || '';
  const userPlan = user?.subscriptionPlan || '1_month';
  const [liveEoData, setLiveEoData] = useState(null);
  const effectiveUser = liveEoData
    ? {
        ...user,
        wa_quota: liveEoData.wa_quota ?? user?.wa_quota ?? 0,
        wa_messages_sent: liveEoData.wa_messages_sent ?? user?.wa_messages_sent ?? 0,
        botAccessBonus: liveEoData.bot_access_bonus ?? user?.botAccessBonus ?? false,
      }
    : user;
  // resolveWhatsAppMode — SINGLE SOURCE OF TRUTH untuk mode pengiriman WA
  const waMode = resolveWhatsAppMode(effectiveUser); // 'bot' | 'quota' | 'manual'
  const hasBotAccess = waMode === 'bot' || waMode === 'quota';

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

  const getOrderLookupCode = (order) => {
    const eventName = order?.events?.name || 'Event LokTik';
    const seed = parseInt(String(order?.id || '').replace(/[^0-9]/g, '').substring(0, 4) || '1312');
    return generatePrettyRedeemCode(eventName, seed);
  };

  const getOrderTicketUnits = (order) => {
    const total = order?.tickets?.length || 0;
    return (order?.tickets || []).map((ticket, idx) => ({
      ...ticket,
      categoryName: ticket.ticket_categories?.name || 'Tiket Regular',
      unitCode: formatTicketUnitCode(ticket.barcode_uuid, ticket.id),
      ticketLabel: total > 1 ? `Tiket ${idx + 1} dari ${total}` : 'Tiket Masuk',
    }));
  };

  const buildTicketDispatchPayload = (order) => {
    const tickets = getOrderTicketUnits(order);
    const orderLookupCode = getOrderLookupCode(order);
    const ticketCount = tickets.length || order.quantity || 1;
    const categoryDetails = formatOrderTicketCategories(order);
    const ticketLines = tickets.map((ticket) => `- ${ticket.unitCode} | ${ticket.categoryName}`);
    const ticketSummaryText = ticketLines.length > 0
      ? ticketLines.join('\n')
      : `- ${orderLookupCode} | ${categoryDetails}`;

    const categories = new Set(tickets.map(t => t.categoryName));
    const isMixed = categories.size > 1;

    return {
      orderLookupCode,
      ticketCount,
      categoryDetails,
      ticketSummaryText,
      tickets,
      shouldAttachImage: !isMixed || tickets.length === 1, // Jika tidak campuran, 1 gambar cukup
      isMixed,
      primaryTicket: tickets[0] || null,
    };
  };

  const [orders, setOrders] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
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

  const fetchData = async (username) => {
    if (!username) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const [ordersData, eventsData] = await Promise.all([
        getLiveOrdersForEo(username),
        getAllEventsForEo(username),
      ]);
      setOrders(ordersData);
      setEvents(eventsData);
      if (eventsData && eventsData.length > 0) {
        setSelectedEventId((prev) => (prev && prev !== 'ALL' ? prev : eventsData[0].id));
      }
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

  const fetchLiveEoData = async (eoId) => {
    if (!eoId) return;
    try {
      const { data: eoRow } = await supabase
        .from('eo_accounts')
        .select('wa_quota, wa_messages_sent, bot_access_bonus')
        .eq('id', eoId)
        .maybeSingle();

      if (eoRow) {
        setLiveEoData(eoRow);
      }
    } catch (_) {}
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    const username = user?.username || user?.name || '';
    if (!username) return;
    fetchData(username);
    checkBotStatus();
    fetchLiveEoData(user?.id);
  }, [authLoading, user]);

  const filteredOrders = selectedEventId === 'ALL'
    ? orders
    : orders.filter((o) => o.event_id === selectedEventId);

  const isOtsOrder = (o) => Boolean(o.guest_name && (o.guest_name.startsWith('OTS') || o.guest_name.startsWith('Pembeli OTS')));

  const poOrders = filteredOrders.filter((o) => !isOtsOrder(o));
  const otsOrders = filteredOrders.filter((o) => isOtsOrder(o));

  const selectedEventObj = events.find((e) => e.id === selectedEventId);

  /**
   * Generate gambar tiket untuk SATU tiket tertentu (targetTicket wajib untuk multi-tiket).
   * Selalu menggunakan barcode_uuid tiket itu sendiri sebagai QR data agar setiap tiket
   * punya QR unik yang bisa di-scan secara independen di gate.
   */
  const generateTicketImage = (order, targetTicket = null) => {
    return new Promise((resolve, reject) => {
      const eventName = order.events?.name || 'Event LokTik';
      const orderLookupCode = getOrderLookupCode(order);
      const ticketUnits = getOrderTicketUnits(order);
      const activeTicket = targetTicket
        ? {
            ...targetTicket,
            categoryName: targetTicket.categoryName || targetTicket.ticket_categories?.name || 'Tiket Regular',
            unitCode: targetTicket.unitCode || formatTicketUnitCode(targetTicket.barcode_uuid, targetTicket.id),
          }
        : (ticketUnits[0] || null);
      const dispatch = buildTicketDispatchPayload(order);
      const isMixed = dispatch.isMixed;

      // QR code HARUS encode full barcode_uuid (format UUID standar), BUKAN short code.
      // Alasan: check_ticket_validity di DB pakai LIKE matching — short 7-char bisa false-match
      // ke tiket lain. Full UUID garanteed unique dan akan match exact lewat kondisi:
      //   UPPER(target_barcode) LIKE '%' || UPPER(t.barcode_uuid::TEXT) || '%'
      // Displayed TICKET UID di tiket grafis tetap pakai unitCode (short, readable).
      const activeUnitCode = activeTicket?.unitCode || orderLookupCode;
      const qrCodeData = activeTicket?.barcode_uuid || activeUnitCode; // full UUID untuk QR

      const ticketData = {
        eventName,
        guestName: order.guest_name,
        ticketCode: qrCodeData,      // QR encode: full barcode_uuid (untuk scan akurat)
        displayUid: activeUnitCode,  // Displayed TICKET UID: short code (readable)
        isPaid: order.status === 'paid' || true,
        categoryName: activeTicket?.categoryName || formatOrderTicketCategories(order),
        ticketLabel: isMixed
          ? (activeTicket?.ticketLabel || `Tiket ${activeTicket?.categoryName || ''}`)
          : (activeTicket?.ticketLabel || 'Tiket Masuk'),
        orderLookupCode,
      };

      setGeneratingTicket(ticketData);

      // Tunggu React commit + font/image render selesai sebelum capture
      // Gunakan requestAnimationFrame ganda untuk memastikan DOM sudah terupdate
      const doCapture = () => {
        // Timeout 2500ms: cukup untuk QR PNG dari api.qrserver.com selesai dimuat
        setTimeout(async () => {
          try {
            const element = ticketRef.current;
            if (!element) {
              reject(new Error('Elemen e-ticket tidak ditemukan di DOM.'));
              return;
            }

            const isReady = element.getAttribute('data-ticket-ready') === 'true';
            if (!isReady) {
              // DOM belum terupdate, coba lagi setelah 1 detik
              setTimeout(async () => {
                try {
                  const canvas = await html2canvas(element, {
                    useCORS: true,
                    allowTaint: false,
                    scale: 2,
                    backgroundColor: '#0a0a0a',
                    logging: false,
                  });
                  processCanvas(canvas);
                } catch (err) {
                  setGeneratingTicket(null);
                  reject(err);
                }
              }, 1000);
              return;
            }

            const canvas = await html2canvas(element, {
              useCORS: true,
              allowTaint: false,
              scale: 2,
              backgroundColor: '#0a0a0a',
              logging: false,
            });
            processCanvas(canvas);
          } catch (err) {
            setGeneratingTicket(null);
            reject(err);
          }
        }, 2500);
      };

      const processCanvas = (canvas) => {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            setGeneratingTicket(null);
            reject(new Error('Gagal mengonversi e-ticket ke gambar.'));
            return;
          }

          try {
            // FIX: gunakan ticketData.ticketCode (activeUnitCode) bukan `ticketCode` yang tidak ada di scope
            const fileName = `${ticketData.ticketCode}-${Date.now()}.png`;
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
      };

      // Tunggu 2 frame animasi untuk React commit selesai
      requestAnimationFrame(() => requestAnimationFrame(doCapture));
    });
  };

  /**
   * Generate gambar untuk SEMUA tiket dalam order secara berurutan.
   * Setiap tiket dapat gambar sendiri dengan QR code unik (barcode_uuid-nya masing-masing).
   * Returns: array of { ticketId, imageUrl }
   */
  const generateAllTicketImages = async (order) => {
    const ticketUnits = getOrderTicketUnits(order);
    const results = [];
    for (const ticket of ticketUnits) {
      try {
        const imageUrl = await generateTicketImage(order, ticket);
        results.push({ ticketId: ticket.id, imageUrl });
        // Simpan URL langsung ke DB untuk tiket ini
        if (imageUrl && ticket.id) {
          await supabase.from('tickets').update({ ticket_image_url: imageUrl }).eq('id', ticket.id);
        }
      } catch (e) {
        console.warn(`Gagal generate gambar tiket ${ticket.unitCode}:`, e);
        results.push({ ticketId: ticket.id, imageUrl: null });
      }
    }
    return results;
  };

  const sendManualWhatsAppMessage = (order, ticketUrl) => {
    const waNumber = order.guest_wa.replace(/[^0-9]/g, '');
    const cleanNumber = waNumber.startsWith('0') ? `62${waNumber.substring(1)}` : waNumber;
    const eventName = order.events?.name || 'Event LokTik';
    // Gunakan _updatedDispatch jika tersedia (sudah include ticket_image_url per tiket)
    const dispatch = order._updatedDispatch || buildTicketDispatchPayload(order);

    // Bangun section LINK SEMUA TIKET — tampil di atas DETAIL agar langsung terlihat
    // Untuk multi-tiket (sama atau beda kategori): tampilkan link per tiket agar setiap tiket bisa di-scan sendiri
    const hasMultipleTickets = dispatch.tickets.length > 1;
    const ticketLinksSection = hasMultipleTickets
      ? `*LINK SEMUA TIKET ANDA:*\n${dispatch.tickets.map((t, idx) => {
          const url = t.ticket_image_url;
          return `Tiket ${idx + 1} (${t.categoryName}):\n${url || '(gambar tiket belum tersedia)'}`;
        }).join('\n\n')}\n\n`
      : ticketUrl
        ? `*LINK E-TIKET ANDA:*\n${ticketUrl}\n\n`
        : '';

    // Ringkasan jumlah tiket — bedakan multi-tiket vs single tiket
    let detailQty;
    if (hasMultipleTickets) {
      detailQty = `- Jumlah Tiket: *${dispatch.ticketCount} Tiket* (${dispatch.categoryDetails})\n⚠️ *PENTING:* Setiap tiket memiliki QR Code unik masing-masing. Gunakan QR sesuai tiket yang tertera di link di atas.`;
    } else {
      detailQty = `- Kategori Tiket: *${dispatch.categoryDetails}*`;
    }

    const footerText = hasMultipleTickets
      ? `Gunakan masing-masing QR Code sesuai tiket saat masuk venue.`
      : `Gunakan gambar QR Code terlampir di pintu masuk venue saat penukaran gelang.`;

    const messageText = `Halo Kak *${order.guest_name}*,

Tiket pesanan Anda untuk event *${eventName}* telah *LUNAS & DIVERIFIKASI!*

${ticketLinksSection}📋 *DETAIL TIKET:*
- Kode Pesanan: *${dispatch.orderLookupCode}*
${detailQty}
- Total Bayar: ${formatRupiah(order.total_price)}
- Status: LUNAS (Verified)

${footerText}

Terima Kasih!
- Panitia ${eventName} via LokTik.web.id`;

    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(messageText)}`, '_blank');
  };

  const sendAutoTicketViaBot = async (order, ticketUrl) => {
    // --- resolveWhatsAppMode: SINGLE SOURCE OF TRUTH ---
    const resolvedMode = resolveWhatsAppMode(effectiveUser);
    const isUnlimitedBot = resolvedMode === 'bot';

    if (resolvedMode === 'manual') {
      showToast('Bot WA tidak aktif & kuota habis. Beralih ke WA manual.', 'eo');
      sendManualWhatsAppMessage(order, ticketUrl);
      return false;
    }

    const waNumber = order.guest_wa.replace(/[^0-9]/g, '');
    const eventName = order.events?.name || 'Event LokTik';
    // Gunakan _updatedDispatch jika tersedia (sudah include ticket_image_url per tiket)
    const dispatch = order._updatedDispatch || buildTicketDispatchPayload(order);

    const hasMultipleTickets = dispatch.tickets.length > 1;

    // URL tiket pertama untuk lampiran gambar
    const qrImageUrl = ticketUrl || null;

    // Link ke halaman Cek Tiket (gunakan domain production atau localhost)
    const siteUrl = window.location.hostname === 'localhost'
      ? `http://localhost:${window.location.port || 3000}`
      : 'https://loktik.web.id';
    const cekTiketUrl = `${siteUrl}/?cek=${dispatch.orderLookupCode}`;

    try {
      const response = await fetch(`${botServerUrl}/api/send-ticket-wa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waNumber,
          guestName: order.guest_name,
          eventName,
          orderId: dispatch.orderLookupCode,
          ticketCount: dispatch.ticketCount,
          ticketDetails: dispatch.categoryDetails,
          totalPrice: order.total_price,
          ticketQrUrl: qrImageUrl,
          isMixed: dispatch.isMixed,
          cekTiketUrl,
          // Kirim link per tiket untuk semua order multi-tiket (sama atau beda kategori)
          ticketLinks: hasMultipleTickets ? dispatch.tickets.map(t => ({
            name: t.categoryName,
            url: t.ticket_image_url || ''
          })) : []
        }),
      });

      const result = await response.json();
      // Bot not ready yet (503) → treat as offline and fall through to manual
      if (!response.ok && !result.success) {
        const errMsg = result.error || result.message || `HTTP ${response.status}`;
        console.warn('[WA Bot] endpoint error:', errMsg);
        showToast(`Bot WA tidak siap: ${errMsg}. Beralih ke WA manual.`, 'eo');
        sendManualWhatsAppMessage(order, ticketUrl);
        return false;
      }
      if (result.success) {
        // Bot aktif = unlimited, tidak kurangi kuota
        // Kuota hanya berkurang jika mode kuota (bot tidak aktif)
        const currentSent = effectiveUser?.wa_messages_sent ?? 0;
        const currentQuota = effectiveUser?.wa_quota ?? 0;
        const newSent = currentSent + 1;
        const newQuota = isUnlimitedBot
          ? currentQuota
          : Math.max(0, currentQuota - 1);

        // Kurangi kuota di Supabase (source of truth) jika mode quota
        if (!isUnlimitedBot && effectiveUser?.id) {
          deductWaQuota(effectiveUser.id).then((res) => {
            if (!res.success) {
              console.warn('[WA Bot] deductWaQuota gagal:', res.message);
            }
            // Beritahu EODashboard agar update waStats tanpa hard refresh
            window.dispatchEvent(new CustomEvent('wa-quota-updated', {
              detail: {
                wa_quota: res.success ? res.remainingQuota : newQuota,
                wa_messages_sent: res.success ? res.totalSent : newSent,
              }
            }));
          }).catch((err) => {
            console.warn('[WA Bot] deductWaQuota error:', err);
            // Tetap dispatch dengan nilai optimistic agar UI update
            window.dispatchEvent(new CustomEvent('wa-quota-updated', {
              detail: { wa_quota: newQuota, wa_messages_sent: newSent }
            }));
          });
        } else if (isUnlimitedBot) {
          // Mode unlimited: hanya update sent count di UI
          window.dispatchEvent(new CustomEvent('wa-quota-updated', {
            detail: { wa_quota: currentQuota, wa_messages_sent: newSent }
          }));
        }

        setLiveEoData((prev) => ({
          wa_quota: newQuota,
          wa_messages_sent: newSent,
          bot_access_bonus: prev?.bot_access_bonus ?? effectiveUser?.botAccessBonus ?? false,
        }));

        // Update session user
        const savedSession = localStorage.getItem('loktik_eo_session');
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            localStorage.setItem('loktik_eo_session', JSON.stringify({
              ...parsed,
              wa_quota: newQuota,
              wa_messages_sent: newSent,
            }));
          } catch (_) {}
        }

        // Sync ke loktik_eo_accounts supaya admin dashboard ikut update
        const savedAccounts = localStorage.getItem('loktik_eo_accounts');
        if (savedAccounts) {
          try {
            const accounts = JSON.parse(savedAccounts);
            const updated = accounts.map((acc) => {
              if (acc.name === eoUsername || acc.id === user?.id) {
                return { ...acc, wa_quota: newQuota, wa_messages_sent: newSent };
              }
              return acc;
            });
            localStorage.setItem('loktik_eo_accounts', JSON.stringify(updated));
          } catch (_) {}
        }

        const quotaInfo = isUnlimitedBot ? 'BOT AKTIF (Unlimited)' : `Sisa kuota: ${newQuota}`;
        showToast(`Rincian tiket order ${dispatch.orderLookupCode} otomatis terkirim via WA ke ${order.guest_name}! (${quotaInfo})`, 'eo');
        return true;
      } else {
        // GAGAL dari sisi bot (500 Error, dll)
        console.error('Error dari bot:', result);
        showToast(`Error Bot WA: ${result.error || result.message || '500 Internal Server Error'}`, 'eo');
        return false;
      }
    } catch (e) {
      console.warn('Bot WA offline, mengalihkan ke WA Manual...', e);
    }

    sendManualWhatsAppMessage(order, ticketUrl);
    return false;
  };

  // Helper: simpan URL gambar tiket ke SATU tiket spesifik berdasarkan ticketId
  const saveTicketImageUrl = async (ticketId, ticketUrl) => {
    if (!ticketUrl || !ticketId) return;
    try {
      await supabase
        .from('tickets')
        .update({ ticket_image_url: ticketUrl })
        .eq('id', ticketId);
    } catch (err) {
      console.warn('Gagal menyimpan ticket_image_url ke DB:', err);
    }
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
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updatedOrder : o)));

      const dispatch = buildTicketDispatchPayload(updatedOrder);
      const ticketUnits = getOrderTicketUnits(updatedOrder);

      showToast('Menyiapkan E-Ticket grafis...', 'info');

      // Generate gambar grafis per tiket (sequential karena pakai 1 DOM ref).
      // Setiap tiket dapat gambar unik dengan QR-nya sendiri.
      // Jika sudah ada di DB, pakai langsung tanpa generate ulang.
      const ticketImageResults = []; // [{ ticketId, imageUrl }]

      for (const t of ticketUnits) {
        // Skip regenerate jika sudah ada gambar grafis (dari Supabase Storage, bukan QR fallback)
        const hasGrafis = t.ticket_image_url && !t.ticket_image_url.includes('api.qrserver.com');
        if (hasGrafis) {
          ticketImageResults.push({ ticketId: t.id, imageUrl: t.ticket_image_url });
        } else {
          // Wajib generate grafis — tidak boleh fallback ke QR polos
          const imageUrl = await generateTicketImage(updatedOrder, t);
          ticketImageResults.push({ ticketId: t.id, imageUrl });
          if (imageUrl && t.id) {
            supabase.from('tickets').update({ ticket_image_url: imageUrl }).eq('id', t.id).then(() => {});
          }
        }
      }

      // Update dispatch.tickets dengan imageUrl per tiket
      const updatedTickets = dispatch.tickets.map((t) => {
        const found = ticketImageResults.find((r) => r.ticketId === t.id);
        return found ? { ...t, ticket_image_url: found.imageUrl } : t;
      });
      const updatedDispatch = { ...dispatch, tickets: updatedTickets, primaryTicket: updatedTickets[0] || dispatch.primaryTicket };

      const primaryImageUrl = ticketImageResults[0]?.imageUrl;
      if (!primaryImageUrl) throw new Error('Gagal generate tiket grafis. Coba lagi.');

      if (mode === 'bot') {
        await sendAutoTicketViaBot({ ...updatedOrder, _updatedDispatch: updatedDispatch }, primaryImageUrl);
      } else {
        sendManualWhatsAppMessage({ ...updatedOrder, _updatedDispatch: updatedDispatch }, primaryImageUrl);
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
      const dispatch = buildTicketDispatchPayload(order);
      const ticketUnits = getOrderTicketUnits(order);

      showToast('Menyiapkan E-Ticket grafis...', 'info');

      const ticketImageResults = [];

      for (const t of ticketUnits) {
        // Skip regenerate jika sudah ada gambar grafis (dari Supabase Storage, bukan QR fallback)
        const hasGrafis = t.ticket_image_url && !t.ticket_image_url.includes('api.qrserver.com');
        if (hasGrafis) {
          ticketImageResults.push({ ticketId: t.id, imageUrl: t.ticket_image_url });
        } else {
          // Wajib generate grafis — tidak boleh fallback ke QR polos
          const imageUrl = await generateTicketImage(order, t);
          ticketImageResults.push({ ticketId: t.id, imageUrl });
          if (imageUrl && t.id) {
            supabase.from('tickets').update({ ticket_image_url: imageUrl }).eq('id', t.id).then(() => {});
          }
        }
      }

      const updatedTickets = dispatch.tickets.map((t) => {
        const found = ticketImageResults.find((r) => r.ticketId === t.id);
        return found ? { ...t, ticket_image_url: found.imageUrl } : t;
      });
      const updatedDispatch = { ...dispatch, tickets: updatedTickets, primaryTicket: updatedTickets[0] || dispatch.primaryTicket };

      const primaryImageUrl = ticketImageResults[0]?.imageUrl;
      if (!primaryImageUrl) throw new Error('Gagal generate tiket grafis. Coba lagi.');

      if (mode === 'bot') {
        await sendAutoTicketViaBot({ ...order, _updatedDispatch: updatedDispatch }, primaryImageUrl);
      } else {
        sendManualWhatsAppMessage({ ...order, _updatedDispatch: updatedDispatch }, primaryImageUrl);
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
    const failedOrders = [];

    // Snapshot kuota saat mulai bulk — akan di-decrement manual per iterasi
    // agar tidak baca state React yang stale
    let snapshotQuota = effectiveUser?.wa_quota ?? 0;
    let snapshotSent  = effectiveUser?.wa_messages_sent ?? 0;
    const isUnlimitedBulk = resolveWhatsAppMode(effectiveUser) === 'bot';

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
        const dispatch = buildTicketDispatchPayload(updatedOrder);
        const ticketUnits = getOrderTicketUnits(updatedOrder);

        // Generate grafis per tiket (sequential) — tidak boleh pakai QR polos
        const ticketUrlsArray = [];
        for (const t of ticketUnits) {
          const hasGrafis = t.ticket_image_url && !t.ticket_image_url.includes('api.qrserver.com');
          if (hasGrafis) {
            ticketUrlsArray.push(t.ticket_image_url);
          } else {
            try {
              const imageUrl = await generateTicketImage(updatedOrder, t);
              ticketUrlsArray.push(imageUrl);
              if (imageUrl && t.id) {
                await supabase.from('tickets').update({ ticket_image_url: imageUrl }).eq('id', t.id);
              }
            } catch (e) {
              console.warn(`[Bulk] Gagal generate grafis tiket ${t.unitCode}:`, e);
              ticketUrlsArray.push('');
            }
          }
        }
        ticketUrl = ticketUrlsArray[0] || '';

        // Update dispatch.tickets dengan imageUrl hasil generate
        const updatedBulkTickets = dispatch.tickets.map((t, idx) => ({
          ...t,
          ticket_image_url: ticketUrlsArray[idx] || t.ticket_image_url || '',
        }));
        const updatedBulkDispatch = { ...dispatch, tickets: updatedBulkTickets, primaryTicket: updatedBulkTickets[0] || dispatch.primaryTicket };
        const hasMultipleBulkTickets = updatedBulkTickets.length > 1;

        // Kirim via bot
        const resolvedMode = resolveWhatsAppMode(effectiveUser);
        if (resolvedMode !== 'manual') {
          const waNumber = updatedOrder.guest_wa.replace(/[^0-9]/g, '');
          const eventName = updatedOrder.events?.name || 'Event LokTik';

          try {
            const response = await fetch(`${botServerUrl}/api/send-ticket-wa`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                waNumber,
                guestName: updatedOrder.guest_name,
                eventName,
                orderId: updatedBulkDispatch.orderLookupCode,
                ticketCount: updatedBulkDispatch.ticketCount,
                ticketDetails: updatedBulkDispatch.categoryDetails,
                ticketSummaryText: updatedBulkDispatch.ticketSummaryText,
                totalPrice: updatedOrder.total_price,
                ticketQrUrl: ticketUrl,
                isMixed: updatedBulkDispatch.isMixed,
                cekTiketUrl: `${window.location.hostname === 'localhost' ? `http://localhost:${window.location.port || 3000}` : 'https://loktik.web.id'}/?cek=${updatedBulkDispatch.orderLookupCode}`,
                ticketLinks: hasMultipleBulkTickets ? updatedBulkTickets.map(t => ({
                  name: t.categoryName,
                  url: t.ticket_image_url || '',
                })) : [],
              }),
            });
            const result = await response.json();
            if (result.success) {
              // Kurangi kuota di DB jika mode quota
              if (!isUnlimitedBulk && effectiveUser?.id) {
                deductWaQuota(effectiveUser.id).catch((err) => {
                  console.warn('[Bulk WA] deductWaQuota error:', err);
                });
              }
              // Track snapshot lokal agar progress bar & event akurat
              snapshotSent  += 1;
              if (!isUnlimitedBulk) snapshotQuota = Math.max(0, snapshotQuota - 1);
              // Update UI realtime per pesan
              setLiveEoData(() => ({
                wa_quota:         snapshotQuota,
                wa_messages_sent: snapshotSent,
                bot_access_bonus: effectiveUser?.botAccessBonus ?? false,
              }));
              window.dispatchEvent(new CustomEvent('wa-quota-updated', {
                detail: { wa_quota: snapshotQuota, wa_messages_sent: snapshotSent }
              }));
            }
          } catch (_) {
            // Bot offline — catat sebagai gagal tapi jangan stop seluruh batch
            failedOrders.push(updatedOrder.guest_name);
          }
        }
      } catch (err) {
        console.error(`Gagal memproses order ${order.id}:`, err);
        failedOrders.push(order.guest_name);
      }

      if (i < total - 1) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    setSelectedOrders([]);
    setBulkProcessing(false);
    setLoading(false);

    const successCount = total - failedOrders.length;
    if (failedOrders.length > 0) {
      showToast(
        `Selesai: ${successCount} berhasil, ${failedOrders.length} gagal (${failedOrders.join(', ')})`,
        'eo'
      );
    } else {
      showToast(`Selesai! ${total} pesanan disetujui & tiket terkirim via WA Bot.`, 'eo');
    }
  };

  const getOrderQty = (o) => o.tickets?.length || o.quantity || 1;

  const getOrderCategory = (o) => {
    if (o.tickets && o.tickets.length > 0) {
      const catNames = [...new Set(o.tickets.map((t) => t.ticket_categories?.name).filter(Boolean))];
      if (catNames.length > 0) return catNames.join(', ');
    }
    if (o.ticket_categories?.name) return o.ticket_categories.name;
    return 'Tiket Standard';
  };

  const formatGuestName = (name) => {
    if (!name) return 'OTS';
    let clean = String(name).replace(/^Pembeli\s+/i, '').trim();
    clean = clean.replace(/CASH\s*\/\s*TUNAI/i, 'CASH');
    return clean;
  };

  const sortOrdersByCategory = (orderList) => {
    return [...orderList].sort((a, b) => {
      const catA = getOrderCategory(a).toLowerCase();
      const catB = getOrderCategory(b).toLowerCase();
      return catA.localeCompare(catB);
    });
  };

  const exportToExcel = () => {
    if (filteredOrders.length === 0) {
      showToast('Tidak ada data pesanan untuk di-export ke Excel.', 'eo');
      return;
    }

    const eventTitle = selectedEventObj ? selectedEventObj.name : 'Semua Event';
    const filename = `Rekap_Penjualan_LokTik_${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}.xls`;

    const poOrders = sortOrdersByCategory(filteredOrders.filter((o) => !isOtsOrder(o)));
    const otsOrders = sortOrdersByCategory(filteredOrders.filter((o) => isOtsOrder(o)));

    const poPaid = poOrders.filter((o) => o.status === 'paid');
    const otsPaid = otsOrders.filter((o) => o.status === 'paid');

    const poOmset = poPaid.reduce((sum, o) => sum + (o.total_price || 0), 0);
    const otsOmset = otsPaid.reduce((sum, o) => sum + (o.total_price || 0), 0);
    const totalOmset = poOmset + otsOmset;

    const poTickets = poPaid.reduce((sum, o) => sum + getOrderQty(o), 0);
    const otsTickets = otsPaid.reduce((sum, o) => sum + getOrderQty(o), 0);
    const totalTicketsSold = poTickets + otsTickets;

    const generateRows = (orderList, isOtsList = false) => {
      if (orderList.length === 0) {
        return `
          <tr style="background-color: #ffffff;">
            <td colspan="10" style="padding: 12px; border: 1px solid #cbd5e1; text-align: center; color: #64748b; font-style: italic; white-space: nowrap;">
              Tidak ada data transaksi ${isOtsList ? 'Kasir Venue (OTS)' : 'Online Pre-Order (PO)'}.
            </td>
          </tr>
        `;
      }
      return orderList.map((o, idx) => {
        const seed = parseInt(o.id.replace(/[^0-9]/g, '').substring(0, 4) || '1312');
        const prettyCode = generatePrettyRedeemCode(o.events?.name || 'Event', seed);
        const orderType = isOtsList ? 'OTS' : 'PO';
        const categoryName = getOrderCategory(o);
        const qty = getOrderQty(o);
        const formattedName = formatGuestName(o.guest_name);

        const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        const statusBg = o.status === 'paid' ? '#e0f2fe' : o.status === 'need_reupload' ? '#fef3c7' : '#fef2f2';
        const statusColor = o.status === 'paid' ? '#0369a1' : o.status === 'need_reupload' ? '#b45309' : '#b91c1c';

        return `
          <tr style="background-color: ${rowBg}; font-family: Arial, sans-serif; font-size: 11px;">
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #64748b; white-space: nowrap;">${idx + 1}</td>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: ${isOtsList ? '#0369a1' : '#0284c7'}; white-space: nowrap;">${orderType}</td>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #0f172a; white-space: nowrap;">${prettyCode}</td>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b; white-space: nowrap;">${formattedName}</td>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-family: monospace; color: #334155; white-space: nowrap; mso-number-format:'\\@';">'${o.guest_wa}</td>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #0369a1; white-space: nowrap;">${categoryName}</td>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #0f172a; white-space: nowrap;">${qty}</td>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; color: #0f172a; white-space: nowrap;">${o.total_price || 0}</td>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; background-color: ${statusBg}; color: ${statusColor}; font-weight: bold; white-space: nowrap;">${o.status === 'paid' ? 'PAID' : o.status === 'need_reupload' ? 'REUPLOAD' : 'PENDING'}</td>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; color: #64748b; white-space: nowrap;">${formatDateTime(o.created_at)}</td>
          </tr>
        `;
      }).join('');
    };

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Rekap Penjualan LokTik</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Arial, sans-serif; }
          .title-banner { background-color: #0284c7; color: #ffffff; font-size: 16px; font-weight: bold; padding: 14px; text-align: left; }
          .meta-info { background-color: #e0f2fe; color: #0369a1; font-size: 11px; font-weight: bold; padding: 10px; border-bottom: 2px solid #0284c7; }
          .section-header { background-color: #0369a1; color: #ffffff; font-size: 12px; font-weight: bold; padding: 10px; text-transform: uppercase; }
          .table-header { background-color: #0284c7; color: #ffffff; font-size: 11px; font-weight: bold; padding: 10px; border: 1px solid #0284c7; text-align: left; }
          .summary-header { background-color: #0284c7; color: #ffffff; font-size: 11px; font-weight: bold; text-align: center; padding: 8px; border: 1px solid #0369a1; }
          .summary-cell { padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; font-size: 11px; }
        </style>
      </head>
      <body>
        <table border="0" cellspacing="0" cellpadding="0">
          <thead>
            <tr>
              <th colspan="10" class="title-banner">LOKTIK TICKETING DIRECT — LAPORAN REKAPITULASI PENJUALAN</th>
            </tr>
            <tr>
              <th colspan="10" class="meta-info">EVENT: ${eventTitle} | TANGGAL CETAK: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colspan="10" style="height: 15px;"></td></tr>
            
            <!-- RINGKASAN PENJUALAN -->
            <tr>
              <td colspan="4" class="section-header">RINGKASAN PENJUALAN EVENT</td>
            </tr>
            <tr>
              <td class="summary-header">Tipe Transaksi</td>
              <td class="summary-header">Total Order</td>
              <td class="summary-header">Total Tiket Terjual</td>
              <td class="summary-header">Total Omset (Rp)</td>
            </tr>
            <tr>
              <td class="summary-cell" style="background-color: #f0f9ff; color: #0284c7;">PO ONLINE</td>
              <td class="summary-cell">${poPaid.length}</td>
              <td class="summary-cell">${poTickets}</td>
              <td class="summary-cell" style="text-align: right; color: #0284c7;">${poOmset}</td>
            </tr>
            <tr>
              <td class="summary-cell" style="background-color: #f0f9ff; color: #0369a1;">OTS VENUE</td>
              <td class="summary-cell">${otsPaid.length}</td>
              <td class="summary-cell">${otsTickets}</td>
              <td class="summary-cell" style="text-align: right; color: #0369a1;">${otsOmset}</td>
            </tr>
            <tr>
              <td class="summary-cell" style="background-color: #0284c7; color: #ffffff;">GRAND TOTAL</td>
              <td class="summary-cell" style="background-color: #e0f2fe; color: #0f172a;">${filteredOrders.length}</td>
              <td class="summary-cell" style="background-color: #e0f2fe; color: #0f172a;">${totalTicketsSold}</td>
              <td class="summary-cell" style="background-color: #e0f2fe; text-align: right; font-size: 13px; color: #0f172a;">${totalOmset}</td>
            </tr>
            <tr><td colspan="10" style="height: 20px;"></td></tr>

            <!-- TABEL 1: DETAIL DAFTAR TRANSAKSI PO ONLINE -->
            <tr>
              <td colspan="10" class="section-header">1. TRANSAKSI PO ONLINE — ${poOrders.length} PESANAN</td>
            </tr>
            <tr>
              <td class="table-header" style="text-align: center; width: 40px; white-space: nowrap;">No</td>
              <td class="table-header" style="text-align: center; white-space: nowrap;">Tipe Pesanan</td>
              <td class="table-header" style="white-space: nowrap;">Kode Tiket</td>
              <td class="table-header" style="white-space: nowrap;">Nama Pembeli</td>
              <td class="table-header" style="white-space: nowrap;">No WhatsApp</td>
              <td class="table-header" style="white-space: nowrap;">Kategori Tiket</td>
              <td class="table-header" style="text-align: center; white-space: nowrap;">Qty</td>
              <td class="table-header" style="text-align: right; white-space: nowrap;">Total Bayar (Rp)</td>
              <td class="table-header" style="text-align: center; white-space: nowrap;">Status</td>
              <td class="table-header" style="white-space: nowrap;">Tanggal Pesan</td>
            </tr>
            ${generateRows(poOrders, false)}

            <tr><td colspan="10" style="height: 25px;"></td></tr>

            <!-- TABEL 2: DETAIL DAFTAR TRANSAKSI OTS VENUE -->
            <tr>
              <td colspan="10" class="section-header">2. TRANSAKSI OTS VENUE — ${otsOrders.length} TRANSAKSI</td>
            </tr>
            <tr>
              <td class="table-header" style="text-align: center; width: 40px; white-space: nowrap;">No</td>
              <td class="table-header" style="text-align: center; white-space: nowrap;">Tipe Pesanan</td>
              <td class="table-header" style="white-space: nowrap;">Kode Tiket</td>
              <td class="table-header" style="white-space: nowrap;">Nama Pembeli</td>
              <td class="table-header" style="white-space: nowrap;">No WhatsApp</td>
              <td class="table-header" style="white-space: nowrap;">Kategori Tiket</td>
              <td class="table-header" style="text-align: center; white-space: nowrap;">Qty</td>
              <td class="table-header" style="text-align: right; white-space: nowrap;">Total Bayar (Rp)</td>
              <td class="table-header" style="text-align: center; white-space: nowrap;">Status</td>
              <td class="table-header" style="white-space: nowrap;">Tanggal Pesan</td>
            </tr>
            ${generateRows(otsOrders, true)}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
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

    // Generate logo with blue background using canvas
    const generateLogoDataUri = () => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 3;
        canvas.width = 180 * scale;
        canvas.height = 80 * scale;
        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);
        // Fill solid Cyber Blue background
        ctx.fillStyle = '#0284c7';
        ctx.roundRect(0, 0, 180, 80, 10);
        ctx.fill();
        // Draw logo centered
        const ratio = Math.min(160 / img.width, 60 / img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;
        const x = (180 - w) / 2;
        const y = (80 - h) / 2;
        ctx.drawImage(img, x, y, w, h);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
      img.src = '/logo.png';
    });

    generateLogoDataUri().then((logoUri) => {
      const logoHtml = logoUri
        ? `<img src="${logoUri}" style="height: 80px; width: 180px; display: block; border-radius: 8px;" alt="LokTik Logo" />`
        : `<div style="background-color:#0284c7;padding:12px 20px;border-radius:8px;font-weight:900;font-size:18px;color:#fff;letter-spacing:1px;">LOKTIK</div>`;

    const poOrders = sortOrdersByCategory(filteredOrders.filter((o) => !isOtsOrder(o)));
    const otsOrders = sortOrdersByCategory(filteredOrders.filter((o) => isOtsOrder(o)));

    const poPaid = poOrders.filter((o) => o.status === 'paid');
    const otsPaid = otsOrders.filter((o) => o.status === 'paid');

    const poOmset = poPaid.reduce((sum, o) => sum + (o.total_price || 0), 0);
    const otsOmset = otsPaid.reduce((sum, o) => sum + (o.total_price || 0), 0);
    const totalOmset = poOmset + otsOmset;

    const poTickets = poPaid.reduce((sum, o) => sum + getOrderQty(o), 0);
    const otsTickets = otsPaid.reduce((sum, o) => sum + getOrderQty(o), 0);
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
        const categoryName = getOrderCategory(o);
        const qty = getOrderQty(o);
        const formattedName = formatGuestName(o.guest_name);
        return `
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:7px 10px;text-align:center;color:#64748b;font-weight:600;white-space:nowrap;">${idx + 1}</td>
            <td style="padding:7px 10px;font-family:monospace;font-weight:700;color:#0f172a;white-space:nowrap;">${prettyCode}</td>
            <td style="padding:7px 10px;font-weight:700;color:#1e293b;white-space:nowrap;">${formattedName}</td>
            <td style="padding:7px 10px;font-family:monospace;color:#475569;white-space:nowrap;">${o.guest_wa}</td>
            <td style="padding:7px 10px;color:#334155;font-weight:600;white-space:nowrap;">${categoryName} (${qty}x)</td>
            <td style="padding:7px 10px;text-align:right;font-family:monospace;font-weight:700;color:#0f172a;white-space:nowrap;">${formatRupiah(o.total_price)}</td>
            <td style="padding:7px 10px;text-align:center;white-space:nowrap;">
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
        const categoryName = getOrderCategory(o);
        const qty = getOrderQty(o);
        const formattedName = formatGuestName(o.guest_name);
        return `
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:7px 10px;text-align:center;color:#64748b;font-weight:600;white-space:nowrap;">${idx + 1}</td>
            <td style="padding:7px 10px;font-family:monospace;font-weight:700;color:#0f172a;white-space:nowrap;">${prettyCode}</td>
            <td style="padding:7px 10px;font-weight:700;color:#0369a1;white-space:nowrap;">${formattedName}</td>
            <td style="padding:7px 10px;color:#334155;font-weight:600;white-space:nowrap;">${categoryName} (${qty}x)</td>
            <td style="padding:7px 10px;text-align:right;font-family:monospace;font-weight:700;color:#0f172a;white-space:nowrap;">${formatRupiah(o.total_price)}</td>
            <td style="padding:7px 10px;text-align:center;white-space:nowrap;">
              <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:800;background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;">
                OTS LUNAS
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
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 30px; color: #1e293b; font-size: 11px; background: #fff; }
          .header { border-bottom: 3px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 900; text-transform: uppercase; color: #0284c7; letter-spacing: -0.5px; }
          .header p { margin: 4px 0 0 0; color: #0369a1; font-size: 11px; font-weight: 600; }
          
          .logo-container { background-color: #0284c7 !important; padding: 12px 20px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.3); }
          .logo-img { height: 52px; width: auto; display: block; mix-blend-mode: multiply; filter: contrast(1.2); }

          .stats-grid { display: flex; gap: 12px; margin-bottom: 24px; }
          .stat-box { border: 1.5px solid #0284c7; padding: 12px 14px; flex: 1; border-radius: 6px; background: #f0f9ff !important; }
          .stat-box h4 { margin: 0 0 4px 0; color: #0369a1; font-size: 10px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; }
          .stat-box .val { font-size: 18px; font-weight: 900; margin: 0; color: #0284c7; }
          .stat-box .sub { font-size: 10px; color: #0284c7; margin-top: 2px; font-weight: 600; }
          
          .section-title { font-size: 12px; font-weight: 900; text-transform: uppercase; margin: 20px 0 8px 0; padding-bottom: 4px; border-bottom: 2px solid #0284c7; color: #0369a1; display: flex; justify-content: space-between; align-items: center; }
          .section-badge { background: #e0f2fe !important; border: 1px solid #0284c7; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; color: #0369a1; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
          th { background: #0284c7 !important; color: #ffffff !important; padding: 8px 10px; border: 1px solid #0284c7; text-align: left; text-transform: uppercase; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; }
          
          .footer-section { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 10px; color: #64748b; }
          @media print { .top-action-bar { display: none !important; } button { display: none; } }
        </style>
      </head>
      <body>
        <div class="top-action-bar" style="background:#0284c7; padding:12px 20px; margin:-30px -30px 20px -30px; display:flex; justify-content:space-between; align-items:center;">
          <span style="color:#ffffff; font-weight:800; font-size:12px; font-family:sans-serif;">PRATINJAU DOKUMEN LAPORAN PENJUALAN</span>
          <button onclick="window.print()" style="background:#ffffff; color:#0284c7; border:none; padding:8px 16px; border-radius:6px; font-weight:800; font-size:11px; cursor:pointer; font-family:sans-serif;">
            CETAK / SIMPAN KE PDF
          </button>
        </div>
        <div class="header">
          <div style="display: flex; align-items: center; gap: 16px;">
            ${logoHtml}
            <div>
              <h1 style="margin: 0; font-size: 20px; font-weight: 900; text-transform: uppercase; color: #0284c7; letter-spacing: -0.5px;">LOKTIK — LAPORAN REKAPITULASI PENJUALAN</h1>
              <p style="margin: 4px 0 0 0; color: #0369a1; font-size: 11px; font-weight: 700;"><strong>EVENT:</strong> ${eventTitle} | <strong>PANITIA EO:</strong> ${eoUsername}</p>
            </div>
          </div>
          <div style="text-align: right; color: #0369a1; font-size: 11px; font-weight: 700;">
            <p style="margin: 0;"><strong>TANGGAL CETAK:</strong> ${new Date().toLocaleDateString('id-ID')}</p>
          </div>
        </div>

        <!-- SUMMARY STATS GRID -->
        <div class="stats-grid">
          <div class="stat-box">
            <h4>Total Omset</h4>
            <p class="val">${formatRupiah(totalOmset)}</p>
            <p class="sub">${totalTicketsSold} Tiket Terjual</p>
          </div>
          <div class="stat-box">
            <h4>1. Omset PO Online</h4>
            <p class="val">${formatRupiah(poOmset)}</p>
            <p class="sub">${poTickets} Tiket (${poPaid.length} Transaksi)</p>
          </div>
          <div class="stat-box">
            <h4>2. Omset OTS Venue</h4>
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

      </body>
      </html>
    `);
      reportWindow.document.close();
    });
  };

  return (
    <div className="space-y-6 text-left">
      <TicketGraphic
        ref={ticketRef}
        eventName={generatingTicket?.eventName || 'Event LokTik'}
        guestName={generatingTicket?.guestName || 'Nama Tamu'}
        ticketCode={generatingTicket?.ticketCode || 'LT1029'}
        displayUid={generatingTicket?.displayUid}
        isPaid={generatingTicket?.isPaid !== false}
        categoryName={generatingTicket?.categoryName}
        ticketLabel={generatingTicket?.ticketLabel}
        orderLookupCode={generatingTicket?.orderLookupCode}
        isReady={Boolean(generatingTicket)}
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
                <Sparkles className="w-4 h-4 text-brand-yellow shrink-0" />
                <span className="truncate">{selectedEventObj?.name || 'PILIH EVENT DILAYANI'}</span>
              </div>
              {isDropdownOpen ? <ChevronUp className="w-4 h-4 text-brand-green" /> : <ChevronDown className="w-4 h-4 text-brand-green" />}
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#121212] border-2 border-brand-green rounded-md shadow-[0_15px_30px_rgba(0,0,0,0.9)] overflow-hidden z-50 py-1 divide-y divide-neutral-800">
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
          {waMode === 'bot' && (
            <Badge variant={botStatus === 'online' ? 'green' : 'yellow'}>
              <Bot className="w-3 h-3 mr-1 inline" />
              {botStatus === 'online' ? 'BOT ONLINE' : 'BOT OFFLINE'}
            </Badge>
          )}
          {waMode === 'quota' && (
            <Badge variant={(effectiveUser?.wa_quota ?? 0) <= 0 ? 'red' : (effectiveUser?.wa_quota ?? 0) <= 50 ? 'yellow' : 'blue'}>
              <MessageSquare className="w-3 h-3 mr-1 inline" />
              KUOTA WA: {(effectiveUser?.wa_quota ?? 0).toLocaleString('id-ID')}
            </Badge>
          )}
          {waMode === 'manual' && (
            <Badge variant="yellow">
              <Send className="w-3 h-3 mr-1 inline" />
              MANUAL WA (PAKET {userPlan === 'event_pass' ? 'EVENT PASS' : userPlan === '1_month' ? '1 BULAN' : userPlan === '3_months' ? '3 BULAN' : userPlan === '6_months' ? '6 BULAN PRO' : userPlan.toUpperCase()})
            </Badge>
          )}
          <Button variant="green" size="sm" onClick={exportToExcel} className="font-bold">
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> EXPORT EXCEL
          </Button>
          <Button variant="purple" size="sm" onClick={exportToPDF} className="font-bold">
            <FileText className="w-3.5 h-3.5 mr-1" /> EXPORT PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchData(eoUsername || user?.username || user?.name);
              fetchLiveEoData(user?.id);
            }}
            disabled={loading}
          >
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
                      <td className="p-3 font-bold text-white">{formatGuestName(o.guest_name)}</td>
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
                          {o.status === 'paid' ? 'PAID' : o.status === 'need_reupload' ? 'REUPLOAD' : 'PENDING'}
                        </Badge>
                      </td>

                      <td className="p-3">
                        {hasScannedTicket ? (
                          <Badge variant="red" className="text-[10px]">
                            SCANNED
                          </Badge>
                        ) : o.status === 'paid' ? (
                          <Badge variant="green" className="text-[10px]">
                            ACTIVE
                          </Badge>
                        ) : (
                          <span className="text-neutral-500 font-mono text-[11px]">-</span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        {o.status === 'pending' && (
                          <div className="flex items-center justify-end space-x-1.5 whitespace-nowrap">
                            {hasBotAccess && (
                              <button
                                type="button"
                                onClick={() => handleApprove(o, 'bot')}
                                className="h-8 px-3 font-black text-[10px] tracking-wider uppercase bg-brand-green/10 border border-brand-green/70 text-brand-green hover:bg-brand-green hover:text-black rounded-md transition-all shadow-[0_0_12px_rgba(57,255,20,0.15)] flex items-center justify-center space-x-1 shrink-0"
                              >
                                <Bot className="w-3.5 h-3.5 shrink-0" />
                                <span>APPROVE (BOT)</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleApprove(o, 'manual')}
                              className="h-8 px-3 font-black text-[10px] tracking-wider uppercase bg-brand-purple/10 border border-brand-purple/70 text-brand-purple hover:bg-brand-purple hover:text-white rounded-md transition-all flex items-center justify-center space-x-1 shrink-0"
                            >
                              <Send className="w-3.5 h-3.5 shrink-0" />
                              <span>{hasBotAccess ? 'WA MANUAL' : 'APPROVE (WA MANUAL)'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(o.id)}
                              className="h-8 w-8 min-w-[32px] font-black bg-red-950/40 border border-red-500/50 text-red-400 hover:bg-red-600 hover:text-white rounded-md transition-all flex items-center justify-center shrink-0"
                              title="Tolak Pesanan"
                            >
                              <X className="w-3.5 h-3.5 shrink-0" />
                            </button>
                          </div>
                        )}
                        {o.status === 'paid' && (
                          <div className="flex items-center justify-end space-x-1.5 whitespace-nowrap">
                            {hasBotAccess && (
                              <button
                                type="button"
                                onClick={() => handleResend(o, 'bot')}
                                className="h-8 px-3 font-black text-[10px] tracking-wider uppercase bg-neutral-900 border border-neutral-700 text-neutral-300 hover:border-brand-green hover:text-brand-green rounded-md transition-all flex items-center justify-center space-x-1 shrink-0"
                              >
                                <Bot className="w-3.5 h-3.5 text-brand-green shrink-0" />
                                <span>BOT RE-SEND</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleResend(o, 'manual')}
                              className="h-8 px-3 font-black text-[10px] tracking-wider uppercase bg-brand-purple/10 border border-brand-purple/70 text-brand-purple hover:bg-brand-purple hover:text-white rounded-md transition-all flex items-center justify-center space-x-1 shrink-0"
                            >
                              <Send className="w-3.5 h-3.5 shrink-0" />
                              <span>{hasBotAccess ? 'WA MANUAL' : 'KIRIM ULANG WA'}</span>
                            </button>
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
                  const cleanName = (o.guest_name || 'OTS').replace(/\s*\d{2}\.\d{2}\s*/g, '').trim();

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
                        <Badge variant="green">PAID (OTS)</Badge>
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

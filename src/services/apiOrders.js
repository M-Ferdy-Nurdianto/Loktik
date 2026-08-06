import { supabase } from './supabase';
import { generatePrettyRedeemCode, formatTicketUnitCode } from '../utils/formatters';

/**
 * Upload compressed WebP payment proof to Supabase Storage.
 */
export const uploadPaymentProof = async (compressedFile) => {
  const fileName = `proof_${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
  const { data, error } = await supabase.storage
    .from('payment-proofs')
    .upload(fileName, compressedFile, {
      contentType: 'image/webp',
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw new Error('Gagal mengunggah bukti transfer. Coba lagi.');

  const { data: publicUrlData } = supabase.storage
    .from('payment-proofs')
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
};

/**
 * Submit checkout order and generate individual ticket UUIDs.
 * Supports online buyer orders and OTS cashier fast-issue orders.
 */
export const createGuestOrder = async (orderPayload, items) => {
  for (const item of items) {
    if (item.categoryId) {
      const { data: success, error: rpcError } = await supabase.rpc('deduct_quota_atomic', {
        target_category_id: item.categoryId,
        qty_requested: item.quantity,
      });

      if (rpcError) {
        throw new Error(rpcError.message || `Gagal memesan tiket '${item.categoryName}'.`);
      }
      if (!success) {
        throw new Error(`Kuota tiket '${item.categoryName}' habis atau tidak mencukupi.`);
      }
    }
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([orderPayload])
    .select('id, event_id, total_price, status, created_at')
    .single();

  if (orderError) throw new Error(`Gagal memproses pesanan: ${orderError.message}`);

  const ticketRows = [];
  for (const item of items) {
    for (let i = 0; i < item.quantity; i++) {
      ticketRows.push({
        order_id: order.id,
        ticket_category_id: item.categoryId || null,
        is_scanned: item.isScanned || false,
        scanned_at: item.isScanned ? new Date().toISOString() : null,
        scanned_by: item.isScanned ? 'Kasir OTS Venue' : null,
      });
    }
  }

  const { error: ticketsError } = await supabase.from('tickets').insert(ticketRows);
  if (ticketsError) throw new Error(`Gagal membuat unit tiket: ${ticketsError.message}`);

  clearEoOrdersCache();
  return order;
};

/**
 * Search buyer orders by Name, WA, or Order ID (public self-service lookup).
 */
export const searchOrdersByBuyer = async (queryTerm) => {
  if (!queryTerm || queryTerm.trim().length < 2) return [];
  const rawTerm = queryTerm.trim();
  const termLower = rawTerm.toLowerCase();

  try {
    // 1. Fetch recent orders from Supabase DB
    const { data: rawOrders, error } = await supabase
      .from('orders')
      .select('id, event_id, guest_name, guest_wa, total_price, status, created_at')
      .order('created_at', { ascending: false })
      .limit(300);

    if (error || !rawOrders || rawOrders.length === 0) return [];

    // 2. Fetch associated event names to compute exact pretty codes
    const eventIds = [...new Set(rawOrders.map((o) => o.event_id).filter(Boolean))];
    let eventsMap = {};

    if (eventIds.length > 0) {
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, name')
        .in('id', eventIds);

      if (eventsData) {
        eventsData.forEach((ev) => {
          eventsMap[ev.id] = ev;
        });
      }
    }

    // 3. Fetch ticket units to support per-ticket lookup and mixed-category orders
    const orderIds = rawOrders.map((o) => o.id);
    const ticketsByOrderId = new Map();

    if (orderIds.length > 0) {
      const { data: ticketsData } = await supabase
        .from('tickets')
        .select('id, order_id, barcode_uuid, is_scanned, scanned_at, ticket_image_url, ticket_categories(name)')
        .in('order_id', orderIds);

      if (ticketsData) {
        ticketsData.forEach((ticket) => {
          const normalizedTicket = {
            ...ticket,
            unit_code: formatTicketUnitCode(ticket.barcode_uuid, ticket.id),
            category_name: ticket.ticket_categories?.name || 'Tiket Regular',
          };
          const current = ticketsByOrderId.get(ticket.order_id) || [];
          current.push(normalizedTicket);
          ticketsByOrderId.set(ticket.order_id, current);
        });
      }
    }

    // 4. Filter orders matching Order UUID, Order Lookup Code, or Ticket Unit Code
    //    NOTE: Pencarian by nama/WA sengaja dihapus dari PUBLIK.
    const matchedOrders = rawOrders.filter((o) => {
      const idStr = String(o.id || '').toLowerCase();
      const eventObj = eventsMap[o.event_id];
      const seed = parseInt(o.id.replace(/[^0-9]/g, '').substring(0, 4) || '1312');
      const orderLookupCode = generatePrettyRedeemCode(eventObj?.name, seed).toLowerCase();
      const orderTickets = ticketsByOrderId.get(o.id) || [];
      const matchesTicketUnit = orderTickets.some((ticket) => {
        const unitCode = String(ticket.unit_code || '').toLowerCase();
        const barcodeUuid = String(ticket.barcode_uuid || '').toLowerCase();
        return unitCode.includes(termLower) || barcodeUuid.includes(termLower);
      });

      return idStr.includes(termLower) || orderLookupCode.includes(termLower) || matchesTicketUnit;
    });

    return matchedOrders.slice(0, 15).map((o) => {
      const orderTickets = ticketsByOrderId.get(o.id) || [];
      const seed = parseInt(o.id.replace(/[^0-9]/g, '').substring(0, 4) || '1312');

      return {
        ...o,
        is_scanned: orderTickets.some((ticket) => ticket.is_scanned),
        events: eventsMap[o.event_id] || { name: 'Event LokTik' },
        order_lookup_code: generatePrettyRedeemCode((eventsMap[o.event_id] || {}).name, seed),
        ticket_count: orderTickets.length,
        tickets: orderTickets,
      };
    });
  } catch (err) {
    console.warn('Gagal mencari e-tiket:', err);
    return [];
  }
};

/**
 * Fix/Update WA number on an order (buyer self-service).
 */
export const updateOrderWaNumber = async (orderId, newWa) => {
  const cleanWa = newWa.replace(/[^0-9]/g, '');
  if (cleanWa.length < 10) throw new Error('Nomor WhatsApp minimal 10 digit.');

  const { error } = await supabase
    .from('orders')
    .update({ guest_wa: cleanWa })
    .eq('id', orderId);

  if (error) throw new Error('Gagal memperbarui nomor WhatsApp.');
  return true;
};

// Simple in-memory cache to boost mobile loading speed and prevent DB spam (15s TTL)
const ordersCache = {
  eoOrders: new Map(), // username -> { data, expiry }
};

const CACHE_TTL = 15000;

export const clearEoOrdersCache = (username = null) => {
  if (username) {
    ordersCache.eoOrders.delete(username.toLowerCase());
  } else {
    ordersCache.eoOrders.clear();
  }
};

/**
 * Fetch live orders for EO Dashboard with tickets scan status and EO data isolation.
 */
export const getLiveOrdersForEo = async (eoUsername = null) => {
  if (!eoUsername) return [];
  const cacheKey = eoUsername.trim().toLowerCase();
  const now = Date.now();
  const cached = ordersCache.eoOrders.get(cacheKey);
  if (cached && now < cached.expiry) {
    return cached.data;
  }

  let targetEventIds = null;

  if (cacheKey !== 'broferadm') {
    const firstWord = cacheKey.split(' ')[0];
    const { data: myEvents, error: evErr } = await supabase
      .from('events')
      .select('id')
      .ilike('created_by', `${firstWord}%`);

    if (evErr) throw new Error(evErr.message);
    targetEventIds = (myEvents || []).map((e) => e.id);

    if (targetEventIds.length === 0) {
      return [];
    }
  }

  let query = supabase
    .from('orders')
    .select('id, event_id, guest_name, guest_wa, guest_ig, total_price, payment_proof_url, status, created_at, payment_method, is_ots, events(name), tickets(id, barcode_uuid, is_scanned, ticket_image_url, ticket_categories(id, name, price))')
    .order('created_at', { ascending: false });

  if (targetEventIds && targetEventIds.length > 0) {
    query = query.in('event_id', targetEventIds);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  
  const res = data || [];
  ordersCache.eoOrders.set(cacheKey, { data: res, expiry: now + CACHE_TTL });
  return res;
};

/**
 * EO Dashboard: Approve / Reject order & update status ('paid' or 'need_reupload')
 */
export const updateOrderStatus = async (orderId, newStatus) => {
  clearEoOrdersCache();
  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId);

  if (error) throw new Error('Gagal memperbarui status pesanan.');
  return true;
};

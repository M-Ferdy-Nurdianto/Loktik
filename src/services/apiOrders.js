import { supabase } from './supabase';
import { generatePrettyRedeemCode } from '../utils/formatters';

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

      if (rpcError || !success) {
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
  const cleanDigits = rawTerm.replace(/[^0-9]/g, '');

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

    // 3. Filter orders matching: Name, WA, Order UUID, or exact Pretty Code (e.g. GM1727)
    const matchedOrders = rawOrders.filter((o) => {
      const idStr = String(o.id || '').toLowerCase();
      const nameStr = String(o.guest_name || '').toLowerCase();
      const waStr = String(o.guest_wa || '').replace(/[^0-9]/g, '');

      // Compute pretty code for this order
      const eventObj = eventsMap[o.event_id];
      const seed = parseInt(o.id.replace(/[^0-9]/g, '').substring(0, 4) || '1312');
      const prettyCode = generatePrettyRedeemCode(eventObj?.name, seed).toLowerCase();

      // Check match conditions
      const matchesName = nameStr.includes(termLower);
      const matchesId = idStr.includes(termLower);
      const matchesPrettyCode = prettyCode.includes(termLower);
      const matchesWa = cleanDigits.length >= 3 && waStr.includes(cleanDigits);

      return matchesName || matchesId || matchesPrettyCode || matchesWa;
    });

    // 4. Check if any order tickets have been scanned at the gate
    const matchedOrderIds = matchedOrders.map((o) => o.id);
    let scannedOrderIdsSet = new Set();

    if (matchedOrderIds.length > 0) {
      const { data: ticketsData } = await supabase
        .from('tickets')
        .select('order_id, is_scanned')
        .in('order_id', matchedOrderIds)
        .eq('is_scanned', true);

      if (ticketsData) {
        ticketsData.forEach((t) => scannedOrderIdsSet.add(t.order_id));
      }
    }

    return matchedOrders.slice(0, 15).map((o) => ({
      ...o,
      is_scanned: scannedOrderIdsSet.has(o.id),
      events: eventsMap[o.event_id] || { name: 'Event LokTik' },
    }));
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
    .select('id, event_id, guest_name, guest_wa, guest_ig, total_price, payment_proof_url, status, created_at, events(name), tickets(id, is_scanned, ticket_categories(name))')
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

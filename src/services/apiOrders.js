import { supabase } from './supabase';

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

  return order;
};

/**
 * Fetch live orders for EO Dashboard with tickets scan status and EO data isolation.
 */
export const getLiveOrdersForEo = async (eoUsername = null) => {
  if (!eoUsername) return [];

  let targetEventIds = null;

  if (eoUsername.toLowerCase() !== 'broferadm') {
    const { data: myEvents, error: evErr } = await supabase
      .from('events')
      .select('id')
      .eq('created_by', eoUsername);

    if (evErr) throw new Error(evErr.message);
    targetEventIds = (myEvents || []).map((e) => e.id);

    if (targetEventIds.length === 0) {
      return [];
    }
  }

  let query = supabase
    .from('orders')
    .select('id, event_id, guest_name, guest_wa, guest_ig, total_price, payment_proof_url, status, created_at, events(name), tickets(id, is_scanned)')
    .order('created_at', { ascending: false });

  if (targetEventIds && targetEventIds.length > 0) {
    query = query.in('event_id', targetEventIds);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
};

/**
 * EO Dashboard: Approve / Reject order & update status ('paid' or 'need_reupload')
 */
export const updateOrderStatus = async (orderId, newStatus) => {
  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId);

  if (error) throw new Error('Gagal memperbarui status pesanan.');
  return true;
};

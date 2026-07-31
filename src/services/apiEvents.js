import { supabase } from './supabase';

// Simple in-memory cache to boost mobile loading speed and prevent DB spam (15s TTL)
export const cacheStore = {
  activeEvents: null,
  activeEventsExpiry: 0,
  eventDetails: new Map(), // slug -> { data, expiry }
  eoEvents: new Map(), // username -> { data, expiry }
};

const CACHE_TTL = 15000; // 15 seconds

export const clearEoEventsCache = (username = null) => {
  if (username) {
    cacheStore.eoEvents.delete(username.toLowerCase());
  } else {
    cacheStore.eoEvents.clear();
  }
};

const clearPublicEventsCache = () => {
  cacheStore.activeEvents = null;
  cacheStore.activeEventsExpiry = 0;
  cacheStore.eventDetails.clear();
  clearEoEventsCache();
};

/**
 * Helper to delete a file from Supabase Storage given its public URL.
 */
export const deleteStorageFileByUrl = async (url, bucketName) => {
  if (!url || typeof url !== 'string') return;
  try {
    const defaultBucket = bucketName || (url.includes('/event-posters/') ? 'event-posters' : url.includes('/qris-codes/') ? 'qris-codes' : 'payment-proofs');
    const parts = url.split(`/${defaultBucket}/`);
    if (parts.length > 1) {
      const fileName = parts[1].split('?')[0];
      if (fileName) {
        await supabase.storage.from(defaultBucket).remove([decodeURIComponent(fileName)]);
      }
    }
  } catch (err) {
    console.warn(`Storage auto-purge warning (${bucketName}):`, err?.message);
  }
};

/**
 * Automatically purge events & related orders/tickets/storage files older than 14 days (2 weeks).
 */
export const purgeExpiredEvents = async () => {
  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data: expiredEvents } = await supabase
      .from('events')
      .select('id, poster_url, payment_details')
      .lt('event_date', fourteenDaysAgo);

    if (expiredEvents && expiredEvents.length > 0) {
      const expiredIds = expiredEvents.map((e) => e.id);

      // Clean storage files for expired events & orders
      for (const evt of expiredEvents) {
        if (evt.poster_url) await deleteStorageFileByUrl(evt.poster_url, 'event-posters');
        const qrisUrl = evt.payment_details?.qris_url || evt.payment_details?.qris_image;
        if (qrisUrl) await deleteStorageFileByUrl(qrisUrl, 'qris-codes');
      }

      const { data: expiredOrders } = await supabase
        .from('orders')
        .select('payment_proof_url')
        .in('event_id', expiredIds);

      if (expiredOrders) {
        for (const ord of expiredOrders) {
          if (ord.payment_proof_url) await deleteStorageFileByUrl(ord.payment_proof_url, 'payment-proofs');
        }
      }

      await supabase.from('staff_accounts').delete().in('event_id', expiredIds);
      await supabase.from('orders').delete().in('event_id', expiredIds);
      await supabase.from('ticket_categories').delete().in('event_id', expiredIds);
      await supabase.from('events').delete().in('id', expiredIds);
    }
  } catch (err) {
    console.warn('Auto purge expired events notice:', err?.message);
  }
};

/**
 * Fetch active events for landing page catalog (public for all visitors).
 */
export const getActiveEvents = async () => {
  // Fire background cleanup for expired events > 14 days
  purgeExpiredEvents();

  const now = Date.now();
  if (cacheStore.activeEvents && now < cacheStore.activeEventsExpiry) {
    return cacheStore.activeEvents;
  }

  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('events')
    .select('id, slug, name, description, location, poster_url, event_date, open_gate, status, payment_details, ticket_categories(price)')
    .eq('status', 'active')
    .gte('event_date', fourteenDaysAgo)
    .order('event_date', { ascending: true });

  if (error) throw new Error(error.message);

  cacheStore.activeEvents = data || [];
  cacheStore.activeEventsExpiry = now + CACHE_TTL;

  return cacheStore.activeEvents;
};

/**
 * Fetch events for EO dashboard, isolated by EO username.
 */
export const getAllEventsForEo = async (eoUsername = null) => {
  if (!eoUsername) return [];
  const cacheKey = eoUsername.trim().toLowerCase();
  const now = Date.now();
  const cached = cacheStore.eoEvents.get(cacheKey);
  if (cached && now < cached.expiry) {
    return cached.data;
  }

  let query = supabase
    .from('events')
    .select('id, eo_id, created_by, slug, name, description, location, poster_url, event_date, open_gate, payment_details, status, created_at')
    .order('created_at', { ascending: false });

  if (cacheKey !== 'broferadm') {
    const firstWord = cacheKey.split(' ')[0];
    query = query.ilike('created_by', `${firstWord}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const res = data || [];
  cacheStore.eoEvents.set(cacheKey, { data: res, expiry: now + CACHE_TTL });
  return res;
};

export const getEventBySlug = async (slug) => {
  if (!slug) return null;
  const decoded = decodeURIComponent(slug).trim();
  const slugWithDashes = decoded.toLowerCase().replace(/\s+/g, '-');
  const now = Date.now();

  const cached = cacheStore.eventDetails.get(slugWithDashes);
  if (cached && now < cached.expiry) {
    return cached.data;
  }

  // 1. Search by exact slug or formatted slug with dashes
  let { data: event } = await supabase
    .from('events')
    .select('id, eo_id, created_by, slug, name, description, location, poster_url, event_date, open_gate, payment_details, status')
    .or(`slug.eq.${slugWithDashes},slug.eq.${decoded},slug.ilike.%${slugWithDashes}%`)
    .limit(1)
    .maybeSingle();

  // 2. Fallback: Search by name if slug match yields nothing
  if (!event) {
    const firstWord = decoded.split(' ')[0];
    const { data: fallbackEvent } = await supabase
      .from('events')
      .select('id, eo_id, created_by, slug, name, description, location, poster_url, event_date, open_gate, payment_details, status')
      .or(`name.ilike.%${firstWord}%,id.eq.${decoded}`)
      .limit(1)
      .maybeSingle();
    event = fallbackEvent;
  }

  if (!event) return null;

  const { data: tiers } = await supabase
    .from('ticket_categories')
    .select('id, name, price, quota, start_po, end_po')
    .eq('event_id', event.id);

  const res = { ...event, ticket_categories: tiers || [] };
  cacheStore.eventDetails.set(slugWithDashes, { data: res, expiry: now + CACHE_TTL });
  return res;
};

/**
 * Upload WebP Poster Image to 'event-posters' bucket in Supabase Storage.
 */
export const uploadEventPoster = async (compressedWebPFile) => {
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.webp`;
  const { data, error } = await supabase.storage
    .from('event-posters')
    .upload(fileName, compressedWebPFile, {
      contentType: 'image/webp',
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw new Error('Gagal mengunggah poster event. Coba lagi.');

  const { data: publicUrlData } = supabase.storage
    .from('event-posters')
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
};

/**
 * Upload WebP QRIS Image to 'qris-codes' bucket in Supabase Storage.
 */
export const uploadQrisCode = async (compressedWebPFile) => {
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.webp`;
  const { data, error } = await supabase.storage
    .from('qris-codes')
    .upload(fileName, compressedWebPFile, {
      contentType: 'image/webp',
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw new Error('Gagal mengunggah gambar QRIS. Coba lagi.');

  const { data: publicUrlData } = supabase.storage
    .from('qris-codes')
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
};

/**
 * Create event & insert ticket categories in Supabase DB with created_by.
 */
export const createEventWithTiers = async (eventPayload, categoryRows) => {
  clearPublicEventsCache();
  const { data: newEvent, error: eventError } = await supabase
    .from('events')
    .insert([eventPayload])
    .select('id, slug, name')
    .single();

  if (eventError) throw new Error(`Gagal membuat event: ${eventError.message}`);

  if (categoryRows && categoryRows.length > 0) {
    const formattedCategories = categoryRows.map((cat) => ({
      event_id: newEvent.id,
      name: cat.name,
      price: parseFloat(cat.price) || 0,
      quota: cat.quota === '' || cat.quota === null ? null : parseInt(cat.quota),
      description: cat.description || '',
      start_po: cat.start_po || null,
      end_po: cat.end_po || null,
    }));

    const { error: tiersError } = await supabase
      .from('ticket_categories')
      .insert(formattedCategories);

    if (tiersError) throw new Error(`Gagal menyimpan kategori tiket: ${tiersError.message}`);
  }

  return newEvent;
};

/**
 * Update event details or status in Supabase DB.
 */
export const updateEventStatus = async (eventId, newStatus) => {
  clearPublicEventsCache();
  const { error } = await supabase
    .from('events')
    .update({ status: newStatus })
    .eq('id', eventId);

  if (error) throw new Error('Gagal mengupdate status event.');
  return true;
};

/**
 * Update event details & categories in Supabase DB.
 */
export const updateEventData = async (eventId, eventPayload, categoryRows) => {
  clearPublicEventsCache();

  // Fetch current urls to check for changes and delete old files
  const { data: currentEvent } = await supabase
    .from('events')
    .select('poster_url, payment_details')
    .eq('id', eventId)
    .single();

  if (currentEvent) {
    if (currentEvent.poster_url && eventPayload.poster_url && currentEvent.poster_url !== eventPayload.poster_url) {
      await deleteStorageFileByUrl(currentEvent.poster_url, 'event-posters');
    }
    const currentQris = currentEvent.payment_details?.qris_url || currentEvent.payment_details?.qris;
    const newQris = eventPayload.payment_details?.qris_url || eventPayload.payment_details?.qris;
    if (currentQris && newQris && currentQris !== newQris) {
      await deleteStorageFileByUrl(currentQris, 'qris-codes');
    }
  }

  const { error: eventError } = await supabase
    .from('events')
    .update(eventPayload)
    .eq('id', eventId);

  if (eventError) throw new Error(`Gagal memperbarui event: ${eventError.message}`);

  if (categoryRows && categoryRows.length > 0) {
    await supabase.from('ticket_categories').delete().eq('event_id', eventId);

    const formattedCategories = categoryRows.map((cat) => ({
      event_id: eventId,
      name: cat.name,
      price: parseFloat(cat.price) || 0,
      quota: cat.quota === '' || cat.quota === null ? null : parseInt(cat.quota),
      description: cat.description || '',
      start_po: cat.start_po || null,
      end_po: cat.end_po || null,
    }));

    const { error: tiersError } = await supabase
      .from('ticket_categories')
      .insert(formattedCategories);

    if (tiersError) throw new Error(`Gagal memperbarui kategori tiket: ${tiersError.message}`);
  }

  return true;
};

/**
 * Permanently delete event, related database rows, and all storage images (poster, QRIS, payment proofs).
 */
export const deleteEventAndFiles = async (eventId) => {
  clearPublicEventsCache();

  // 1. Fetch event poster and payment details
  const { data: event } = await supabase
    .from('events')
    .select('poster_url, payment_details')
    .eq('id', eventId)
    .single();

  // 2. Fetch all payment proof URLs from orders for this event
  const { data: orders } = await supabase
    .from('orders')
    .select('payment_proof_url')
    .eq('event_id', eventId);

  // 3. Delete files from storage buckets
  if (event) {
    if (event.poster_url) {
      await deleteStorageFileByUrl(event.poster_url, 'event-posters');
    }
    const qrisUrl = event.payment_details?.qris_url || event.payment_details?.qris_image;
    if (qrisUrl) {
      await deleteStorageFileByUrl(qrisUrl, 'qris-codes');
    }
  }

  if (orders && orders.length > 0) {
    for (const order of orders) {
      if (order.payment_proof_url) {
        await deleteStorageFileByUrl(order.payment_proof_url, 'payment-proofs');
      }
    }
  }

  // 4. Clean up DB records
  await supabase.from('staff_accounts').delete().eq('event_id', eventId);
  await supabase.from('orders').delete().eq('event_id', eventId);
  await supabase.from('ticket_categories').delete().eq('event_id', eventId);
  const { error } = await supabase.from('events').delete().eq('id', eventId);

  if (error) throw new Error(`Gagal menghapus event: ${error.message}`);
  return true;
};


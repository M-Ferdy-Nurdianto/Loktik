import { supabase } from './supabase';

/**
 * Automatically purge events & related orders/tickets older than 14 days (2 weeks).
 */
export const purgeExpiredEvents = async () => {
  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data: expiredEvents } = await supabase
      .from('events')
      .select('id')
      .lt('event_date', fourteenDaysAgo);

    if (expiredEvents && expiredEvents.length > 0) {
      const expiredIds = expiredEvents.map((e) => e.id);
      await supabase.from('orders').delete().in('event_id', expiredIds);
      await supabase.from('ticket_categories').delete().in('event_id', expiredIds);
      await supabase.from('events').delete().in('id', expiredIds);
    }
  } catch (err) {
    // Non-blocking cleanup warning
    console.warn('Auto purge expired events notice:', err?.message);
  }
};

/**
 * Fetch active events for landing page catalog (public for all visitors).
 */
export const getActiveEvents = async () => {
  // Fire background cleanup for expired events > 14 days
  purgeExpiredEvents();

  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('events')
    .select('id, slug, name, description, poster_url, event_date, open_gate, status, payment_details, ticket_categories(price)')
    .eq('status', 'active')
    .gte('event_date', fourteenDaysAgo)
    .order('event_date', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
};

/**
 * Fetch events for EO dashboard, isolated by EO username.
 */
export const getAllEventsForEo = async (eoUsername = null) => {
  let query = supabase
    .from('events')
    .select('id, eo_id, created_by, slug, name, description, poster_url, event_date, open_gate, payment_details, status, created_at')
    .order('created_at', { ascending: false });

  if (eoUsername && eoUsername.toLowerCase() !== 'broferadm') {
    query = query.eq('created_by', eoUsername);
  } else if (!eoUsername) {
    return [];
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
};

/**
 * Fetch event detail & custom ticket tiers by slug (public for buyers).
 */
export const getEventBySlug = async (slug) => {
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, eo_id, created_by, slug, name, description, poster_url, event_date, open_gate, payment_details, status')
    .eq('slug', slug)
    .single();

  if (eventError) throw new Error('Acara tidak ditemukan atau URL salah.');

  const { data: tiers, error: tiersError } = await supabase
    .from('ticket_categories')
    .select('id, name, price, quota, description, start_po, end_po')
    .eq('event_id', event.id)
    .order('price', { ascending: true });

  if (tiersError) throw new Error(tiersError.message);

  return { ...event, ticket_categories: tiers };
};

/**
 * Upload WebP Poster Image to 'event-posters' bucket in Supabase Storage.
 */
export const uploadEventPoster = async (compressedWebPFile) => {
  const fileName = `poster_${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
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
  const fileName = `qris_${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
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

import { useState, useEffect } from 'react';
import { getActiveEvents, getEventBySlug } from '../services/apiEvents';

/**
 * Custom hook to fetch all active events.
 */
export const useActiveEvents = () => {
  // Read initial data instantly from local cache if available
  const getCachedEvents = () => {
    try {
      const cached = localStorage.getItem('loktik_cached_events');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  };

  const initialCache = getCachedEvents();
  const [events, setEvents] = useState(initialCache);
  const [loading, setLoading] = useState(initialCache.length === 0);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchEvents = async () => {
      try {
        if (initialCache.length === 0) setLoading(true);
        const data = await getActiveEvents();
        if (isMounted) {
          setEvents(data || []);
          try {
            localStorage.setItem('loktik_cached_events', JSON.stringify(data || []));
          } catch (e) {}
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Gagal memuat daftar acara.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchEvents();
    return () => { isMounted = false; };
  }, []);

  return { events, loading, error };
};

/**
 * Custom hook to fetch a single event by slug.
 */
export const useEventDetail = (slug) => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const data = await getEventBySlug(slug);
        if (isMounted) setEvent(data);
      } catch (err) {
        if (isMounted) setError(err.message || 'Gagal memuat detail acara.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetail();
    return () => { isMounted = false; };
  }, [slug]);

  return { event, loading, error };
};

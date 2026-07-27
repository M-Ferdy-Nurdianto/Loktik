import { useState, useEffect } from 'react';
import { getActiveEvents, getEventBySlug } from '../services/apiEvents';

/**
 * Custom hook to fetch all active events.
 */
export const useActiveEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await getActiveEvents();
        if (isMounted) setEvents(data || []);
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

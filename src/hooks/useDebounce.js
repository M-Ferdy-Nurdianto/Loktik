import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useDebounce — mengembalikan nilai yang ter-debounce.
 *
 * @param {any}    value  - nilai yang ingin di-debounce
 * @param {number} delay  - delay dalam ms (default 400)
 * @returns {any}         - nilai debounced
 */
export const useDebounce = (value, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * useDebouncedSearch — hook lengkap untuk fitur search yang hit API.
 *
 * Menangani:
 *   - debounce 400 ms
 *   - AbortController (batalkan request sebelumnya)
 *   - skip jika input kosong atau < minLength karakter
 *   - skip jika keyword tidak berubah dari request terakhir
 *   - hanya satu request aktif pada satu waktu
 *
 * @param {Function} fetchFn      - async (query, signal) => data
 * @param {Object}   [options]
 * @param {number}   [options.delay=400]     - debounce delay ms
 * @param {number}   [options.minLength=2]   - min karakter sebelum request
 * @param {boolean}  [options.enabled=true]  - bisa dipakai untuk disable sementara
 *
 * @returns {{
 *   inputValue: string,
 *   setInputValue: Function,
 *   data: any,
 *   loading: boolean,
 *   error: string|null,
 *   clear: Function,
 * }}
 */
export const useDebouncedSearch = (fetchFn, options = {}) => {
  const { delay = 400, minLength = 2, enabled = true } = options;

  const [inputValue, setInputValue] = useState('');
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  const debouncedQuery  = useDebounce(inputValue.trim(), delay);
  const abortRef        = useRef(null);   // AbortController aktif
  const lastQueryRef    = useRef('');     // keyword request terakhir

  useEffect(() => {
    const query = debouncedQuery;

    // Skip: disabled
    if (!enabled) return;

    // Skip: kosong → reset data
    if (!query) {
      setData(null);
      setError(null);
      setLoading(false);
      lastQueryRef.current = '';
      return;
    }

    // Skip: kurang dari minLength karakter
    if (query.length < minLength) return;

    // Skip: keyword tidak berubah dari request terakhir
    if (query === lastQueryRef.current) return;

    // Batalkan request sebelumnya
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;
    lastQueryRef.current = query;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchFn(query, controller.signal);
        // Jangan update state jika request sudah dibatalkan
        if (!controller.signal.aborted) {
          setData(result);
        }
      } catch (err) {
        if (err.name === 'AbortError' || controller.signal.aborted) return;
        setError(err.message || 'Terjadi kesalahan pencarian.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      controller.abort();
    };
  }, [debouncedQuery, enabled, fetchFn, minLength]);

  // Cleanup saat unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const clear = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    lastQueryRef.current = '';
    setInputValue('');
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { inputValue, setInputValue, data, loading, error, clear };
};

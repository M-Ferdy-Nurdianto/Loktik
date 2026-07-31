/**
 * VERCEL CRON KEEP-ALIVE SERVERLESS FUNCTION: /api/cron-keep-alive
 * 
 * Vercel Cron Job ini berjalan otomatis setiap 12 jam.
 * Berfungsi mengirimkan ping HTTP ke Supabase DB 1 & Supabase DB 2 agar 
 * kedua database Supabase TIDAK PERNAH mati / paused meskipun tidak ada pesanan.
 */

export default async function handler(req, res) {
  try {
    const db1Url = process.env.VITE_SUPABASE_URL || 'https://wptfkymsjrtrwyamsrhi.supabase.co';
    const db1Key = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwdGZreW1zanJ0cnd5YW1zcmhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwODM4ODksImV4cCI6MjEwMDY1OTg4OX0.M2H0mmzZ8V2JhCKL55o1BSIE7Y_ZPG0xzJZz1EEm61I';

    const db2Url = process.env.VITE_SUPABASE_ARCHIVE_URL || 'https://uvajdscwcojcvgbqvpig.supabase.co';
    const db2Key = process.env.VITE_SUPABASE_ARCHIVE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2YWpkc2N3Y29qY3ZnYnF2cGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0OTg4MDYsImV4cCI6MjEwMTA3NDgwNn0.YSGXdusLwS2ZmfkqHLEGpAaveIl-3D9_RtKV-t8pwjw';

    // 1. Ping DB 1 REST API
    const resDb1 = await fetch(`${db1Url}/rest/v1/system_keep_alive?select=id`, {
      headers: {
        apikey: db1Key,
        Authorization: `Bearer ${db1Key}`,
      },
    });
    const dataDb1 = await resDb1.json();

    // 2. Ping DB 2 REST API
    const resDb2 = await fetch(`${db2Url}/rest/v1/system_keep_alive?select=id`, {
      headers: {
        apikey: db2Key,
        Authorization: `Bearer ${db2Key}`,
      },
    });
    const dataDb2 = await resDb2.json();

    return res.status(200).json({
      success: true,
      message: 'Supabase DB 1 & DB 2 Keep-Alive Heartbeat berhasil!',
      timestamp: new Date().toISOString(),
      db1: dataDb1,
      db2: dataDb2,
    });
  } catch (err) {
    console.error('Keep-alive ping error:', err.message);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}

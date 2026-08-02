# LokTik

## Ringkasan Proyek

LokTik adalah platform **ticketing** berbasis web yang memungkinkan Event Organizer (EO) membuat, mengelola, dan mendistribusikan tiket digital melalui WhatsApp. Aplikasi terdiri dari frontend Vite + React serta backend Node.js yang menghubungkan ke **Supabase** untuk penyimpanan data dan **WhatsApp Cloud API (WA Fonte)** untuk pengiriman tiket.

## Fitur Utama
- Pencarian & cek e‑tiket oleh pembeli.
- Pengiriman otomatis tiket (gambar lengkap + QR) via WhatsApp.
- Dashboard EO dengan manajemen event & tiket.
- Integrasi Supabase untuk penyimpanan terpusat.
- Bot WhatsApp yang dapat dijalankan secara lokal (wa‑js) atau di‑deployment (WA Fonte).

## Instalasi (Pengembangan Lokal)
```bash
# Clone repository
git clone https://github.com/M-Ferdy-Nurdianto/Loktik.git
cd Loktik

# Install dependencies
npm install

# Instalasi Jimp (untuk generator gambar tiket)
npm install jimp

# Buat file .env (contoh)
cp .env.example .env
# Sesuaikan variabel sesuai kebutuhan (Supabase lokal, token WA, dsb.)

# Jalankan server backend (WhatsApp bot) dan frontend dev
npm run dev   # Vite dev server (http://localhost:3000)
node server/wa-bot.js   # Bot WA lokal
```

## Deployment
1. **Frontend** – Deploy ke Vercel (atau platform static hosting) dengan build `npm run build`.
2. **Bot WhatsApp** – Deploy ke layanan yang mendukung webhook (mis. Railway, Render) dan gunakan **WA Fonte** (WhatsApp Cloud API). Pastikan variabel lingkungan berikut diset:
   - `WA_API_TOKEN`
   - `WA_PHONE_ID`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. **Supabase** – Buat proyek Supabase di https://supabase.com, impor skema yang ada di `supabase/migrations`.

## Catatan Penggunaan
- Repository ini **hanya untuk penggunaan internal** oleh tim pengembang LokTik. 
- Dilarang meng‑kloning, mempublikasikan, atau meng‑klaim sebagai portofolio pribadi atau komersial tanpa persetujuan tertulis dari pemilik hak cipta.
- Semua kontribusi harus melalui pull request yang disetujui oleh pemilik repository.

## Hak Cipta & Lisensi
```
© 2024‑2026 Ferdy Nurdianto. Semua hak dilindungi.

Lisensi: **All Rights Reserved**

Penggunaan, distribusi, atau modifikasi kode tanpa izin tertulis dari pemilik hak cipta dilarang keras.
```

---

*Dokumen ini disusun dalam Bahasa Indonesia sesuai kebijakan proyek.*

# LokTik

**Platform Tiket Digital & POS Venue — Direct Ke Panitia Event**

LokTik adalah platform ticketing berbasis web yang memungkinkan Event Organizer (EO) membuat event, menjual tiket digital (presale + OTS), memverifikasi pembayaran, mengirim e-tiket otomatis via WhatsApp, dan melakukan scan/check-in tiket di gate venue. Seluruh dana pembayaran langsung masuk rekening panitia (tanpa potongan platform) dan tiket dikirim lewat WhatsApp dengan gambar grafis + QR code unik.

---

## Daftar Isi

- [Ringkasan Proyek](#ringkasan-proyek)
- [Tech Stack](#tech-stack)
- [Fitur Utama](#fitur-utama)
- [Arsitektur & Struktur Folder](#arsitektur--struktur-folder)
- [Fungsi Setiap File](#fungsi-setiap-file)
- [Instalasi (Pengembangan Lokal)](#instalasi-pengembangan-lokal)
- [Skrip NPM](#skrip-npm)
- [Variabel Lingkungan](#variabel-lingkungan)
- [Deployment](#deployment)
- [Catatan Penggunaan](#catatan-penggunaan)
- [Hak Cipta & Lisensi](#hak-cipta--lisensi)

---

## Ringkasan Proyek

Arsitektur aplikasi terdiri dari **tiga lapisan** utama:

| Lapisan | Teknologi | Peran |
|---------|-----------|-------|
| **Frontend** | Vite + React + Tailwind CSS | Halaman publik, dashboard EO, admin, dan portal gate |
| **Backend / Bot WA** | Node.js, Express, `whatsapp-web.js`, Jimp | Server bot WhatsApp (lokal/Render) untuk kirim tiket |
| **Database** | Supabase (PostgreSQL) — 2 proyek | Penyimpanan data transaksi (DB 1) + arsip laporan (DB 2) |

Alur inti: Pembeli beli tiket di website → upload bukti transfer → EO *approve* di dashboard → e-tiket (gambar grafis + QR) dikirim otomatis via WhatsApp → pembeli scan QR di gate → staf validate & *burn* tiket (sekali pakai).

> **Catatan Arsitektur DB:** Supabase **DB 1** menyimpan data operasional (events, orders, tickets, dll). Supabase **DB 2** hanya menyimpan arsip laporan event (`event_reports`). Ada kebijakan **retensi otomatis**: data mentah dihapus dari DB 1 setelah H+7 dan dipindahkan sementara ke DB 2 (H+3), lalu laporan di DB 2 dibersihkan setelah 60 hari.

---

## Tech Stack

**Frontend**
- Vite 6, React 18, React Router DOM 7
- Tailwind CSS 3, PostCSS, Autoprefixer
- `lucide-react` (ikon)
- QR: `react-qr-code`, `@zxing/browser`, `@zxing/library`, `html5-qrcode`, `jsqr`
- Gambar: `html2canvas`

**Backend**
- Node.js + Express 4, CORS
- `whatsapp-web.js` + `qrcode-terminal` (bot WA lokal)
- `jimp` (generator gambar tiket PNG server-side)

**Database & Integrasi**
- `@supabase/supabase-js`
- Supabase Storage (buckets: `event-posters`, `qris-codes`, `payment-proofs`, `tickets`)

**Lainnya**
- ESLint, Docker, Render (deploy bot), Vercel (deploy frontend + cron keep-alive)

---

## Fitur Utama

- **Pembelian tiket** — checkout dengan kategori presale (PO) dan upload bukti transfer (dikompresi ke WebP client-side).
- **Pengiriman tiket otomatis** — gambar grafis e-tiket + QR code unik per unit tiket dikirim via WhatsApp (bot `whatsapp-web.js` lokal atau serverless Fonnte).
- **Dashboard EO** — kelola event (buat/edit/aktif/nonaktif/hapus), tier tiket, pesanan (approve/reject/resend/bulk), akun staf, dan kuota bot WA.
- **Admin platform** — kelola semua akun EO, top-up kuota WA, ubah paket, dan **factory reset** database dengan backup/audit log.
- **Portal Gate / POS Venue** — scanner QR kamera + manual, guest list check-in, dan kasir OTS (penjualan di venue, tunai/QRIS).
- **Cek & lookup tiket** — pembeli bisa cari tiketnya via modal, ubah nomor WA, dan unduh e-tiket grafis.
- **Retensi data otomatis** — purging event & arsip laporan sesuai umur (H+3 arsip, H+7 hard purge, 60 hari format DB 2).
- **Kuota bot WA** — setiap EO punya kuota pesan; dikurangi atomik setiap sukses kirim (RPC di database).
- **Keep-alive** — cron Vercel + interval server menjaga Supabase tidak *paused*.

---

## Arsitektur & Struktur Folder

```
loktik/
├── api/                          # Serverless function Vercel
│   ├── cron-keep-alive.js        # Cron ping Supabase DB 1 & DB 2
│   └── send-wa.js                # Kirim tiket WA via gateway (Fonnte)
├── public/                       # Aset statis (favicon, logo, robots, sitemap, manifest)
├── scratch/                      # Skrip audit/debug sekali pakai (dilibatkan git)
├── server/                       # Backend bot WhatsApp (di-Render / Docker)
│   ├── wa-bot.cjs                # Bot WA (CommonJS, auto-detect Chrome/Edge) — PRODUCTION
│   ├── wa-bot.js                 # Bot WA alternatif (ES/CommonJS, fetch image manual)
│   └── generateTicketImage.js    # Generator gambar tiket PNG via Jimp
├── src/                          # Seluruh source frontend
│   ├── App.jsx                   # Routing utama
│   ├── main.jsx                  # Entry point React
│   ├── index.css                 # Gaya global + Tailwind
│   ├── assets/                   # Logo & ikon
│   ├── components/               # Komponen UI reusable
│   │   ├── ui/                   # Button, Card, Input, Badge, dll
│   │   ├── layout/               # Navbar & Footer
│   │   ├── public/               # Modal lookup tiket
│   │   ├── eo/                   # Pricing EO
│   │   ├── dashboard/            # Tab & komponen dashboard EO
│   │   ├── landing/              # Section halaman beranda
│   │   └── admin/                # Panel factory reset admin
│   ├── pages/                    # Halaman berdasarkan role
│   │   ├── public/               # Beranda, detail event, checkout, dll
│   │   ├── eo/                   # Login & dashboard EO
│   │   ├── admin/                # Dashboard admin
│   │   └── gate/                 # Portal gate / POS venue
│   ├── hooks/                    # Custom React hooks
│   ├── utils/                    # Formatter, kompresi gambar, limit paket, mode WA
│   ├── context/                  # Toast notification context
│   └── services/                 # Lapisan akses data ke Supabase
├── supabase/                     # Migrasi SQL
│   └── migrations/               # Migrasi kolom & fungsi
├── wa-session/                   # Sesi WhatsApp-web.js (tidak di-commit)
├── dist/                         # Hasil build Vite
├── node_modules/                 # Dependensi
├── START_LOKTIK.bat              # Launcher dev Windows (bot + web + buka browser)
├── START_LOKTIK_MOBILE.bat       # Launcher dev + HTTPS tunnel Cloudflare untuk HP
├── supabase-schema.sql           # Skema penuh: tabel, fungsi, RLS
├── Dockerfile                    # Build image bot WA (node + chromium)
├── render.yaml                   # Konfigurasi deploy bot di Render (Docker)
├── vercel.json                   # Cron, header security, rewrites Vercel
├── vite.config.js                # Konfigurasi Vite (port 3000, chunks, SSL opsional)
├── tailwind.config.js            # Konfigurasi Tailwind (tema & font)
├── postcss.config.js             # Konfigurasi PostCSS
├── package.json                  # Dependensi & skrip
└── .env.example                  # Contoh variabel lingkungan
```

---

## Fungsi Setiap File

### Root & Konfigurasi

| File | Fungsi |
|------|--------|
| `index.html` | HTML entry: load font Google, meta SEO (OG/Twitter), root `#root`, dan script `main.jsx`. |
| `package.json` | Daftar dependensi & skrip (`dev`, `build`, `bot`, `tunnel`, `lint`, `preview`). |
| `vite.config.js` | Atur dev server (port 3000, open browser, allowed hosts), SSL opsional (`VITE_HTTPS`), dan `manualChunks` untuk memecah bundle (vendor/supabase/icons). |
| `tailwind.config.js` | Tema warna brand (green `#39FF14`, purple, blue, dll), font (Montserrat, Bebas Neue), dan shadow *brutalist*. |
| `postcss.config.js` | Konfigurasi plugin PostCSS: Tailwind + Autoprefixer. |
| `Dockerfile` | Image `node:18-slim` + Chromium untuk `whatsapp-web.js`; jalankan `server/wa-bot.cjs` di port 5000. |
| `render.yaml` | Deploy service Docker bot WA di Render (region Singapore, free plan). |
| `vercel.json` | Config Vercel: cron harian (`/api/cron-keep-alive`), header keamanan (HSTS, X-Frame, dsb.), caching aset, dan rewrite SPA. |
| `supabase-schema.sql` | Skema database lengkap: tabel (events, ticket_categories, orders, tickets, eo_profiles), index, fungsi atomik (scan, quota, top-up/deduct WA, entitlement, validate action, update paket), dan kebijakan RLS. |
| `.env.example` | Template variabel `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`. |
| `.gitignore` | Mengecualikan `node_modules`, `dist`, `.env*`, `wa-session`, `.wwebjs_cache`, `scratch`, dll. |
| `START_LOKTIK.bat` | Launcher Windows 1-klik: jalankan bot (`npm run bot`), web dev (`npm run dev`), lalu buka `localhost:3000`. |
| `START_LOKTIK_MOBILE.bat` | Sama seperti di atas + menjalankan Cloudflare HTTPS tunnel (`npm run tunnel`) agar bisa dibuka di HP dengan akses kamera. |

### `api/` — Serverless Function Vercel

| File | Fungsi |
|------|--------|
| `cron-keep-alive.js` | Cron otomatis (via `vercel.json`) setiap 12 jam; ping REST API ke Supabase DB 1 & DB 2 agar tidak mati/paused. |
| `send-wa.js` | Endpoint POST untuk kirim tiket WA tanpa server background: sanitasi input, bangun pesan, dan kirim via gateway **Fonnte** jika `FONNTE_TOKEN` tersedia. |

### `server/` — Backend WhatsApp Bot

| File | Fungsi |
|------|--------|
| `wa-bot.cjs` | **Bot produksi (CommonJS)**. Inisialisasi `Client` `whatsapp-web.js` dengan `LocalAuth`, auto-detect Chrome/Edge/Brave di Windows. Endpoint `POST /api/send-ticket-wa` mengirim gambar tiket + teks; `GET /api/status` cek koneksi; heartbeat ke Supabase tiap 6 jam. Reconnect otomatis saat `disconnected`. |
| `wa-bot.js` | Bot alternatif dengan helper `fetchImageAsMedia` (unduh gambar manual dengan follow redirect + timeout) sebelum kirim via WA. |
| `generateTicketImage.js` | Menggunakan **Jimp** untuk membuat gambar tiket PNG 600×780 (header LOKTIK, nama event, nama pembeli, total, status LUNAS, QR, kode tiket) dan mengembalikan base64. |

### `src/` — Entry & Routing

| File | Fungsi |
|------|--------|
| `main.jsx` | Entry point React: render `<App />` dalam `React.StrictMode` ke `#root`. |
| `App.jsx` | Membungkus aplikasi dengan `ToastProvider` & `BrowserRouter`; mendefinisikan seluruh route; lazy-load halaman berat dengan `Suspense`. |
| `index.css` | Gaya global, import Tailwind, dan utility custom. |

### `src/services/` — Lapisan Akses Data (Supabase)

| File | Fungsi |
|------|--------|
| `supabase.js` | Membuat dua client Supabase: `supabase` (DB 1) dan `supabaseArchive` (DB 2), dengan fallback ke default hardcoded jika env belum diset. |
| `apiEvents.js` | CRUD event & kategori tiket: ambil event aktif/katalog, detail per slug, create/update/delete event + tier, upload poster & QRIS ke Storage, ambil tiket presale/OTS, cache in-memory (15s TTL), dan **purge/retensi otomatis** event kadaluarsa (arsip ke DB 2, hapus file). |
| `apiOrders.js` | Manajemen order: upload bukti transfer, buat order + deduksi kuota atomik + buat unit tiket, lookup tiket pembeli, update nomor WA, ambil order per EO (isolasi), dan update status order (approve/reject). Disertai cache 15s. |
| `apiTickets.js` | Gate/tiket: `checkTicketValidity` (RPC `check_ticket_validity`) dan `redeemTicket` (RPC `redeem_ticket_atomic`) untuk validate & *burn* tiket. |
| `apiEo.js` | **Source of truth** akun EO: CRUD `eo_accounts`, autentikasi, update status, toggle akses bot, top-up/reset kuota WA, update paket, dan deduct kuota atomik. |
| `apiStaff.js` | Manajemen akun staf gate: ambil daftar staf per EO, create/update/delete account, dan autentikasi staf (username/PIN 4-digit/password + fallback PIN gate event). |
| `apiEntitlements.js` | Batasan hak akses EO via RPC: ambil entitlement, validasi aksi (`CREATE_EVENT`, `ADD_STAFF`, `SEND_WA`, dll), dan update paket. |
| `apiAdmin.js` | Tools admin & **factory reset**: hitung/kosongkan bucket Storage secara rekursif (dengan backoff retry), kosongkan tabel dalam batch, dry-run, backup/export JSON, eksekusi reset (Quick/Factory), audit log lokal, dan top-up kuota. |

### `src/hooks/` — Custom React Hooks

| File | Fungsi |
|------|--------|
| `useAuth.js` | Autentikasi terpusat semua role (admin hardcoded, staff, EO). Login berurutan, simpan session, logout, dan refresh user. |
| `useCart.js` | State keranjang tiket: update kuantitas (maks 10/tier & kuota), reset, dan hitung total + item terpilih. |
| `useEvents.js` | Ambil daftar event aktif (dengan cache localStorage) dan detail event per slug. |
| `useDebounce.js` | Hook debounce nilai, plus `useDebouncedSearch` untuk pencarian yang hit API (400ms delay, `AbortController`, min length). |

### `src/utils/` — Helper

| File | Fungsi |
|------|--------|
| `formatters.js` | Format Rupiah, tanggal, waktu, generate kode redeem cantik (inisial event + 4 digit), format unit code tiket, dan normalisasi metode bayar. |
| `imageCompress.js` | Kompresi gambar ke WebP client-side (maks 10MB, whitelist MIME, maks width 1000, kualitas 0.75) untuk bukti transfer. |
| `planLimits.js` | Batas paket langganan (max event & staf per tier: test/event_pass/1/3/6 bulan) + label paket. |
| `resolveWhatsAppMode.js` | Menentukan mode pengiriman WA (`quota` jika ada kuota bota, selain itu `manual`) berdasarkan user. |

### `src/context/`

| File | Fungsi |
|------|--------|
| `ToastContext.jsx` | Provider notifikasi toast global dengan auto-detect role (user/EO/staf) dan tema warna per role. |

### `src/components/ui/` — Komponen UI Reusable

| File | Fungsi |
|------|--------|
| `Button.jsx` | Tombol aksi dengan varian warna, ukuran, dan `fullWidth`. |
| `Input.jsx` | Input teks dengan label, error, helpText, dan toggle kata sandi. |
| `Card.jsx` | Kontainer kartu dengan berbagai varian gaya & hover. |
| `Badge.jsx` | Label/tag kecil berwarna untuk menandai status. |
| `CustomSelect.jsx` | Dropdown select custom dengan popover & centang pilihan. |
| `BottomSheet.jsx` | Modal sebagai bottom sheet (mobile) / dialog terpusat (desktop), dengan backdrop & kunci scroll. |

### `src/components/layout/`

| File | Fungsi |
|------|--------|
| `Navbar.jsx` | Navigasi atas (logo, EVENT, ABOUT, LOGIN) + memuat modal lookup tiket; disembunyikan di dashboard. |
| `Footer.jsx` | Footer publik (brand, Syarat & Ketentuan, Info EO); disembunyikan di dashboard. |

### `src/components/public/`

| File | Fungsi |
|------|--------|
| `TicketLookupModal.jsx` | Modal cek e-tiket pembeli: cari berdasarkan kode, tampilkan status tiap unit, ubah nomor WA, unduh e-tiket grafis, dan lazy-migrasi tiket lama. |

### `src/components/eo/`

| File | Fungsi |
|------|--------|
| `ForEoPricing.jsx` | Tampilkan skema pricing paket EO (Event Pass, 1/3/6 bulan) + add-on Bot WA, dengan detail dan tombol order via WA. |

### `src/components/dashboard/`

| File | Fungsi |
|------|--------|
| `OverviewStats.jsx` | Kartu statistik ringkasan (event, pesanan, pending, dana) + kartu kuota bot WA dengan progress bar. |
| `CreateEventTab.jsx` | Form isi info event, upload poster, rekening/QRIS, PIN gate, dan kelola tier tiket (presale + OTS) dengan validasi kuota paket. |
| `EditEventModal.jsx` | Modal edit event, tier, metode bayar, poster/QRIS, dan PIN gate. |
| `MyEventsTab.jsx` | Daftar event milik EO dengan aksi aktivasi/nonaktif, edit, dan hapus (termasuk file-nya). |
| `OrderManagerTab.jsx` | Kelola pesanan: approve/reject/resend/bulk, generate gambar e-tiket, kirim via WA bot/manual, dan export rekap. |
| `StaffManagerTab.jsx` | Kelola akun staf (tambah, salin login, aktif/suspend, hapus) dengan batasan per paket. |
| `StaffFormModal.jsx` | Form buat akun staf (username, password, event tugas). |
| `EoGuideTab.jsx` | Panduan penggunaan dashboard & aturan retensi data H+7. |
| `TicketGraphic.jsx` | Grafik e-tiket (off-screen) yang dirender `html2canvas` menjadi gambar untuk download/kirim. |

### `src/components/landing/`

| File | Fungsi |
|------|--------|
| `HeroSection.jsx` | Hero beranda (headline + CTA + keunggulan). |
| `StatsSection.jsx` | Bar statistik (0% potongan, dana penuh ke panitia). |
| `HowItWorksSection.jsx` | Penjelasan alur 3 langkah (buat event, sebar link, scan QR). |
| `FeaturesSection.jsx` | Grid 6 kartu fitur unggulan. |
| `ComparisonSection.jsx` | Perbandingan LokTik vs platform biasa. |
| `FaqSection.jsx` | FAQ tanya-jawab. |
| `CtaSection.jsx` | Call-to-action buat event tanpa potongan. |
| `TermsSection.jsx` | Ringkasan syarat & ketentuan. |
| `AdBannerSection.jsx` | Banner promo pembuatan website custom (ferdy.web.id). |

### `src/components/admin/`

| File | Fungsi |
|------|--------|
| `FactoryResetView.jsx` | Panel kontrol factory reset DB (mode, dry run, backup, eksekusi, laporan). |
| `FactoryResetLeftCol.jsx` | Kolom kiri: pilih mode Quick/Factory, preview dry run, export backup. |
| `FactoryResetRightCol.jsx` | Kolom kanan: konfirmasi frasa, delay safety, riwayat audit, tombol eksekusi. |
| `FactoryResetProgressView.jsx` | Progres 9 tahap reset + laporan akhir & unduh audit. |
| `FactoryResetConfirmModal.jsx` | Modal verifikasi akhir sebelum reset. |

### `src/pages/public/`

| File | Fungsi |
|------|--------|
| `LandingPage.jsx` | Beranda publik: daftar event aktif, pencarian (debounce), harga, marquee, dan tombol "Cek Tiket Saya". |
| `EventDetail.jsx` | Detail event per slug, pilih tiket ke keranjang, hitung total, dan share link. |
| `Checkout.jsx` | Form pembeli, pilih metode bayar (bank/QRIS), upload bukti (WebP), lalu buat order. |
| `ForEO.jsx` | Landing promosi untuk EO (keunggulan, alur 4 langkah, FAQ, pricing). |
| `Terms.jsx` | Halaman statis Syarat & Ketentuan. |

### `src/pages/eo/`

| File | Fungsi |
|------|--------|
| `EOLogin.jsx` | Login unified (Admin/EO/Staf Gate) via username+password atau PIN 4 digit; redirect sesuai role. |
| `EODashboard.jsx` | Dashboard EO dengan sidebar tab (my-events, create-event, orders, staff, guide) + statistik. |

### `src/pages/admin/`

| File | Fungsi |
|------|--------|
| `AdminDashboard.jsx` | Dashboard admin: kelola akun EO (buat/status/hapus/reset/top-up kuota), ubah paket, dan factory reset. |

### `src/pages/gate/`

| File | Fungsi |
|------|--------|
| `GatePortal.jsx` | Portal gate per event: verifikasi PIN/login staf, lalu tab Scanner, GuestList, OtsCashier, StaffGuide. |
| `GatePinLock.jsx` | Layar kunci PIN gate (default 1312 dari DB) atau login staf untuk akses portal. |
| `Scanner.jsx` | Scan QR kamera (jsQR), upload gambar, atau input manual; validate & *redeem* tiket; hitung kehadiran. |
| `GuestList.jsx` | Daftar tamu terverifikasi: cari (debounce), lihat status, dan manual check-in. |
| `OtsCashier.jsx` | Kasir OTS venue: pilih kategori, hitung total, metode bayar (CASH/QRIS), lalu buat order di venue. |
| `StaffGuide.jsx` | Panduan statis staf gate (arti status scan, input manual, alur kasir). |

### `supabase/`

| File | Fungsi |
|------|--------|
| `migrations/202608050230_add_orders_payment_method.sql` | Migrasi: tambah kolom `payment_method` pada tabel `orders` + backfill nilai (Transfer Bank / QRIS / CASH) dari data OTS. |

### `public/` & `src/assets/`

Aset statis: `favicon.*`, `apple-touch-icon.png`, `android-chrome-*.png`, `logo.png`, `site.webmanifest`, `robots.txt`, `sitemap.xml`, dan ikon SVG.

---

## Instalasi (Pengembangan Lokal)

**Prasyarat:** Node.js 18+, akun Supabase, dan (untuk bot lokal) Chrome/Edge terpasang.

```bash
# 1. Clone repository
git clone https://github.com/M-Ferdy-Nurdianto/Loktik.git
cd Loktik

# 2. Install dependencies (termasuk Jimp untuk generator gambar tiket)
npm install

# 3. Siapkan file .env dari template
cp .env.example .env
# Isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY sesuai proyek Supabase Anda

# 4. (Opsional) Setup database — jalankan skema & migrasi di Supabase SQL Editor
#    Import isi supabase-schema.sql lalu tambahkan file di supabase/migrations/

# 5. Jalankan server backend bot WhatsApp (terminal 1)
npm run bot            # http://localhost:5000

# 6. Jalankan frontend dev (terminal 2)
npm run dev            # http://localhost:3000 (auto-open browser)
```

> **Pilih file bot dengan benar:** `npm run bot` menjalankan `server/wa-bot.cjs` (produksi di Render). Untuk pengembangan lokal di Windows, bot ini otomatis mendeteksi Chrome/Edge. Saat pertama kali, scan QR di terminal untuk menghubungkan akun WhatsApp numerik.

**Mode mobile (HP) dengan HTTPS:** jalankan `START_LOKTIK_MOBILE.bat` lalu buka tunnel Cloudflare yang muncul di terminal untuk mengakses kamera scanner.

---

## Skrip NPM

| Skrip | Perintah | Penjelasan |
|-------|----------|------------|
| `dev` | `npx vite --host 0.0.0.0` | Dev server frontend (port 3000, bisa diakses dari HP di jaringan lokal). |
| `dev:https` | `set VITE_HTTPS=true && npx vite --host 0.0.0.0` | Dev server dengan HTTPS via plugin basic-ssl. |
| `build` | `npx vite build` | Build produksi ke folder `dist/`. |
| `bot` | `node server/wa-bot.cjs` | Jalankan bot WhatsApp (produksi). |
| `tunnel` | `npx cloudflared tunnel --url http://localhost:3000` | Buat HTTPS tunnel Cloudflare untuk akses HP. |
| `lint` | `eslint .` | Lint seluruh kode. |
| `preview` | `npx vite preview` | Pratinjau hasil build. |

---

## Variabel Lingkungan

| Variabel | Keterangan |
|----------|------------|
| `VITE_SUPABASE_URL` | URL Supabase DB 1 (data operasional). |
| `VITE_SUPABASE_ANON_KEY` | Anon key Supabase DB 1. |
| `VITE_SUPABASE_ARCHIVE_URL` | URL Supabase DB 2 (arsip laporan). |
| `VITE_SUPABASE_ARCHIVE_ANON_KEY` | Anon key Supabase DB 2. |
| `WA_BOT_PORT` | Port server bot WA (default `5000`). |
| `PUPPETEER_EXECUTABLE_PATH` | Path Chromium/Chrome untuk `whatsapp-web.js` (jika tidak auto-detect). |
| `FONNTE_TOKEN` | Token gateway Fonnte (opsional; jika diset, `api/send-wa.js` kirim via Fonnte). |
| `VITE_HTTPS` | Jika `true`, aktifkan SSL pada dev server. |

> Kredensial dari proyek Supabase juga tersedia di Dashboard → Project Settings → API.

---

## Deployment

1. **Frontend (Vercel)**
   - Build: `npm run build` (output `dist/`).
   - Set variabel env `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, dan var arsip di **Environment Variables** Vercel.
   - `vercel.json` otomatis mengatur cron keep-alive harian, header keamanan, caching aset, dan rewrite SPA.

2. **Bot WhatsApp (Render/Docker)**
   - Gunakan `Dockerfile` + `render.yaml` (region Singapore).
   - Set `PORT=5000`. Bot dipakai lewat endpoint `POST /api/send-ticket-wa`.
   - Atau jalankan `server/wa-bot.cjs` di VPS/PC.

3. **Supabase**
   - Buat 2 proyek (DB 1 produksi + DB 2 arsip) di https://supabase.com.
   - Impor `supabase-schema.sql` (tabel, fungsi atomik, RLS) di SQL Editor.
   - Jalankan file migrasi di `supabase/migrations/` untuk penambahan kolom.
   - Buat bucket Storage: `event-posters`, `qris-codes`, `payment-proofs`, `tickets`.

4. **Serverless WA gateway (opsional)**
   - Deploy `api/send-wa.js` di Vercel. Set `FONNTE_TOKEN` untuk menyalurkan pesan via Fonnte tanpa server background.

---

## Catatan Penggunaan

- Repository ini **hanya untuk penggunaan internal** oleh tim pengembang LokTik.
- Dilarang meng-clone, mempublikasikan, atau meng-klaim sebagai portofolio pribadi atau komersial tanpa persetujuan tertulis dari pemilik hak cipta.
- Semua kontribusi harus melalui pull request yang disetujui oleh pemilik repository.

---

## Hak Cipta & Lisensi

```
© 2024‑2026 Ferdy Nurdianto. Semua hak dilindungi.

Lisensi: **All Rights Reserved**

Penggunaan, distribusi, atau modifikasi kode tanpa izin tertulis dari pemilik hak cipta dilarang keras.
```

---

*Dokumen ini disusun dalam Bahasa Indonesia sesuai kebijakan proyek.*
# 🎫 LOKTIK (`loktik.web.id`) - Event Ticketing Direct Platform

**LokTik** adalah platform ticketing independen & manajemen event *direct-to-organizer* untuk konser musik, bazar UMKM, seminar, dan acara komunitas.

---

## ⚡ Quick Start 1-Click Launcher (Windows)
- **`START_LOKTIK.bat`**: Launcher standar untuk uji coba di Laptop/PC (Vite + WA Bot Server + Auto Browser `http://localhost:3000`).
- **`START_LOKTIK_MOBILE.bat`**: Launcher khusus testing di **HP / Perangkat Seluler** dengan **HTTPS Cloudflare Tunnel** otomatis. Mengaktifkan izin kamera HP 100% aman untuk fitur POS Gate QR Scanner tanpa kendala error SSL.

---

## 🚀 Panduan Manual Dev Server
```bash
# 1. Install Dependencies
npm install

# 2. Menjalankan Web Frontend (Port 3000)
npm run dev

# 3. Menjalankan WhatsApp Bot Automation Server (Port 5000)
npm run bot
```

---

## 📱 Akses Mobile (HP Venue Gate & Kasir)
Website dikonfigurasi untuk dibuka di perangkat seluler HP panitia:
- **Lokal WiFi:** `http://<IP_LAPTOP_ANDA>:3000`
- **Public Tunneling:**
  ```bash
  npm run tunnel
  ```

---

## 🛠️ Arsitektur & Spesifikasi Fitur Utama

### 1. 🔒 Multi-Tenant EO Data Isolation
- Setiap event, pesanan tiket, dan statistik dasbor **terisolasi secara ketat per akun EO/Panitia** yang sedang login (`created_by`).
- Halaman publik (`/` dan `/event/:slug`) tetap menampilkan seluruh event aktif publik untuk calon pembeli.

### 2. 🔑 Kode Redeem Cantik 4-Digit (Contoh: `RB1029`)
- Format kode tiket unik menggunakan **2 Huruf Inisial Event + 4 Angka Cantik** (misal: *Rock Bandung* -> **`RB1029`**).
- Memudahkan penukaran gelang di venue via kamera QR atau input manual 6 karakter.

### 3. 🤖 WhatsApp Bot Automation (`whatsapp-web.js`)
- **Server:** Express backend (`server/wa-bot.cjs`) di port 5000.
- **Mode Dual:** Otomatis via Bot & fallback instan tombol **WA MANUAL** ke `wa.me`.

### 4. 🎟️ Dual Ticketing (Online PO + Kasir OTS Venue)
- **Pre-Order (PO) Online:** Pembeli upload bukti bayar -> Panitia verifikasi -> Tiket terkirim via WA.
- **Kasir OTS Venue:** Fast-issue tiket fisik gelang tunai/QRIS di venue, menyajikan rekap total pendapatan & metode bayar realtime.

### 5. 🎨 Custom Streetwear UI (Non-Native Dropdown & Sleek Scrollbar)
- Desain *Streetwear Dark Editorial* (`bg-[#0a0a0a]`, neon green `#39FF14`, electric purple `#8B5CF6`).
- Dropdown selector & scrollbar custom (tanpa widget native browser yang kaku).

---

## 🗄️ Database Schema (Supabase PostgreSQL)
- **`events`**: `id`, `created_by`, `eo_id`, `slug`, `name`, `description`, `poster_url`, `event_date`, `open_gate`, `payment_details`, `status`, `created_at`
- **`ticket_categories`**: `id`, `event_id`, `name`, `price`, `quota`, `description`, `start_po`, `end_po`
- **`orders`**: `id`, `event_id`, `guest_name`, `guest_wa`, `guest_ig`, `total_price`, `payment_proof_url`, `status`, `created_at`
- **`tickets`**: `id`, `order_id`, `ticket_category_id`, `barcode_uuid`, `is_scanned`, `scanned_at`, `scanned_by`

---

## 📄 Dokumentasi AI & Prompt Efficiency Guidelines
- **[`agent.md`](file:///d:/Githab/loktik/agent.md)**: Panduan konteks AI, instruksi hemat token, dan standar arsitektur.
- **[`design.md`](file:///d:/Githab/loktik/design.md)**: Panduan sistem desain streetwear & token warna.
- **[`.agents/AGENTS.md`](file:///d:/Githab/loktik/.agents/AGENTS.md)**: Aturan pengerjaan AI agent.

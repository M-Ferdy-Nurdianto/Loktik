# LOKTIK - SYSTEM INSTRUCTIONS & PROJECT CONTEXT

## 1. Project Overview & Architecture
**Name:** LokTik (`loktik.web.id`)  
**Description:** SaaS ticketing & venue management platform for local independent events, gigs, and community event organizers.  
**Tech Stack:** React 18, Vite 6, Tailwind CSS v3, Supabase (PostgreSQL DB, Auth, Storage, Edge RPC), WhatsApp-Web.js (Port 5000).  
**1-Click Launcher:** `START_LOKTIK.bat` (runs Vite on 3000 + Bot on 5000).

---

## 2. AI Assistant Token-Efficiency & Speed Guidelines (MANDATORY)
To ensure optimal performance, low latency, and minimal token consumption in future AI conversations:
1. **Targeted Reading:** Always inspect specific files or line ranges using `view_file` (StartLine/EndLine) instead of reading full 800-line files.
2. **Concise Responses:** Keep explanations brief, punchy, and direct in Indonesian. Use markdown summaries.
3. **Strict Code Size Limit:** Keep all React component files under **220 lines of code** by decoupling sub-views into `src/components/dashboard/`.
4. **Authoritative Context First:** Check `agent.md`, `README.md`, and `design.md` before querying database schemas or making architectural assumptions.

---

## 3. Core Features & Business Logic
- **Multi-Tenant EO Data Isolation:** EO dashboard stats (`OverviewStats.jsx`), events (`MyEventsTab.jsx`), and orders (`OrderManagerTab.jsx`) are strictly filtered by `created_by` username. Public pages (`/` & `/event/:slug`) display all active events globally.
- **Cantik 4-Digit Redeem Codes (`RB1029`):** Generated using `generatePrettyRedeemCode(eventName, seed)` in `src/utils/formatters.js` (e.g. 2 event initials + 4 digits: `RB1029`).
- **WhatsApp Automation Mode:** Express server (`server/wa-bot.cjs`) sends tickets automatically via `whatsapp-web.js` when approved. Fallback to `wa.me` Click-to-Chat URL button.
- **Venue Gate Scanner:** WebRTC camera scanner (`ScannerTab.jsx`) scanning barcode UUIDs or 6-character cantik codes (`RB1029`) with 1-click wristband issuance (`is_scanned = true`).
- **Kasir OTS Venue:** Fast-issue cash/QRIS ticket sales (`OtsCashierTab.jsx`) with live rekap metrics panel.

---

## 4. Design System (Streetwear Dark Editorial)
- **Backgrounds:** `#0a0a0a` (App background), `#121212` (Card surface), `#181818` (Inputs/Triggers).
- **Primary Accents:**
  - `brand-green`: `#39FF14` (Acid Neon Green - Primary CTAs, active status, paid badges)
  - `brand-purple`: `#8B5CF6` (Electric Purple - EO badges, QRIS section)
  - `brand-blue`: `#06B6D4` (Cyan Blue - WA links, PO section)
  - `brand-yellow`: `#FFE600` (OTS Cashier, highlights)
  - `brand-red`: `#FF3333` (Alerts, reject buttons)
- **Non-Native Custom Controls:**
  - Custom React Dropdown Selector with dark `#121212` popup & neon hover states.
  - Hidden native scrollbars (`no-scrollbar`) with smooth touch & wheel scrolling.

---

## 5. Database Schema Reference (Supabase)
```sql
events (id UUID, created_by VARCHAR, eo_id UUID, slug VARCHAR, name VARCHAR, description TEXT, poster_url TEXT, event_date TIMESTAMPTZ, open_gate TIMESTAMPTZ, payment_details JSONB, status VARCHAR, created_at TIMESTAMPTZ)

ticket_categories (id UUID, event_id UUID, name VARCHAR, price NUMERIC, quota INT, description TEXT, start_po TIMESTAMPTZ, end_po TIMESTAMPTZ)

orders (id UUID, event_id UUID, guest_name VARCHAR, guest_wa VARCHAR, guest_ig VARCHAR, total_price NUMERIC, payment_proof_url TEXT, status VARCHAR, created_at TIMESTAMPTZ)

tickets (id UUID, order_id UUID, ticket_category_id UUID, barcode_uuid TEXT, is_scanned BOOLEAN, scanned_at TIMESTAMPTZ, scanned_by VARCHAR)
```

---

## 6. E-Ticket Graphic Design — LOCKED (DO NOT MODIFY)

> ⚠️ **STRICTLY FROZEN** — Jangan ubah desain, layout, field, warna, atau urutan elemen tiket grafis ini tanpa instruksi eksplisit dari owner. Ini adalah referensi visual final yang sudah disetujui.

**File:** `src/components/dashboard/TicketGraphic.jsx`

### Visual Layout (top → bottom):

```
┌─────────────────────────────────┐
│  [Logo LokTik]  LOKTIK          │
│                 OFFICIAL E-TICKET│
├─────────────────────────────────┤
│         [NAMA EVENT]            │  ← text-brand-blue, font-black uppercase
│           KATEGORI              │  ← text-brand-yellow, tracking-widest
│       TIKET X DARI Y            │  ← text-neutral-500, uppercase (ticketLabel)
├─────────────────────────────────┤
│                                 │
│       [QR CODE IMAGE]           │  ← PNG dari api.qrserver.com, 240x240
│                                 │
├─────────────────────────────────┤
│ GUEST NAME          [NAMA]      │  ← label kiri, value kanan bold
│ TICKET UID         [8EDEDA9]    │  ← text-brand-purple, font-mono uppercase
│ KATEGORI           [DAY 1]      │  ← text-brand-yellow
│                   Order ID: L09749 │  ← sub-line text-neutral-500
│ VERIFICATION  [ LUNAS (VERIFIED) ]│ ← text-brand-green jika paid
├─────────────────────────────────┤
│ Tunjukkan QR Code ini kepada    │
│ staf gate di lokasi acara.      │
│ Satu kode berlaku untuk satu    │
│ unit tiket sesuai kategori.     │
└─────────────────────────────────┘
```

### Field Mapping (props → tampilan):

| Field Visual       | Prop / Source                                      |
|--------------------|----------------------------------------------------|
| Nama Event         | `eventName` (text-brand-blue)                      |
| Kategori (header)  | `categoryName` (text-brand-yellow, di bawah nama)  |
| Ticket Label       | `ticketLabel` — mis. "TIKET 1 DARI 5" atau "TANDA MASUK VENUE" |
| QR Code            | PNG dari `https://api.qrserver.com/...&data={ticketCode}` |
| GUEST NAME         | `guestName`                                        |
| TICKET UID         | `ticketCode` (barcode UUID 7 karakter, text-brand-purple) |
| KATEGORI row       | `categoryName` (text-brand-yellow) + sub-line `orderLookupCode` |
| VERIFICATION       | `isPaid` → `[ LUNAS (VERIFIED) ]` (brand-green) atau `[ PENDING ]` (brand-red) |

### Rules:
1. **QR Code data** = `barcode_uuid` tiket individual (bukan order ID) → setiap tiket punya QR unik.
2. **ticketLabel** = "TIKET {n} DARI {total}" jika order > 1 tiket same category. "TANDA MASUK VENUE" jika tiket tunggal/universal.
3. **categoryName** selalu ditampilkan — jangan dihapus, jangan diganti generic "Tiket Regular" kecuali memang tidak ada data kategori.
4. **orderLookupCode** muncul sebagai sub-line kecil di bawah nama kategori (mis. "Order ID: L09749").
5. **Background** selalu `#0a0a0a`, border `border-neutral-900`, font Montserrat.
6. **Footer text** berbeda berdasarkan jenis tiket:
   - Tiket berkategori (Day 1/Day 2 dll): *"Satu kode berlaku untuk satu unit tiket sesuai kategori yang tertera."*
   - Tiket universal (no category): *"Satu tiket hanya berlaku untuk satu kali penukaran."*
7. Komponen ini di-render off-screen (`top-[-9999px]`), di-capture `html2canvas`, lalu di-upload ke Supabase Storage bucket `tickets` sebagai PNG.

### WhatsApp Delivery Rules (LOCKED):

| Kasus                          | Gambar Attachment    | Link di Teks                   |
|-------------------------------|----------------------|--------------------------------|
| 1 tiket (any category)        | 1 gambar grafis tiket | Link E-Tiket (1 link)         |
| N tiket, **same category**    | 1 gambar grafis tiket | Link E-Tiket (1 link), keterangan "QR bisa di-scan Nx" |
| N tiket, **mixed category**   | ❌ Tidak ada attachment | LINK SEMUA TIKET ANDA (1 link per tiket) |

> Mixed category ditentukan dari `buildTicketDispatchPayload().isMixed` = `categories.size > 1`.
> Field `ticketLinks` di payload bot **hanya diisi jika `isMixed === true`**.

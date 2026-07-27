# LOKTIK - DESIGN SYSTEM & STYLING GUIDE (EDITORIAL STREETWEAR)

Dokumen ini adalah *source of truth* estetika **Clean Minimalist Streetwear (Editorial Zine)** di **LokTik**.

---

## 1. Aesthetic Concept: Editorial Streetwear
Inspirasi dari zine musik indie, tiket konser fisik, dan visual streetwear drop.
- **Backgrounds:** Deep Rich Black (`#0a0a0a`), Dark Surface Cards (`#121212`), Dark Triggers (`#181818`).
- **Borders:** Thin subtle borders (`border-neutral-800` / `border border-brand-green/40`).
- **Accent Color Palette:**
  - `brand-green`: `#39FF14` (Acid Neon Green - Primary CTAs, status aktif, lunas)
  - `brand-purple`: `#8B5CF6` (Electric Purple - Akun EO, QRIS, presale tags)
  - `brand-blue`: `#06B6D4` (Cyan Blue - WA links, PO online)
  - `brand-yellow`: `#FFE600` (OTS Cashier, highlights)
  - `brand-red`: `#FF3333` (Alerts, reject buttons)

---

## 2. Component Guidelines

### A. Custom Streetwear Dropdown (Non-Native)
- Dilarang menggunakan `<select><option>` native browser yang menampilkan pop-up biru kaku.
- Gunakan React state `isDropdownOpen` dengan container `#181818`, border `#39FF14`, dan pop-up menu `#121212` yang memiliki efek hover neon halus.

### B. Custom Scrollbars (`.no-scrollbar`)
- Hilangkan slider scrollbar putih native pada kontainer riwayat dan tabel dengan CSS class `.no-scrollbar`.
- Pastikan kontainer tetap 100% dapat di-scroll dengan mouse wheel, trackpad, dan touch swipe.
- Untuk scrollbar global halaman utama, gunakan style dark sleek charcoal (`#262626`) dengan hover neon green (`#39FF14`).

---

## 3. Typography & Layout Rules
- **Header:** Oversized uppercase editorial headers (`font-black uppercase tracking-tight`).
- **Badges:** Streetwear tag badges (`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-sm`).
- **Monospace Accents:** Gunakan font mono untuk ID pesanan, nomor WhatsApp, timestamp, dan Kode Redeem Cantik (`RB1029`).
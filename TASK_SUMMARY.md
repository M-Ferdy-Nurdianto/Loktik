# REKAP TASK & UPDATE LOKTIK (SABTU / 27 JULI 2026)

Dokumen ini mencatat seluruh fitur, perubahan arsitektur, dan perbaikan tampilan yang telah diselesaikan pada sesi pengembangan LokTik.

---

## 🚀 FITUR & PERUBAHAN UTAMA

### 1. Refaktor Rute & Akses Gate Portal (Venue Separation)
- **Pemisahan dari Dashboard EO**: Komponen Gate Scanner & Kasir OTS dipindahkan dari `src/components/dashboard/` ke rute independen `src/pages/gate/`.
- **Akses Tanpa Kredensial Akun EO**: Tim pintu masuk & kasir OTS venue dapat mengakses gate via URL khusus event (`/gate/slug-event`) yang dilindungi oleh **Event PIN (1029)** tanpa membocorkan password/data finansial EO.

### 2. Fitur Export Rekap Penjualan (Excel & PDF)
- **Export Excel (`.csv`)**: Mendownload berkas CSV dengan format UTF-8 BOM yang rapi dibuka di MS Excel. Dilengkapi kolom `Tipe Pesanan` (`PO ONLINE` vs `OTS VENUE`).
- **Export PDF (Printable Report)**: Berkas laporan berdesain **Dark Slate Monokrom Elegan** (ramah cetak, tidak bikin sakit mata).
- **Pemisahan PO vs OTS**: Tabel PDF dipisah secara tegas menjadi:
  1. `Tabel 1: Pesanan Online (Pre-Order / PO)` (dengan rincian nama pembeli & WhatsApp).
  2. `Tabel 2: Penjualan Venue (OTS)` (dengan rincian metode `TUNAI / CASH` atau `QRIS VENUE`).
- **Kategori Tiket Akurat**: Membaca nama kategori asli (VIP, Presale 1, Regular, dll) dari relasi database `ticket_categories`.
- **Hapus Line Tanda Tangan**: Menghapus footer tanda tangan panitia agar lebih simpel.

### 3. Kebijakan Retensi Hapus Data 2 Minggu (14 Hari)
- **Logika Purge Otomatis**: Fungsi `purgeExpiredEvents()` di `apiEvents.js` otomatis memfilter & menghapus event, pesanan, dan tiket yang usianya sudah melewati 14 hari dari tanggal pelaksanaan event.
- **Notifikasi Clear pada UI**:
  - Halaman `/for-eo`: Menampilkan **Highlight Alert Box Kuning** tepat di atas seksi FAQ.
  - Dashboard EO (`MyEventsTab.jsx`): Menampilkan notifikasi retensi 14 hari di header.

### 4. Tampilan Katalog & Desain UI
- **Vertical List View Catalog**: Mengubah tampilan katalog event di `LandingPage.jsx` dari model grid/chart menjadi urutan list berderet ke bawah (`1.`, `2.`, `3.`).
- **Rasio Poster Instagram Feed (1:1 `aspect-square`)**: Gambar poster event menggunakan rasio persegi 1:1 agar foto feed Instagram tidak terpotong.
- **Pembersihan Pill Filter Kategori**: Menghapus tombol filter kategori (`ALL`, `KONSER`, dll) untuk tampilan katalog yang lebih bersih.
- **Iklan Portofolio & Sponsor**:
  - Banner 1: Slot Iklan Sponsor & Partner Event (Top Slot).
  - Banner 2: Jasa Pembuatan Website Custom oleh Ferdy Nurdianto (`https://ferdy.web.id`).
  - Posisi disusun secara vertikal (berderet ke bawah).

### 5. Integrasi Pemesanan WhatsApp Direct (0857-6590-7580)
- Tautan pemesanan platform & tombol paket berlangganan (`Paket 3 Bulan Rp250k` & `Paket 1 Tahun Promo Rp500k`) terhubung langsung ke WhatsApp **`085765907580`** (`https://wa.me/6285765907580`) dengan pesan otomatis.

### 6. Tone Bahasa & Copywriting
- Mengubah istilah kaku/AI ("PORTAL") menjadi istilah alami seperti **`DASHBOARD EO`**, **`POS GATE VENUE`**, dan **`GATE VENUE`**.
- Memparafase seluruh kalimat pada Landing Page, ForEO, FAQ, dan S&K menggunakan gaya **bahasa kasual, santai, & relatable ala komunitas gigs Jaksel**.

---

## 📌 SAVE POINT GITHUB
- **Commit Terakhir**: `a55f83f`
- **Pesan Commit**: `feat: enhance PDF/Excel recap report with ticket category names (VIP/Presale), clean OTS layout, and remove signature line`
- **Status Workspace**: Bersih, terkompilasi 100% tanpa error (`npm run build` PASS).

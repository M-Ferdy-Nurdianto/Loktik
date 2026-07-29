# REKAP TASK & SAVE POINT PROYEK LOKTIK (RABU / 29 JULI 2026)

Dokumen ini mencatat seluruh fitur, perubahan arsitektur, standar desain anti-AI slop, dan penataan berkas yang telah diselesaikan hingga **SAVE POINT** saat ini.

---

## 🚀 PERUBAHAN & ARSITEKTUR TERBARU

### 1. Mandat Ketat Anti-AI Slop & Zero Emoji (`.agents/AGENTS.md`)
- **Strict Zero Emojis**: Menghapus seluruh emoji dari kodingan, teks UI, banner, badge, hingga template WhatsApp. Terdaftar 0 emoji di seluruh repositori.
- **Bebas Gradasi Teks & Blur Spheres**: Menghapus efek gradasi warna rainbow pada teks (`bg-clip-text text-transparent`) dan pendaran blur background AI.
- **Tipografi Standar Google Fonts**: Mengganti Space Grotesk dengan font umum populer **Montserrat**, **Poppins**, dan **Bebas Neue**.
- **Istilah Umum & Netral**: Mengganti istilah gaul ("GIGS") menjadi istilah umum yang netral seperti **`EVENT LOKAL`**, **`KONSER & MUSIK`**, **`ACARA`**, **`SEMINAR & FESTIVAL`**.

---

### 2. Pembagian Hirarki Warna Berdasarkan Peran (Role-Based Color Hierarchy)
- **Halaman Pembeli / Publik (`/`, `/event/*`, `/checkout`)**:
  - **DOMINAN CYBER BLUE (`#06B6D4` / `brand-blue`)** pada logo branding, active nav link, tombol `BELI TIKET`, `LANJUT CHECKOUT`, dan tab pembayaran bank/QRIS.
- **Dashboard EO & Admin (`/eo/dashboard`, `/admin/dashboard`)**:
  - **DOMINAN NEON GREEN (`#39FF14` / `brand-green`)** pada menu navigasi sidebar, portal login panitia, persetujuan tiket, dan export data.
- **Staf Gate Scanning Venue (`/gate/*`)**:
  - **DOMINANT ELECTRIC PURPLE (`#8B5CF6` / `brand-purple`)** pada keypad PIN gate venue, pos pintu masuk, dan tombol validasi wristband.

---

### 3. Penataan Berkas Logo PNG & Favicon
- **Penataan Folder Standar Vite**:
  - `public/logo.png` & `public/logo - loktik.png`
  - `public/favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `site.webmanifest`
  - `src/assets/logo.png` & `src/assets/icons/`
- **Integrasi Logo PNG**:
  - Pemasangan logo PNG di **Navbar Header**, **Footer**, **Browser Tab**, dan **Kop Surat PDF Laporan Penjualan**.
  - Penambahan header branding resmi pada file **Export Excel / CSV**.

---

### 4. Tampilan Katalog & Rasio Poster 4:5 Vertikal
- **Bentuk Poster Uniform 4:5**: Seluruh poster event menggunakan rasio vertikal **4:5 (`aspect-[4/5]`)** agar pas dan tidak terpotong.
- **Pembersihan Seksi Carousel**: Seksi Spotlight Carousel horizontal telah dihapus sepenuhnya untuk fokus pada daftar katalog utama.

---

### 5. Fitur Akun Staf EO & Hak Akses Terpisah (New Feature)
- **Modul Layanan Staf (`src/services/apiStaff.js`)**:
  - Penyimpanan terisolasi per EO username (`loktik_staff_accounts`).
  - Mendukung pembuatan, pengeditan, penghapusan, dan autentikasi akun staf.
- **Manajemen Staf di EO Dashboard (`src/components/dashboard/StaffManagerTab.jsx` & `StaffFormModal.jsx`)**:
  - Menu **"Manajemen Staf"** di sidebar EO.
  - EO dapat menentukan perizinan granular untuk setiap staf:
    1. **1. SCANNER** (Gate Wristband / Redeem Code Scanning)
    2. **2. KASIR OTS** (Input Penjualan Tiket On-The-Spot)
    3. **3. LIHAT ORDER** (Guest List & Status Pesanan Tamu)
  - Fitur **Salin Info & Link Gate** untuk dikirimkan langsung ke staf via WhatsApp.
- **Portal Gate & Pembatasan Akses Staf (`src/pages/gate/GatePortal.jsx` & `GatePinLock.jsx`)**:
  - Pintu masuk Gate Portal menerima verifikasi PIN 4-digit atau Login Username & Password Staf.
  - Tab navigasi Gate Portal secara dinamis **menampilkan hanya fitur yang diizinkan** untuk akun staf yang sedang login.

---

## 📌 STATUS VERIFIKASI RUNTIME
- **Vite Production Build**: `npm run build` PASS (100% Lulus dalam 3.86 detik).
- **Zero Errors / Zero Warnings**: Bebas dari kesalahan kompilasi.
- **Strict Code Limits**: Seluruh komponen React berada di bawah batas 220 baris kode.
- **Memori Permanen Agen**: Seluruh aturan tersimpan rapi di [.agents/AGENTS.md](file:///d:/Githab/loktik/.agents/AGENTS.md).

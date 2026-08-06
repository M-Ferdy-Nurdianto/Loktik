import React from 'react';
import { HelpCircle, CheckCircle2, Ticket, Users, AlertTriangle } from 'lucide-react';

const GuideBlock = ({ title, icon, children }) => {
  return (
    <div className="border border-neutral-800 rounded-lg bg-[#121212] overflow-hidden p-4 sm:p-5">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 rounded-md bg-brand-green/20 text-brand-green">
          {icon}
        </div>
        <h3 className="font-black uppercase tracking-wide text-sm sm:text-base text-white">{title}</h3>
      </div>
      <div className="text-neutral-300 text-xs sm:text-sm leading-relaxed space-y-3 font-medium">
        {children}
      </div>
    </div>
  );
};

export const EoGuideTab = () => {
  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center space-x-3 border-b border-neutral-800 pb-4">
        <div className="p-2.5 bg-brand-green/10 border border-brand-green/30 rounded-lg">
          <HelpCircle className="w-5 h-5 text-brand-green" />
        </div>
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white">Panduan Pengguna</h2>
          <p className="text-xs text-neutral-400 font-mono mt-1">CARA PAKAI DASHBOARD LOKTIK</p>
        </div>
      </div>

      <div className="space-y-4">
        <GuideBlock
          title="Bikin Event Baru & Pembayaran"
          icon={<Ticket className="w-4 h-4" />}
        >
          <p>
            Buka menu <strong className="text-brand-green font-black uppercase">CREATE</strong>. Isi nama acara, deskripsi, dan unggah poster berukuran 4:5 (wajib vertikal biar rapi di katalog).
          </p>
          <p className="mt-2 text-brand-green font-bold uppercase text-[10px] tracking-widest">METODE PEMBAYARAN TIKET</p>
          <p>
            Untuk opsi pembayaran dari pembeli, kamu bebas memilih sesuai kebutuhan:
          </p>
          <ul className="list-disc ml-4 space-y-1">
            <li><strong>Hanya pakai QRIS:</strong> Kosongkan kolom Bank/No Rekening, dan langsung unggah gambar QRIS kamu.</li>
            <li><strong>Hanya pakai Bank Transfer:</strong> Isi nama Bank dan Nomor Rekening, lalu biarkan kolom unggah QRIS kosong.</li>
            <li><strong>Pakai Keduanya:</strong> Isi no rekening DAN unggah gambar QRIS agar pembeli lebih leluasa.</li>
          </ul>
          <p className="mt-2 text-brand-blue font-bold uppercase text-[10px] tracking-widest">TIKET & PUBLIKASI</p>
          <p>
            Jangan lupa isi kategori tiket (Tier), harga, dan batas tanggal PO (Pre-Order). Setelah selesai, klik <strong className="text-brand-green font-black uppercase">PUBLIKASIKAN EVENT SEKARANG</strong>. Event kamu langsung *live* di halaman utama LokTik saat itu juga!
          </p>
        </GuideBlock>

        <GuideBlock
          title="Kelola Pesanan & Status Bayar"
          icon={<CheckCircle2 className="w-4 h-4" />}
        >
          <p>
            Buka tab <strong className="text-brand-green font-black uppercase">ORDERS</strong> untuk ngeliat semua transaksi yang masuk. 
            Di sini kamu bisa filter tiket berdasarkan status bayarnya. Sistem cuma pakai 3 status resmi:
          </p>
          <ul className="space-y-2 mt-2 ml-1">
            <li className="flex items-start gap-2">
              <span className="shrink-0 mt-0.5"><span className="inline-flex items-center rounded-sm bg-brand-green px-1.5 py-0 text-[9px] font-black uppercase tracking-wider text-black">PAID</span></span>
              <span>Udah lunas &amp; di-approve. Tiket aktif dan siap didownload pembeli.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="shrink-0 mt-0.5"><span className="inline-flex items-center rounded-sm border border-neutral-500 px-1.5 py-0 text-[9px] font-black uppercase tracking-wider text-neutral-400">PENDING</span></span>
              <span>Pembeli belum transfer atau sistem lagi ngecek mutasi.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="shrink-0 mt-0.5"><span className="inline-flex items-center rounded-sm bg-brand-red px-1.5 py-0 text-[9px] font-black uppercase tracking-wider text-white">REUPLOAD</span></span>
              <span>Bukti transfer ditolak atau nggak valid, pembeli harus kirim ulang.</span>
            </li>
          </ul>
          <p className="pt-2 border-t border-neutral-800 mt-3">
            Klik <strong className="text-brand-green font-black uppercase">APPROVE</strong> setelah cek bukti transfer buat verifikasi & aktifin tiket —
            gak perlu kirim WA apa-apa dulu. Pembeli otomatis bisa cari &amp; download E-Tiket-nya sendiri di website
            pakai <strong className="text-white">Kode ID Pesanan</strong> yang mereka simpan pas checkout (tombol <strong className="text-brand-blue">"CEK TIKET SAYA"</strong> di halaman utama).
          </p>
          <p>
            Kirim WA ke pembeli sifatnya <strong className="text-white">opsional</strong> — tombol <strong className="text-brand-purple font-black uppercase">WA MANUAL</strong> bakal buka WhatsApp kamu dengan pesan &amp; gambar tiket siap kirim, kamu tinggal pencet Send manual dari HP/WA Web kamu sendiri. Selain WA, kamu juga bebas nyebarin info tiket lewat story/feed IG, grup Telegram, atau kanal lain — pembeli tetap bisa akses tiketnya kapan aja lewat kode pesanan tanpa gantung ke satu channel doang.
          </p>
        </GuideBlock>

        <GuideBlock
          title="Aturan Retensi Data (Penting!)"
          icon={<AlertTriangle className="w-4 h-4" />}
        >
          <p>
            Sistem bakal <span className="text-brand-red font-bold underline decoration-brand-red/50 underline-offset-2">otomatis hapus</span> semua data pesanan dan tiket 7 hari setelah event kamu selesai. 
            Ini buat ngejaga server tetap ringan.
          </p>
          <p>
            Biar aman buat laporan keuangan, biasakan langsung klik tombol EXPORT EXCEL atau EXPORT PDF di menu ORDERS setelah event beres, buat nyimpen rekap data pembeli ke laptop kamu.
          </p>
        </GuideBlock>

        <GuideBlock
          title="Akun Staf vs PIN 4-Digit Gate"
          icon={<Users className="w-4 h-4" />}
        >
          <p>
            Buat jaga pintu acara (scanning tiket masuk), sistem ini memakai dua lapis agar aman dan rapi. Bedanya:
          </p>
          <ul className="list-disc ml-4 mt-2 space-y-2">
            <li>
              <strong>1. Akun Staf Gate:</strong> Ini ibarat "KTP" milik si panitia penjaga pintu. Kamu buat akun ini di menu <strong className="text-brand-green font-black uppercase">STAFF GATE</strong>. Satu akun (username & password) ini dipakai si penjaga untuk masuk ke dalam web LokTik.
            </li>
            <li>
              <strong>2. PIN Gate Venue (4-Digit):</strong> Ini ibarat "Kunci Gembok" khusus untuk satu event tertentu saja. PIN ini kamu buat saat di form Create Event tadi. Tujuannya: Walaupun penjaga punya akun (KTP), mereka tetap harus minta Kunci (PIN 4-digit) ke kamu untuk bisa mengakses event tersebut dan mulai menyeken tiket.
            </li>
          </ul>
          <div className="bg-neutral-900/50 p-3 mt-3 border border-neutral-800 rounded">
            <span className="text-brand-green font-bold text-[10px] uppercase block mb-1">Alur Kerja Staf Lapangan:</span>
            Staf Buka Web ➔ Login pakai Akun Staf ➔ Pilih Event ➔ Masukkan PIN 4-Digit Event ➔ Mulai Scan Tiket!
          </div>
          <p className="mt-2">
            Jika staf udah selesai tugas shift-nya, ubah status akunnya jadi <strong className="text-brand-red">SUSPENDED</strong> di menu Staff Gate biar mereka nggak bisa login lagi dari HP mereka.
          </p>
        </GuideBlock>
      </div>
    </div>
  );
};

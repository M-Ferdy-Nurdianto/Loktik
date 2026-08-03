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
          title="Bikin Event Baru"
          icon={<Ticket className="w-4 h-4" />}
        >
          <p>
            Kalau kamu mau rilis event, pastikan siapkan poster dengan rasio 4:5 (wajib vertikal biar rapi di katalog). 
            Buka menu <strong className="text-brand-green font-black uppercase">CREATE</strong> di sidebar kiri. 
            Isi nama event, kategori tiket yang mau dijual, dan batas waktu pre-order (PO).
          </p>
          <p>
            Setelah selesai, klik tombol Simpan. Event kamu bakal langsung live di halaman utama LokTik dan siap terima pembeli saat itu juga.
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
              <span>Udah lunas. Tiket otomatis terkirim.</span>
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
          title="Mengatur Tim Staf Gate"
          icon={<Users className="w-4 h-4" />}
        >
          <p>
            Buka menu <strong className="text-brand-green font-black uppercase">STAFF GATE</strong> buat bikin akun khusus staf scanner di lapangan. 
            Masukin nama dan bikin password/PIN simpel buat mereka login.
          </p>
          <p>
            Status akun bakal otomatis ACTIVE. Kalau staf udah selesai tugas, shift-nya habis, atau ada masalah di lapangan, ganti statusnya jadi SUSPENDED biar mereka nggak bisa akses sistem scan lagi dari HP mereka.
          </p>
        </GuideBlock>
      </div>
    </div>
  );
};

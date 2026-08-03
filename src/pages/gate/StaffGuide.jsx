import React from 'react';
import { HelpCircle, ScanLine, Info, Ticket, Banknote } from 'lucide-react';

const GuideBlock = ({ title, icon, children }) => {
  return (
    <div className="border border-brand-purple/20 rounded-lg bg-neutral-950 overflow-hidden p-3 sm:p-4">
      <div className="flex items-center space-x-3 mb-3">
        <div className="p-1.5 sm:p-2 rounded-md bg-brand-purple/20 text-brand-purple">
          {icon}
        </div>
        <h4 className="font-black uppercase tracking-wide text-[11px] sm:text-xs text-white">{title}</h4>
      </div>
      <div className="text-neutral-300 text-[11px] sm:text-xs leading-relaxed space-y-2 font-medium">
        {children}
      </div>
    </div>
  );
};

export const StaffGuide = () => {
  return (
    <div className="mx-4 sm:mx-0 mt-3 bg-[#121212] p-4 rounded-xl border border-brand-purple/40 space-y-4 shadow-[0_0_30px_rgba(139,92,246,0.15)]">
      <div className="flex items-center space-x-2 border-b border-neutral-800 pb-3">
        <HelpCircle className="w-5 h-5 text-brand-purple shrink-0" />
        <h3 className="font-black text-white uppercase tracking-wider text-xs sm:text-sm">Panduan Staf Gate</h3>
      </div>
      
      <div className="space-y-3">
        <GuideBlock
          title="Arti Status Hasil Scan"
          icon={<Info className="w-4 h-4" />}
        >
          <p>Kalau kamu nge-scan QR code pengunjung atau masukin kode cantik secara manual, sistem bakal nampilin salah satu dari dua status ini:</p>
          <ul className="space-y-2 mt-2 ml-1">
            <li className="flex items-start gap-2">
              <span className="shrink-0 mt-0.5 text-brand-green font-black uppercase">ACTIVE:</span>
              <span>Tiket valid dan belum pernah dipakai. Kamu bisa langsung kasih gelang/tiket fisik ke pengunjung, lalu persilakan masuk.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="shrink-0 mt-0.5 text-brand-red font-black uppercase">SCANNED:</span>
              <span>Tiket ini sudah di-scan sebelumnya. Jangan kasih akses masuk, karena kemungkinan besar pengunjung pakai screenshot tiket orang lain atau nyoba masuk dua kali.</span>
            </li>
          </ul>
        </GuideBlock>

        <GuideBlock
          title="Input Kode Manual (Tercepat)"
          icon={<ScanLine className="w-4 h-4" />}
        >
          <p>
            Kalau hp pengunjung retak, layarnya gelap, atau kamera kamu error pas nyoba nge-scan, mending langsung ketik aja kode tiketnya (contoh: <span className="font-mono text-white">GM1972</span>) di kolom input lalu pencet Enter. 
            Ini cara paling cepat dan no-debat di lapangan.
          </p>
        </GuideBlock>

        <GuideBlock
          title="Progres Penukaran Tiket Group"
          icon={<Ticket className="w-4 h-4" />}
        >
          <p>
            Kalau ada satu rombongan beli tiket borongan pakai satu QR/kode, pas di-scan sistem bakal ngasih tahu tiket ke-berapa yang lagi di-scan (contoh: 1/3, 2/3, 3/3).
          </p>
          <p>
            Tiap kali muncul pop-up hijau, kasih 1 gelang. Terus lanjut suruh scan QR yang sama sampai jatahnya habis beres.
          </p>
        </GuideBlock>

        <GuideBlock
          title="Pengunjung Beli OTS"
          icon={<Banknote className="w-4 h-4" />}
        >
          <p>
            Kalau ada pengunjung yang baru mau beli tiket pas udah nyampe venue (On The Spot), kamu arahkan ke staf kasir atau buka tab <strong className="text-brand-purple">KASIR OTS</strong>.
          </p>
          <p>
            Tinggal pilih jenis tiket yang mau dibeli, terima uangnya (bisa Cash atau suruh scan QRIS), klik Checkout, dan sistem bakal langsung nyatet pembayarannya biar stok dan pendapatan otomatis akurat.
          </p>
        </GuideBlock>
      </div>
    </div>
  );
};

import React from 'react';
import { ShieldCheck, FileText, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const Terms = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-12 space-y-6 sm:space-y-8 text-left pb-12">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-4 space-y-2">
        <Badge variant="purple" className="text-[10px] px-2 py-0.5">DOKUMEN HUKUM PLATFORM</Badge>
        <h1 className="text-2xl sm:text-4xl font-black uppercase text-white tracking-tight">
          SYARAT &amp; KETENTUAN (S&amp;K) LOKTIK
        </h1>
        <p className="text-xs text-neutral-400 font-medium leading-relaxed">
          Ketentuan penggunaan sistem tiket online LokTik (`loktik.web.id`) bagi Pembeli &amp; Panitia Event.
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6 text-sm text-neutral-300">
        {/* Section 1 */}
        <Card variant="dark" className="p-4 sm:p-6 space-y-2.5 border-neutral-800">
          <div className="flex items-center space-x-2 text-brand-blue">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <h2 className="text-sm sm:text-base font-extrabold uppercase text-white">1. PERAN PLATFORM LOKTIK</h2>
          </div>
          <p className="text-xs text-neutral-400 font-medium leading-relaxed">
            LokTik adalah penyedia sistem &amp; infrastruktur perangkat lunak (*Software Direct Ticketing Platform*). LokTik <strong>TIDAK MENAHAN</strong> atau memotong uang tiket. Seluruh pembayaran ditransfer langsung dari Pembeli ke rekening / QRIS milik Panitia Event (EO).
          </p>
        </Card>

        {/* Section 2 */}
        <Card variant="dark" className="p-4 sm:p-6 space-y-2.5 border-neutral-800">
          <div className="flex items-center space-x-2 text-brand-purple">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <h2 className="text-sm sm:text-base font-extrabold uppercase text-white">2. TANGGUNG JAWAB EVENT &amp; REFUND</h2>
          </div>
          <ul className="text-xs text-neutral-400 font-medium space-y-2 list-disc pl-4 leading-relaxed">
            <li>Seluruh bentuk susunan acara, lokasi venue, jam open gate, bintang tamu, dan pelaksanaan acara merupakan tanggung jawab penuh <strong>Panitia Event (EO)</strong>.</li>
            <li>Segala bentuk permohonan pengembalian dana (*Refund*), pembatalan acara, atau penundaan jadwal acara menjadi tanggung jawab penuh Panitia Event (EO) terkait.</li>
          </ul>
        </Card>

        {/* Section 3 */}
        <Card variant="dark" className="p-4 sm:p-6 space-y-2.5 border-neutral-800">
          <div className="flex items-center space-x-2 text-brand-blue">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <h2 className="text-sm sm:text-base font-extrabold uppercase text-white">3. KETENTUAN TIKET &amp; TIKET FISIK VENUE</h2>
          </div>
          <ul className="text-xs text-neutral-400 font-medium space-y-2 list-disc pl-4 leading-relaxed">
            <li>Tiket yang telah berhasil diverifikasi oleh panitia akan menghasilkan kode verifikasi QR Code unik.</li>
            <li>Satu (1) QR Code tiket hanya berlaku untuk satu (1) kali pemindaian di pintu masuk venue (*Wristband Exchange*).</li>
            <li>Apabila tiket sudah dipindai (*is_scanned = true*), tiket otomatis hangus dan tidak dapat dipergunakan kembali.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

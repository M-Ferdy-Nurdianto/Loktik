import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { AlertTriangle, MessageSquare } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';

export const OverviewStats = ({ stats = {}, waStats = null }) => {
  const waQuota = waStats?.wa_quota ?? 0;
  const waMessagesSent = waStats?.wa_messages_sent ?? 0;
  const waTotalEver = waQuota + waMessagesSent;
  const waUsagePercent = waTotalEver > 0 ? Math.round((waMessagesSent / waTotalEver) * 100) : 0;
  const isQuotaDepleted = waQuota <= 0;
  const isQuotaLow = waQuota > 0 && waQuota <= 100;

  const items = [
    { label: 'TOTAL EVENT AKTIF', value: stats.totalEvents || '0 Event', highlight: 'text-brand-green' },
    { label: 'TOTAL PESANAN TIKET', value: stats.totalOrders || '0 Tiket', highlight: 'text-brand-purple' },
    { label: 'PENDING VERIFIKASI', value: stats.pendingOrders || '0 Pesanan', highlight: 'text-brand-yellow' },
    { label: 'TOTAL DANA DIRECT (EO)', value: formatRupiah(stats.totalRevenue || 0), highlight: 'text-brand-blue' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
        {items.map((stat, idx) => (
          <Card key={idx} variant="dark" className="p-5 border-neutral-800 space-y-1">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{stat.label}</p>
            <p className={`text-xl sm:text-2xl font-black ${stat.highlight}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {waStats !== null && (
        <div className="space-y-3">
          {isQuotaDepleted && (
            <Card
              variant="red"
              className="p-4 border border-brand-red/60 bg-brand-red/10 space-y-2 flex items-start space-x-3"
            >
              <div className="p-2 bg-brand-red/20 rounded-md border border-brand-red/50 shrink-0">
                <AlertTriangle className="w-5 h-5 text-brand-red" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center space-x-2">
                  <Badge variant="red" className="text-[9px] px-1.5 py-0 font-black">PERINGATAN KRITIS</Badge>
                </div>
                <h4 className="text-sm font-black uppercase text-white tracking-tight">
                  KUOTA BOT WA HABIS! SILAKAN TOP UP
                </h4>
                <p className="text-xs text-neutral-300 font-medium leading-relaxed">
                  Kuota pesan otomatis Bot WhatsApp Anda saat ini <strong className="text-brand-red underline">0 (NOL)</strong>. Segera hubungi Admin LokTik untuk melakukan Top Up Kuota agar fitur kirim tiket otomatis via WA kembali aktif.
                </p>
              </div>
            </Card>
          )}

          {isQuotaLow && !isQuotaDepleted && (
            <Card
              variant="yellow"
              className="p-4 border border-brand-yellow/60 bg-brand-yellow/10 space-y-2 flex items-start space-x-3"
            >
              <div className="p-2 bg-brand-yellow/20 rounded-md border border-brand-yellow/50 shrink-0">
                <AlertTriangle className="w-5 h-5 text-brand-yellow" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center space-x-2">
                  <Badge variant="yellow" className="text-[9px] px-1.5 py-0 font-black">PERINGATAN</Badge>
                </div>
                <h4 className="text-sm font-black uppercase text-white tracking-tight">
                  SISA KUOTA BOT WA SEDIKIT! (TINGGAL {waQuota.toLocaleString('id-ID')} PESAN)
                </h4>
                <p className="text-xs text-neutral-300 font-medium leading-relaxed">
                  Sisa kuota Bot WhatsApp Anda sudah hampir habis. Segera lakukan Top Up sebelum kuota benar-benar habis agar layanan tidak terganggu.
                </p>
              </div>
            </Card>
          )}

          <Card
            variant="dark"
            className={`p-5 border space-y-3 ${
              isQuotaDepleted
                ? 'border-brand-red/60 bg-gradient-to-br from-[#1a0a0a] to-[#121212]'
                : isQuotaLow
                ? 'border-brand-yellow/60 bg-gradient-to-br from-[#1a1a0a] to-[#121212]'
                : 'border-brand-blue/40 bg-gradient-to-br from-[#0c1920] to-[#121212] shadow-[0_0_15px_rgba(6,182,212,0.1)]'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center space-x-2">
                  <div className={`p-1.5 rounded-md border ${
                    isQuotaDepleted
                      ? 'bg-brand-red/20 border-brand-red/50'
                      : isQuotaLow
                      ? 'bg-brand-yellow/20 border-brand-yellow/50'
                      : 'bg-brand-blue/20 border-brand-blue/50'
                  }`}>
                    <MessageSquare className={`w-4 h-4 ${
                      isQuotaDepleted ? 'text-brand-red' : isQuotaLow ? 'text-brand-yellow' : 'text-brand-blue'
                    }`} />
                  </div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                    SISA KUOTA BOT WHATSAPP OTOMATIS
                  </p>
                </div>
                <div className="flex items-baseline space-x-2">
                  <p className={`text-3xl sm:text-4xl font-black font-mono ${
                    isQuotaDepleted
                      ? 'text-brand-red'
                      : isQuotaLow
                      ? 'text-brand-yellow'
                      : 'text-brand-blue'
                  }`}>
                    {waQuota.toLocaleString('id-ID')}
                  </p>
                  <span className="text-xs font-bold text-neutral-400 uppercase">PESAN</span>
                </div>
              </div>

              <div className="text-right space-y-2 shrink-0">
                <Badge
                  variant={isQuotaDepleted ? 'red' : isQuotaLow ? 'yellow' : 'blue'}
                  className="text-[9px] px-2 py-0.5 font-black"
                >
                  {isQuotaDepleted ? 'HABIS' : isQuotaLow ? 'LOW' : 'AKTIF'}
                </Badge>
                <div className="text-[10px] font-mono space-y-0.5 text-left">
                  <div className="flex justify-between gap-3">
                    <span className="text-neutral-500 font-bold uppercase">TERKIRIM:</span>
                    <span className="font-black text-brand-purple">
                      {waMessagesSent.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-neutral-500 font-bold uppercase">PEMAKAIAN:</span>
                    <span className={`font-black ${
                      waUsagePercent >= 100 ? 'text-brand-red' : waUsagePercent >= 80 ? 'text-brand-yellow' : 'text-brand-green'
                    }`}>
                      {waUsagePercent}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1 pt-2 border-t border-neutral-800/60">
              <div className="flex items-center justify-between text-[9px] font-mono">
                <span className="text-neutral-500 font-bold uppercase">PROGRESS PEMAKAIAN KUOTA</span>
                <span className="font-black text-neutral-400">
                  {waMessagesSent.toLocaleString('id-ID')} / {waTotalEver.toLocaleString('id-ID')} pesan
                </span>
              </div>
              <div className="w-full h-2.5 bg-neutral-800 rounded-md overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    waUsagePercent >= 100
                      ? 'bg-brand-red shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                      : waUsagePercent >= 80
                      ? 'bg-brand-yellow shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                      : 'bg-gradient-to-r from-brand-blue to-brand-green shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                  }`}
                  style={{ width: `${Math.min(waUsagePercent, 100)}%` }}
                />
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

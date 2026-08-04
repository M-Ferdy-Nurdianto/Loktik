import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { MessageSquare, Infinity } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';

export const OverviewStats = ({
  stats = {},
  waStats = null,
  hasBotAddon = false,
  waMode = 'manual',
  isLoadingBot = false,
}) => {
  const waMessagesSent = waStats?.wa_messages_sent ?? 0;
  const waQuota        = waStats?.wa_quota ?? 0;
  const waTotalEver    = waQuota + waMessagesSent;
  const isUnlimited    = waMode === 'bot';
  const isQuotaMode    = waMode === 'quota';

  const items = [
    { label: 'TOTAL EVENT AKTIF',      value: stats.totalEvents   || '0 Event',    highlight: 'text-brand-green'  },
    { label: 'TOTAL PESANAN TIKET',    value: stats.totalOrders   || '0 Tiket',    highlight: 'text-brand-purple' },
    { label: 'PENDING VERIFIKASI',     value: stats.pendingOrders || '0 Pesanan',  highlight: 'text-brand-yellow' },
    { label: 'TOTAL DANA DIRECT (EO)', value: formatRupiah(stats.totalRevenue || 0), highlight: 'text-brand-blue' },
  ];

  return (
    <div className="space-y-4">
      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
        {items.map((stat, idx) => (
          <Card key={idx} variant="dark" className="p-5 border-neutral-800 space-y-1">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{stat.label}</p>
            <p className={`text-xl sm:text-2xl font-black ${stat.highlight}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Bot WA Card — tampil HANYA setelah data live selesai (isLoadingBot=false) dan hasBotAddon true.
          Tidak tampil saat loading agar tidak menampilkan data stale dari session localStorage. */}
      {!isLoadingBot && hasBotAddon && (
        <Card
          variant="dark"
          className={`p-5 border ${
            isUnlimited
              ? 'border-brand-green/40 bg-gradient-to-br from-[#09160d] to-[#121212] shadow-[0_0_15px_rgba(57,255,20,0.08)]'
              : 'border-brand-blue/40 bg-gradient-to-br from-[#0c1920] to-[#121212] shadow-[0_0_15px_rgba(6,182,212,0.08)]'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            {/* Kiri: icon + label + counter */}
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-1.5 rounded-md border shrink-0 ${
                isUnlimited
                  ? 'bg-brand-green/20 border-brand-green/50'
                  : 'bg-brand-blue/20 border-brand-blue/50'
              }`}>
                <MessageSquare className={`w-4 h-4 ${isUnlimited ? 'text-brand-green' : 'text-brand-blue'}`} />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  KUOTA BOT WHATSAPP
                </p>

                {isUnlimited && (
                  <div className="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-2xl font-black font-mono text-brand-green">
                      {waMessagesSent.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase">PESAN TERKIRIM</span>
                  </div>
                )}

                {isQuotaMode && (
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-black font-mono text-brand-blue">
                      {waMessagesSent.toLocaleString('id-ID')}
                    </span>
                    <span className="text-sm font-bold text-neutral-500">/</span>
                    <span className="text-sm font-black font-mono text-neutral-300">
                      {waTotalEver.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase">pesan</span>
                  </div>
                )}
              </div>
            </div>

            {/* Kanan: badge + sisa */}
            <div className="text-right shrink-0 space-y-1">
              {isUnlimited ? (
                <>
                  <Badge variant="green" className="text-[9px] px-2 py-0.5 font-black">BOT UNLIMITED</Badge>
                  <div className="flex items-center justify-end gap-1 text-[10px] font-mono text-neutral-400">
                    <Infinity className="w-3 h-3 text-brand-green" />
                    <span className="font-black text-brand-green">Tanpa Batas</span>
                  </div>
                </>
              ) : (
                <>
                  <Badge variant="blue" className="text-[9px] px-2 py-0.5 font-black">BOT AKTIF</Badge>
                  <div className="text-[10px] font-mono text-neutral-400">
                    Sisa: <span className="font-black text-brand-blue">{waQuota.toLocaleString('id-ID')}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Progress bar — mode kuota */}
          {isQuotaMode && (
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-[9px] font-mono text-neutral-500 font-bold uppercase">
                <span>PEMAKAIAN KUOTA</span>
                <span className="text-neutral-400">
                  {waMessagesSent.toLocaleString('id-ID')} / {waTotalEver.toLocaleString('id-ID')} pesan
                </span>
              </div>
              <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-green shadow-[0_0_8px_rgba(6,182,212,0.4)] transition-all duration-500"
                  style={{
                    width: waTotalEver > 0
                      ? `${Math.min(Math.round((waMessagesSent / waTotalEver) * 100), 100)}%`
                      : '0%',
                  }}
                />
              </div>
            </div>
          )}

          {/* Progress bar — mode unlimited */}
          {isUnlimited && (
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-[9px] font-mono text-neutral-500 font-bold uppercase">
                <span>STATUS BOT</span>
                <span className="text-brand-green font-black">AKTIF PENUH</span>
              </div>
              <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-brand-green to-brand-green/60 shadow-[0_0_8px_rgba(57,255,20,0.3)]" />
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

import React from 'react';
import { Card } from '../ui/Card';
import { formatRupiah } from '../../utils/formatters';

export const OverviewStats = ({ stats = {} }) => {
  const items = [
    { label: 'TOTAL EVENT AKTIF', value: stats.totalEvents || '0 Event', highlight: 'text-brand-green' },
    { label: 'TOTAL PESANAN TIKET', value: stats.totalOrders || '0 Tiket', highlight: 'text-brand-purple' },
    { label: 'PENDING VERIFIKASI', value: stats.pendingOrders || '0 Pesanan', highlight: 'text-brand-yellow' },
    { label: 'TOTAL DANA DIRECT (EO)', value: formatRupiah(stats.totalRevenue || 0), highlight: 'text-brand-blue' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
      {items.map((stat, idx) => (
        <Card key={idx} variant="dark" className="p-5 border-neutral-800 space-y-1">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{stat.label}</p>
          <p className={`text-xl sm:text-2xl font-black ${stat.highlight}`}>{stat.value}</p>
        </Card>
      ))}
    </div>
  );
};

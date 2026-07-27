import React from 'react';

export const StatsSection = () => {
  const stats = [
    { value: 'Rp 0', label: 'POTONGAN PENJUALAN TIKET', highlight: 'text-brand-green' },
    { value: '100%', label: 'UANG TIKET LANGSUNG KE PANITIA', highlight: 'text-brand-purple' },
    { value: 'Simpel', label: 'BUAT EVENT DALAM 3 MENIT', highlight: 'text-brand-blue' },
    { value: 'QR Code', label: 'SCAN TIKET PAKE HP PANITIA', highlight: 'text-brand-yellow' },
  ];

  return (
    <section className="border-y border-neutral-800 bg-[#0d0d0d] py-8">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center divide-y lg:divide-y-0 lg:divide-x divide-neutral-800">
          {stats.map((stat, idx) => (
            <div key={idx} className="pt-3 lg:pt-0 space-y-1">
              <p className={`text-2xl sm:text-4xl font-black tracking-tight ${stat.highlight}`}>
                {stat.value}
              </p>
              <p className="text-[11px] font-extrabold text-neutral-400 uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

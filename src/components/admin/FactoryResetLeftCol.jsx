import React from 'react';
import { RefreshCcw, Download, ShieldAlert, Database, FileCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { RESET_MODES } from '../../services/apiAdmin';

export const FactoryResetLeftCol = ({
  resetMode,
  setResetMode,
  resetDryRun,
  isDryRunning,
  handleRefreshDryRun,
  handleBackupExport,
  isBackupExporting,
}) => {
  const summary = resetDryRun?.summary || {};
  const storageByBucket = resetDryRun?.storageByBucket || {};
  const totalStorageFiles = summary.storage || 0;
  const totalDbRows = (summary.orders || 0) + (summary.tickets || 0) + (summary.events || 0) + (summary.staff || 0);

  const workflowSteps = [
    { num: '1', title: 'Pilih Mode' },
    { num: '2', title: 'Dry Run Live' },
    { num: '3', title: 'Backup Data' },
    { num: '4', title: 'Safety Delay (3s)' },
    { num: '5', title: 'Safety Input' },
    { num: '6', title: 'Konfirmasi Final' },
  ];

  return (
    <div className="space-y-4 flex flex-col justify-between h-full">
      {/* Alert Warning & Mode Banner */}
      <div className="p-3.5 bg-brand-red/10 border border-brand-red/30 rounded-xl space-y-1">
        <div className="flex items-center gap-2 text-brand-red font-bold text-xs">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>PROSES RESET DAPAT MENGHAPUS DATA SECARA PERMANEN</span>
        </div>
        <p className="text-[11px] text-neutral-300 leading-relaxed">
          Mode saat ini: <span className="font-bold text-white uppercase">{resetMode === RESET_MODES.quick ? 'Quick Reset' : 'Factory Reset'}</span>.
          {resetMode === RESET_MODES.quick
            ? ' Hanya menghapus transaksi (Orders & Tickets) tanpa menyentuh Event, Staff, atau EO.'
            : ' Menghapus seluruh data operasional (Orders, Tickets, Events, Staff, & Storage File). Akun Master Admin & paket tetap utuh.'}
        </p>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setResetMode(RESET_MODES.quick)}
          className={`p-3 rounded-xl border text-left transition-all ${
            resetMode === RESET_MODES.quick
              ? 'bg-brand-blue/15 border-brand-blue text-white shadow-[0_0_15px_rgba(6,182,212,0.15)]'
              : 'bg-[#121212] border-neutral-800 text-neutral-400 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-brand-blue">Quick Reset</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-brand-blue/20 text-brand-blue">RINGAN</span>
          </div>
          <p className="text-[10px] mt-1 text-neutral-300 leading-snug">Hapus transaksi & tiket saja</p>
        </button>

        <button
          type="button"
          onClick={() => setResetMode(RESET_MODES.factory)}
          className={`p-3 rounded-xl border text-left transition-all ${
            resetMode === RESET_MODES.factory
              ? 'bg-brand-red/15 border-brand-red text-white shadow-[0_0_15px_rgba(239,68,68,0.15)]'
              : 'bg-[#121212] border-neutral-800 text-neutral-400 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-brand-red">Factory Reset</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-brand-red/20 text-brand-red">FULL</span>
          </div>
          <p className="text-[10px] mt-1 text-neutral-300 leading-snug">Hapus seluruh operasional</p>
        </button>
      </div>

      {/* Dry Run Preview Grid */}
      <div className="p-3.5 rounded-xl border border-neutral-800 bg-[#111111] space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-brand-green" />
              <span className="text-xs font-black uppercase text-neutral-200">Dry Run Preview</span>
            </div>
            <p className="text-[10px] text-neutral-400">Simulasi penghitungan live tanpa menghapus data</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleRefreshDryRun} disabled={isDryRunning} className="text-xs py-1 px-2.5">
            <RefreshCcw className={`w-3 h-3 mr-1 ${isDryRunning ? 'animate-spin' : ''}`} />
            {isDryRunning ? 'Mengecek...' : 'Refresh Dry Run'}
          </Button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            ['Orders', summary.orders ?? 0],
            ['Tickets', summary.tickets ?? 0],
            ['Events', summary.events ?? 0],
            ['Staff', summary.staff ?? 0],
            ['Payment Proof', summary.paymentProof ?? 0],
            ['Files Storage', totalStorageFiles],
          ].map(([label, value]) => (
            <div key={label} className="bg-[#0a0a0a] border border-neutral-800 rounded-lg p-2 text-center">
              <p className="text-[9px] font-bold uppercase text-neutral-500 truncate">{label}</p>
              <p className="text-base font-black font-mono mt-0.5 text-white">{String(value).toLocaleString('id-ID')}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-[#0a0a0a] border border-neutral-800">
            <p className="font-bold text-[10px] text-neutral-400 uppercase mb-1">Storage Per Bucket</p>
            <div className="space-y-1 text-[11px] text-neutral-300 font-mono">
              {Object.entries(storageByBucket).map(([bucket, count]) => (
                <div key={bucket} className="flex justify-between gap-2">
                  <span className="text-neutral-400 truncate">{bucket}</span>
                  <span className="font-bold text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-[#0a0a0a] border border-neutral-800 flex flex-col justify-between">
            <div>
              <p className="font-bold text-[10px] text-neutral-400 uppercase mb-1">Estimasi Total Dampak</p>
              <p className="text-[11px] text-neutral-300">Total Baris DB: <span className="font-bold font-mono text-white">{totalDbRows}</span></p>
              <p className="text-[11px] text-neutral-300">Total File Storage: <span className="font-bold font-mono text-white">{totalStorageFiles}</span></p>
            </div>
            <p className="text-[9px] text-brand-green font-mono mt-1">Status: Dry run siap dieksekusi</p>
          </div>
        </div>
      </div>

      {/* Backup Export & Step Flow Guide */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 rounded-xl border border-brand-green/30 bg-brand-green/10 flex flex-col justify-between space-y-2">
          <div>
            <div className="flex items-center gap-1.5 text-brand-green">
              <FileCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="text-xs font-black uppercase">Backup Export</span>
            </div>
            <p className="text-[10px] text-neutral-300 mt-1 leading-snug">
              Unduh cadangan data JSON & struktur storage sebelum eksekusi reset.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleBackupExport}
            disabled={isBackupExporting}
            className="w-full text-xs bg-brand-green/20 border-brand-green/40 text-brand-green hover:bg-brand-green/30"
          >
            <Download className="w-3 h-3 mr-1" />
            {isBackupExporting ? 'Mengespor JSON...' : 'Export Backup JSON'}
          </Button>
        </div>

        <div className="p-3 rounded-xl border border-neutral-800 bg-[#121212] space-y-1.5">
          <p className="text-[10px] font-black uppercase text-neutral-400">Alur Keamanan Terstruktur</p>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            {workflowSteps.map((step) => (
              <div key={step.num} className="flex items-center gap-1 text-neutral-300">
                <span className="w-3.5 h-3.5 rounded-full bg-neutral-800 text-neutral-400 font-mono text-[9px] flex items-center justify-center shrink-0">
                  {step.num}
                </span>
                <span className="truncate">{step.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

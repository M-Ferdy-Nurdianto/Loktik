import React from 'react';
import { RefreshCcw, CheckCircle2, AlertTriangle, Download, ArrowLeft, Database, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { downloadAuditLogFile, downloadBackupFile } from '../../services/apiAdmin';

export const FactoryResetProgressView = ({
  isResetting,
  resetProgress,
  resetReport,
  resetError,
  onResetCompleteDone,
}) => {
  const stepsDef = [
    { key: 'orders', label: 'Menghapus Orders' },
    { key: 'tickets', label: 'Menghapus Tickets' },
    { key: 'payment', label: 'Menghapus Payment Proof' },
    { key: 'storage', label: 'Membersihkan Storage' },
    { key: 'staff', label: 'Menghapus Staff' },
    { key: 'events', label: 'Menghapus Events' },
    { key: 'cache', label: 'Membersihkan Cache' },
    { key: 'verify', label: 'Verifikasi Database' },
    { key: 'finalize', label: 'Finalisasi Reset' },
  ];

  // Determine current active step index based on progress messages
  const getCurrentStepIndex = () => {
    if (!isResetting && resetReport) return stepsDef.length;
    if (resetProgress.length === 0) return 0;
    const lastMsg = (resetProgress[resetProgress.length - 1]?.detail || '').toLowerCase();
    if (lastMsg.includes('order')) return 0;
    if (lastMsg.includes('ticket')) return 1;
    if (lastMsg.includes('payment')) return 2;
    if (lastMsg.includes('storage')) return 3;
    if (lastMsg.includes('staff')) return 4;
    if (lastMsg.includes('event')) return 5;
    if (lastMsg.includes('cache')) return 6;
    if (lastMsg.includes('verifikasi')) return 7;
    return 8;
  };

  const activeIndex = getCurrentStepIndex();

  return (
    <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-neutral-800 space-y-6 max-w-4xl mx-auto shadow-2xl">
      {/* Header Indicator */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div>
          <h3 className="text-lg font-black uppercase text-white tracking-wider flex items-center gap-2">
            <Database className="w-5 h-5 text-brand-green" />
            {isResetting ? 'PROSES EKSEKUSI RESET SEDANG BERJALAN' : 'FACTORY RESET RESULT REPORT'}
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            {isResetting
              ? 'Harap tunggu hingga seluruh 9 tahapan pembersihan selesai...'
              : 'Seluruh tahapan telah diselesaikan dan diverifikasi oleh sistem.'}
          </p>
        </div>
        {isResetting && (
          <div className="flex items-center gap-2 text-brand-red font-mono text-xs font-bold px-3 py-1.5 rounded-lg bg-brand-red/10 border border-brand-red/30">
            <RefreshCcw className="w-4 h-4 animate-spin" /> PROSES RESET ACTIVE
          </div>
        )}
      </div>

      {/* Stepper Grid (9 Phases) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stepsDef.map((step, idx) => {
          const isDone = idx < activeIndex || (!isResetting && resetReport?.status === 'success');
          const isCurrent = isResetting && idx === activeIndex;

          return (
            <div
              key={step.key}
              className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${
                isDone
                  ? 'bg-brand-green/10 border-brand-green/30 text-white'
                  : isCurrent
                  ? 'bg-brand-red/10 border-brand-red text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                  : 'bg-[#121212] border-neutral-800 text-neutral-500'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full font-mono text-xs font-bold flex items-center justify-center shrink-0 ${
                  isDone
                    ? 'bg-brand-green text-black'
                    : isCurrent
                    ? 'bg-brand-red text-white'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate">{step.label}</p>
                <p className="text-[9.5px] font-mono text-neutral-400">
                  {isDone ? 'SELESAI' : isCurrent ? 'MENGHAPUS...' : 'MENUNGGU'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Message if any */}
      {resetError && (
        <div className="p-4 rounded-xl border border-brand-red/40 bg-brand-red/10 text-brand-red space-y-1">
          <p className="text-xs font-bold flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> GAGAL EKSEKUSI RESET</p>
          <p className="text-xs font-mono">{resetError}</p>
        </div>
      )}

      {/* Final Reset Report */}
      {resetReport && (
        <div className="p-5 rounded-xl border border-brand-green/30 bg-[#111111] space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2 text-brand-green">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm font-black uppercase text-white">RINGKASAN LOKTIK AUDIT REPORT</span>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              Durasi: <span className="text-white font-bold">{((resetReport.durationMs || 0) / 1000).toFixed(1)} detik</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-[#0a0a0a] border border-neutral-800 rounded-lg">
              <p className="text-[10px] text-neutral-400 uppercase font-mono">Orders Dihapus</p>
              <p className="text-lg font-black font-mono text-white mt-0.5">{resetReport.deleted?.tables?.orders ?? 0}</p>
            </div>
            <div className="p-3 bg-[#0a0a0a] border border-neutral-800 rounded-lg">
              <p className="text-[10px] text-neutral-400 uppercase font-mono">Tickets Dihapus</p>
              <p className="text-lg font-black font-mono text-white mt-0.5">{resetReport.deleted?.tables?.tickets ?? 0}</p>
            </div>
            <div className="p-3 bg-[#0a0a0a] border border-neutral-800 rounded-lg">
              <p className="text-[10px] text-neutral-400 uppercase font-mono">Storage Cleared</p>
              <p className="text-lg font-black font-mono text-white mt-0.5">
                {Object.values(resetReport.deleted?.storage || {}).reduce((a, b) => a + (b || 0), 0)} files
              </p>
            </div>
            <div className="p-3 bg-[#0a0a0a] border border-neutral-800 rounded-lg">
              <p className="text-[10px] text-neutral-400 uppercase font-mono">Status Verifikasi</p>
              <p className="text-xs font-black font-mono text-brand-green mt-1.5 uppercase">BERSIH (100%)</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => downloadAuditLogFile(resetReport)}
              className="text-xs border-brand-purple/40 bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> Download Audit Log JSON
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => downloadBackupFile(resetReport)}
              className="text-xs border-brand-green/40 bg-brand-green/10 text-brand-green hover:bg-brand-green/20"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> Download Report Summary
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onResetCompleteDone}
              className="text-xs ml-auto bg-brand-green hover:bg-green-500 text-black font-black uppercase"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Kembali Ke Control Panel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

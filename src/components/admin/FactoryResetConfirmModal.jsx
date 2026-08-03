import React from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert, Clock, Database } from 'lucide-react';
import { Button } from '../ui/Button';
import { RESET_MODES } from '../../services/apiAdmin';

export const FactoryResetConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  resetMode,
  resetDryRun,
  isResetting,
}) => {
  if (!isOpen) return null;

  const summary = resetDryRun?.summary || {};
  const isQuick = resetMode === RESET_MODES.quick;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0a0a0a] border border-brand-red rounded-2xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.25)] space-y-5">
        <div className="flex items-start justify-between border-b border-brand-red/30 pb-3">
          <div className="flex items-center gap-2.5 text-brand-red">
            <ShieldAlert className="w-6 h-6 shrink-0" />
            <div>
              <h3 className="text-base font-black uppercase text-white tracking-wider">VERIFIKASI AKHIR RESET</h3>
              <p className="text-[10px] font-mono uppercase text-brand-red/80">Tindakan ini permanen dan tidak dapat dibatalkan</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={isResetting} className="text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-brand-red/10 border border-brand-red/30 rounded-xl space-y-2">
          <p className="text-xs font-bold text-brand-red flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0" /> PERINGATAN INTEGRITAS DATABASE
          </p>
          <p className="text-[11px] text-neutral-300 leading-relaxed">
            Anda akan mengeksekusi <span className="font-black text-white uppercase">{isQuick ? 'Quick Reset' : 'Factory Reset'}</span>.
            Seluruh data operasional yang tertera di bawah ini akan dihapus secara permanen dari Supabase Database & Storage.
          </p>
        </div>

        {/* Impact Summary */}
        <div className="p-4 rounded-xl bg-[#121212] border border-neutral-800 space-y-3">
          <p className="text-[10px] font-black uppercase text-neutral-400 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-brand-green" /> Ringkasan Data Yang Dihapus
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 rounded bg-[#0a0a0a] border border-neutral-800 flex justify-between">
              <span className="text-neutral-400">Orders:</span>
              <span className="font-bold text-white">{summary.orders ?? 0}</span>
            </div>
            <div className="p-2 rounded bg-[#0a0a0a] border border-neutral-800 flex justify-between">
              <span className="text-neutral-400">Tickets:</span>
              <span className="font-bold text-white">{summary.tickets ?? 0}</span>
            </div>
            {!isQuick && (
              <>
                <div className="p-2 rounded bg-[#0a0a0a] border border-neutral-800 flex justify-between">
                  <span className="text-neutral-400">Events:</span>
                  <span className="font-bold text-white">{summary.events ?? 0}</span>
                </div>
                <div className="p-2 rounded bg-[#0a0a0a] border border-neutral-800 flex justify-between">
                  <span className="text-neutral-400">Staff Accounts:</span>
                  <span className="font-bold text-white">{summary.staff ?? 0}</span>
                </div>
              </>
            )}
            <div className="p-2 rounded bg-[#0a0a0a] border border-neutral-800 flex justify-between col-span-2">
              <span className="text-neutral-400">Storage Files (Bucket):</span>
              <span className="font-bold text-white">{summary.storage ?? 0} files</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono pt-1">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-brand-green" /> Estimasi Durasi: ~3-10 Detik</span>
            <span className="text-brand-green font-bold">Status: Ready</span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" fullWidth onClick={onClose} disabled={isResetting} className="py-2.5 text-xs">
            Batal
          </Button>
          <Button
            type="button"
            fullWidth
            onClick={onConfirm}
            disabled={isResetting}
            className="py-2.5 text-xs bg-brand-red hover:bg-red-600 text-white font-black uppercase tracking-wider shadow-[0_0_20px_rgba(239,68,68,0.4)]"
          >
            <Trash2 className="w-4 h-4 mr-1.5" /> YA, EKSEKUSI RESET SEKARANG
          </Button>
        </div>
      </div>
    </div>
  );
};

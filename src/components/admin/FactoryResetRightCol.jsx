import React from 'react';
import { Clock, ShieldCheck, Trash2, Download, History, AlertTriangle } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { RESET_MODES, downloadAuditLogFile } from '../../services/apiAdmin';

export const FactoryResetRightCol = ({
  resetInput,
  setResetInput,
  resetCountdown,
  resetMode,
  resetAuditLog,
  onRequestExecute,
  isResetting,
}) => {
  const isInputValid = resetInput === 'RESET DATABASE';
  const isSafetyDelayComplete = resetCountdown === 0;
  const canExecute = isInputValid && isSafetyDelayComplete && !isResetting;

  const formatDate = (isoString) => {
    try {
      return new Date(isoString).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="space-y-4 flex flex-col justify-between h-full">
      {/* Safety Delay & Safety Input Card */}
      <div className="p-4 rounded-xl border border-neutral-800 bg-[#121212] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-neutral-300">
            <Clock className="w-4 h-4 text-brand-green" />
            <span className="text-xs font-black uppercase">Safety Delay & Input</span>
          </div>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
            isSafetyDelayComplete ? 'bg-brand-green/20 text-brand-green' : 'bg-amber-500/20 text-amber-400 animate-pulse'
          }`}>
            {resetCountdown > 0 ? `DELAY: ${resetCountdown}S` : 'SAFETY DELAY SIAP'}
          </span>
        </div>

        <div>
          <label className="text-[10px] uppercase font-mono text-neutral-400 mb-1 block">
            Ketik Frasa Konfirmasi <span className="text-brand-red font-bold font-mono">RESET DATABASE</span>
          </label>
          <Input
            type="text"
            placeholder="RESET DATABASE"
            value={resetInput}
            onChange={(e) => setResetInput(e.target.value.toUpperCase())}
            disabled={isResetting}
            className="font-mono text-center tracking-widest bg-[#0a0a0a] border-brand-red focus:border-brand-red text-sm font-black uppercase text-white"
          />
        </div>

        <div className="text-[10px] text-neutral-400 leading-snug space-y-1">
          <p className="flex items-center gap-1">
            <ShieldCheck className={`w-3 h-3 ${isInputValid ? 'text-brand-green' : 'text-neutral-600'}`} />
            <span>Verifikasi Frasa: {isInputValid ? <span className="text-brand-green font-bold">SESUAI</span> : 'Wajib ketik RESET DATABASE'}</span>
          </p>
          <p className="flex items-center gap-1">
            <Clock className={`w-3 h-3 ${isSafetyDelayComplete ? 'text-brand-green' : 'text-amber-400'}`} />
            <span>Safety Delay 3 Detik: {isSafetyDelayComplete ? <span className="text-brand-green font-bold">SELESAI</span> : `Tunggu ${resetCountdown} detik...`}</span>
          </p>
        </div>
      </div>

      {/* Audit Log Panel */}
      <div className="p-4 rounded-xl border border-neutral-800 bg-[#121212] space-y-2.5 flex-1 flex flex-col justify-between min-h-[220px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-neutral-300">
            <History className="w-4 h-4 text-brand-purple" />
            <span className="text-xs font-black uppercase">Audit Log Activity</span>
          </div>
          {resetAuditLog.length > 0 && (
            <button
              type="button"
              onClick={() => downloadAuditLogFile(resetAuditLog)}
              className="text-[10px] font-mono text-brand-purple hover:underline flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> Unduh Log
            </button>
          )}
        </div>

        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 flex-1">
          {resetAuditLog.length === 0 ? (
            <div className="p-4 text-center border border-dashed border-neutral-800 rounded-lg text-neutral-500 text-xs">
              Belum ada riwayat aktivitas factory reset.
            </div>
          ) : (
            resetAuditLog.map((entry, index) => (
              <div key={`${entry.startedAt || index}-${index}`} className="rounded-lg border border-neutral-800 bg-[#0a0a0a] p-2.5 text-xs space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-white">{entry.actorName || 'Master Admin'}</span>
                  <span className={`font-mono uppercase font-bold ${entry.status === 'success' ? 'text-brand-green' : 'text-brand-red'}`}>
                    {entry.status}
                  </span>
                </div>
                <div className="flex justify-between text-[9.5px] text-neutral-400 font-mono">
                  <span>{entry.modeLabel || entry.mode}</span>
                  <span>{formatDate(entry.startedAt || entry.finishedAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Execution Trigger Card */}
      <div className="p-4 rounded-xl border border-brand-red/30 bg-brand-red/10 space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-black uppercase text-brand-red flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Konfirmasi Eksekusi
          </p>
          <p className="text-[10px] text-neutral-300">
            {resetMode === RESET_MODES.quick
              ? 'Quick Reset: Hanya menghapus Orders & Tickets.'
              : 'Factory Reset: Menghapus seluruh Orders, Tickets, Staff, Events, & Files.'}
          </p>
        </div>

        <Button
          type="button"
          fullWidth
          disabled={!canExecute}
          onClick={onRequestExecute}
          className={`py-3 font-black text-xs uppercase tracking-wider transition-all ${
            canExecute
              ? 'bg-brand-red hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
              : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-60'
          }`}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {!isInputValid
            ? 'KETIK RESET DATABASE DULU'
            : !isSafetyDelayComplete
            ? `TUNGGU SAFETY DELAY (${resetCountdown}S)`
            : 'LANJUTKAN KONFIRMASI FINAL'}
        </Button>
      </div>
    </div>
  );
};

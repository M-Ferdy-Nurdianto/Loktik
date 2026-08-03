import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldAlert, RefreshCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { FactoryResetLeftCol } from './FactoryResetLeftCol';
import { FactoryResetRightCol } from './FactoryResetRightCol';
import { FactoryResetConfirmModal } from './FactoryResetConfirmModal';
import { FactoryResetProgressView } from './FactoryResetProgressView';
import {
  RESET_MODES,
  factoryResetDryRun,
  exportFactoryResetBackup,
  factoryResetDatabase,
  getFactoryResetAuditLog,
  downloadBackupFile,
} from '../../services/apiAdmin';

export const FactoryResetView = ({ onCloseView, currentAdminUser }) => {
  const [resetMode, setResetMode] = useState(RESET_MODES.quick);
  const [resetInput, setResetInput] = useState('');
  const [resetDryRun, setResetDryRun] = useState(null);
  const [resetProgress, setResetProgress] = useState([]);
  const [resetReport, setResetReport] = useState(null);
  const [resetError, setResetError] = useState(null);
  const [resetCountdown, setResetCountdown] = useState(3);
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [isBackupExporting, setIsBackupExporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetAuditLog, setResetAuditLog] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const actorName = currentAdminUser?.name || currentAdminUser?.username || 'Master Admin';

  const loadDryRun = async () => {
    setIsDryRunning(true);
    try {
      const data = await factoryResetDryRun(resetMode);
      setResetDryRun(data);
      setResetError(null);
    } catch (err) {
      setResetDryRun(null);
      setResetError(err.message || 'Gagal menghitung dry run.');
    } finally {
      setIsDryRunning(false);
    }
  };

  useEffect(() => {
    loadDryRun();
    setResetAuditLog(getFactoryResetAuditLog());
  }, [resetMode]);

  useEffect(() => {
    setResetCountdown(3);
    if (resetInput !== 'RESET DATABASE') return undefined;

    const timer = setInterval(() => {
      setResetCountdown((cur) => {
        if (cur <= 1) {
          clearInterval(timer);
          return 0;
        }
        return cur - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resetInput]);

  const handleBackupExport = async () => {
    setIsBackupExporting(true);
    try {
      const backupData = await exportFactoryResetBackup(resetMode);
      downloadBackupFile(backupData);
    } catch (err) {
      setResetError('Gagal melakukan export backup: ' + err.message);
    } finally {
      setIsBackupExporting(false);
    }
  };

  const executeResetProcess = async () => {
    setShowConfirmModal(false);
    setIsResetting(true);
    setResetError(null);
    setResetReport(null);
    setResetProgress([]);

    try {
      const result = await factoryResetDatabase({
        mode: resetMode,
        actorName,
        actorRole: 'master_admin',
        onProgress: (prog) => {
          setResetProgress((prev) => [...prev, prog]);
        },
      });

      if (result?.report) {
        setResetReport(result.report);
      }
      setResetAuditLog(getFactoryResetAuditLog());
      loadDryRun();
    } catch (err) {
      setResetError(err.message || 'Factory reset gagal dieksekusi.');
      if (err.report) setResetReport(err.report);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 sm:p-6 space-y-5 bg-[#050505] text-white min-h-[calc(100vh-120px)] flex flex-col justify-between">
      {/* Top Page Bar */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={onCloseView} className="text-xs">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Kembali Ke Dasbor
          </Button>
          <div>
            <h1 className="text-xl font-black uppercase text-white tracking-wide flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-brand-red" /> FACTORY RESET CONTROL PANEL
            </h1>
            <p className="text-xs font-mono text-neutral-400">Enterprise Data Lifecycle & Reset Administration</p>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-neutral-400">
          <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
          <span>ADMIN: <strong className="text-white">{actorName}</strong></span>
        </div>
      </div>

      {/* Main Content Area */}
      {isResetting || resetReport ? (
        <FactoryResetProgressView
          isResetting={isResetting}
          resetProgress={resetProgress}
          resetReport={resetReport}
          resetError={resetError}
          onResetCompleteDone={() => {
            setResetReport(null);
            setResetProgress([]);
            setResetInput('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 items-stretch">
          <FactoryResetLeftCol
            resetMode={resetMode}
            setResetMode={setResetMode}
            resetDryRun={resetDryRun}
            isDryRunning={isDryRunning}
            handleRefreshDryRun={loadDryRun}
            handleBackupExport={handleBackupExport}
            isBackupExporting={isBackupExporting}
          />
          <FactoryResetRightCol
            resetInput={resetInput}
            setResetInput={setResetInput}
            resetCountdown={resetCountdown}
            resetMode={resetMode}
            resetAuditLog={resetAuditLog}
            onRequestExecute={() => setShowConfirmModal(true)}
            isResetting={isResetting}
          />
        </div>
      )}

      {/* Final Confirmation Modal Dialog */}
      <FactoryResetConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeResetProcess}
        resetMode={resetMode}
        resetDryRun={resetDryRun}
        isResetting={isResetting}
      />
    </div>
  );
};

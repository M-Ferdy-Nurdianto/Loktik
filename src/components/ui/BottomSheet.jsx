import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * BottomSheet / Modal — reusable overlay component.
 *
 * Mobile  : slides up from the bottom (bottom-sheet style)
 * Desktop : centered modal dialog
 *
 * Props:
 *   open        {boolean}   - controlled open state
 *   onClose     {Function}  - called when user closes
 *   title       {string}    - header title
 *   children    {ReactNode} - body content
 *   accent      {string}    - 'green' | 'blue' | 'purple' — controls header accent color
 *   maxWidth    {string}    - Tailwind max-w class for desktop, default 'max-w-2xl'
 */
export const BottomSheet = ({
  open,
  onClose,
  title,
  children,
  accent = 'green',
  maxWidth = 'max-w-2xl',
}) => {
  const sheetRef = useRef(null);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const accentHeader = {
    green: 'border-brand-green/40 text-brand-green',
    blue: 'border-brand-blue/40 text-brand-blue',
    purple: 'border-brand-purple/40 text-brand-purple',
  }[accent] ?? 'border-brand-green/40 text-brand-green';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet / Modal */}
      <div
        ref={sheetRef}
        className={`
          relative z-10 w-full ${maxWidth}
          bg-[#111111] border border-neutral-800
          rounded-t-2xl sm:rounded-2xl
          shadow-[0_-8px_60px_rgba(0,0,0,0.6)] sm:shadow-[0_0_60px_rgba(0,0,0,0.6)]
          flex flex-col
          max-h-[90dvh] sm:max-h-[85dvh]
          animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200
        `}
      >
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden" aria-hidden="true">
          <div className="w-10 h-1 rounded-full bg-neutral-700" />
        </div>

        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${accentHeader}`}>
          <h2 className={`text-sm font-black uppercase tracking-tight ${accentHeader.split(' ')[1]}`}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto overscroll-contain flex-1 px-5 py-5 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};

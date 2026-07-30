import React, { createContext, useContext, useState, useCallback } from 'react';
import { X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, role = null) => {
    // Auto-detect role from path if not provided
    let activeRole = role;
    if (!activeRole) {
      const path = window.location.pathname;
      if (path.startsWith('/gate/')) {
        activeRole = 'staff';
      } else if (path.startsWith('/eo/') || path.startsWith('/admin')) {
        activeRole = 'eo';
      } else {
        activeRole = 'user';
      }
    }

    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, role: activeRole }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getThemeClasses = (role) => {
    switch (role) {
      case 'eo':
        return {
          border: 'border-[#39FF14]/80',
          text: 'text-[#39FF14]',
          shadow: 'shadow-[0_0_15px_rgba(57,255,20,0.25)]',
          badge: 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30'
        };
      case 'staff':
        return {
          border: 'border-[#8B5CF6]/80',
          text: 'text-[#8B5CF6]',
          shadow: 'shadow-[0_0_15px_rgba(139,92,246,0.25)]',
          badge: 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/30'
        };
      case 'user':
      default:
        return {
          border: 'border-[#06B6D4]/80',
          text: 'text-[#06B6D4]',
          shadow: 'shadow-[0_0_15px_rgba(6,182,212,0.25)]',
          badge: 'bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/30'
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container: centered bottom on mobile, top right on desktop */}
      <div className="fixed z-[9999] flex flex-col gap-3 w-full max-w-[320px] px-4 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 sm:top-4 sm:right-4 sm:left-auto sm:bottom-auto sm:translate-x-0 sm:translate-y-0 pointer-events-none items-center justify-center">
        {toasts.map((toast) => {
          const theme = getThemeClasses(toast.role);
          return (
            <div
              key={toast.id}
              className={`w-full pointer-events-auto bg-[#121212] border-2 ${theme.border} rounded-lg p-4 flex items-start justify-between gap-3 ${theme.shadow} transition-all duration-300 animate-slide-in`}
              role="alert"
            >
              <div className="flex-1 text-xs font-black uppercase tracking-wider leading-relaxed text-white">
                <span className={`inline-block text-[8px] font-mono px-1.5 py-0.5 rounded border ${theme.badge} mr-2 align-middle`}>
                  {toast.role === 'eo' ? 'EO/ADMIN' : toast.role === 'staff' ? 'GATE/STAFF' : 'LOKTIK'}
                </span>
                <span className="align-middle">{toast.message}</span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className={`p-0.5 rounded hover:bg-neutral-800 transition-colors ${theme.text}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

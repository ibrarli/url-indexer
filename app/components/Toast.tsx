'use client';

import { useEffect } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export default function Toast({ toasts, onClose }: ToastProps) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const styles = {
    success: 'bg-white border-emerald-300 text-emerald-900',
    error: 'bg-white border-red-300 text-red-900',
    info: 'bg-white border-blue-300 text-blue-900',
  }[toast.type];

  const badgeStyles = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  }[toast.type];

  return (
    <div
      className={`pointer-events-auto flex items-start justify-between gap-3 p-3.5 rounded-md border shadow-lg transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${styles}`}
    >
      <div className="flex items-start gap-2.5">
        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${badgeStyles}`} />
        <div>
          <p className="text-xs font-semibold font-sans">{toast.title}</p>
          {toast.message && (
            <p className="text-[11px] text-gray-600 font-mono mt-0.5 break-all">
              {toast.message}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={() => onClose(toast.id)}
        className="text-gray-400 hover:text-gray-700 text-xs font-bold leading-none p-0.5 cursor-pointer"
      >
        ✕
      </button>
    </div>
  );
}
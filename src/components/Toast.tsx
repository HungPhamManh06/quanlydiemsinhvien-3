import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [leaving, setLeaving] = useState(false);
  const duration = toast.duration ?? 3500;

  const handleClose = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onRemove(toast.id), 300);
  }, [toast.id, onRemove]);

  useEffect(() => {
    const timer = setTimeout(handleClose, duration);
    return () => clearTimeout(timer);
  }, [duration, handleClose]);

  const configs = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5" />,
      bg: 'bg-emerald-500',
      bar: 'bg-emerald-300',
      border: 'border-emerald-400',
    },
    error: {
      icon: <XCircle className="w-5 h-5" />,
      bg: 'bg-red-500',
      bar: 'bg-red-300',
      border: 'border-red-400',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5" />,
      bg: 'bg-amber-500',
      bar: 'bg-amber-300',
      border: 'border-amber-400',
    },
    info: {
      icon: <Info className="w-5 h-5" />,
      bg: 'bg-blue-500',
      bar: 'bg-blue-300',
      border: 'border-blue-400',
    },
  };

  const cfg = configs[toast.type];

  return (
    <div
      className={`relative flex items-start gap-3 min-w-[300px] max-w-sm rounded-xl shadow-xl overflow-hidden text-white
        ${cfg.bg} ${leaving ? 'animate-toast-out' : 'animate-toast-in'}`}
    >
      {/* Icon */}
      <div className="flex-shrink-0 p-3.5 pr-0">{cfg.icon}</div>

      {/* Content */}
      <div className="flex-1 py-3 pr-2">
        <p className="font-semibold text-sm leading-tight">{toast.title}</p>
        {toast.message && (
          <p className="text-white/80 text-xs mt-0.5 leading-snug">{toast.message}</p>
        )}
      </div>

      {/* Close */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-3 opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${cfg.bar}`}
        style={{
          animation: `progressBar ${duration}ms linear forwards`,
        }}
      />
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev.slice(-4), { ...toast, id }]);
  }, []);

  const success = useCallback((title: string, message?: string) =>
    showToast({ type: 'success', title, message }), [showToast]);
  const error = useCallback((title: string, message?: string) =>
    showToast({ type: 'error', title, message }), [showToast]);
  const warning = useCallback((title: string, message?: string) =>
    showToast({ type: 'warning', title, message }), [showToast]);
  const info = useCallback((title: string, message?: string) =>
    showToast({ type: 'info', title, message }), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

import { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from 'react';

interface Toast { id: number; message: string; type: 'success' | 'error' | 'info'; }
interface ToastContextType { toast: (message: string, type?: Toast['type']) => void; }

const ToastContext = createContext<ToastContextType | null>(null);
let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = ++toastId; setToasts(prev => [...prev, { id, message, type }]);
  }, []);
  const removeToast = useCallback((id: number) => { setToasts(prev => prev.filter(t => t.id !== id)); }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm">
        {toasts.map(t => <ToastItem key={t.id} toast={t} onDismiss={removeToast} />)}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => { const timer = setTimeout(() => onDismiss(toast.id), 3500); return () => clearTimeout(timer); }, [toast.id, onDismiss]);
  const icon = toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info';
  const iconColor = toast.type === 'success' ? 'text-primary' : toast.type === 'error' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <div className="clay-card px-5 py-3 flex items-center gap-3 cursor-pointer animate-in slide-in-from-right-5 fade-in duration-300"
      onClick={() => onDismiss(toast.id)}>
      <span className={`material-symbols-outlined fill text-[22px] ${iconColor}`}>{icon}</span>
      <span className="text-sm font-semibold text-foreground">{toast.message}</span>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}

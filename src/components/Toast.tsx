import { CheckCircle, AlertCircle } from 'lucide-react';

interface ToastProps {
  toast: { message: string; type: 'success' | 'error' } | null;
}

export default function Toast({ toast }: ToastProps) {
  if (!toast) return null;

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '20px', 
      right: '20px', 
      background: toast.type === 'success' ? 'var(--bg-panel)' : 'hsl(355, 85%, 10%)',
      border: `1px solid ${toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'}`,
      padding: '12px 20px',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
      zIndex: 1000,
      animation: 'slideUp 180ms ease'
    }}>
      {toast.type === 'success' ? (
        <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />
      ) : (
        <AlertCircle size={16} style={{ color: 'var(--color-danger)' }} />
      )}
      <span style={{ fontSize: '12.5px', fontWeight: 500 }}>{toast.message}</span>
    </div>
  );
}

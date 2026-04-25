import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)); }, duration);
  }, []);

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const colors = {
    success: { border: '#0066FF', icon: '✅' },
    error:   { border: '#EF4444', icon: '❌' },
    warning: { border: '#FBBF24', icon: '⚠️' },
    info:    { border: '#00CCFF', icon: 'ℹ️' },
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{ position:'fixed', bottom:'1.5rem', right:'1.5rem', zIndex:9999, display:'flex', flexDirection:'column', gap:'0.625rem' }}>
        {toasts.map(toast => {
          const c = colors[toast.type] || colors.success;
          return (
            <div key={toast.id} onClick={() => removeToast(toast.id)} className="toast"
              style={{ background:'rgba(10,10,10,0.98)', border:`1px solid ${c.border}`, borderLeft:`4px solid ${c.border}`, borderRadius:'0.375rem', padding:'0.875rem 1.25rem', display:'flex', alignItems:'center', gap:'0.75rem', minWidth:'280px', maxWidth:'400px', boxShadow:`0 8px 32px rgba(0,0,0,0.6)`, cursor:'pointer', fontFamily:'Inter, sans-serif', fontSize:'0.875rem', color:'white' }}>
              <span>{c.icon}</span><span style={{flex:1}}>{toast.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

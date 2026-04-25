import React, { useEffect, useState } from 'react';

const Toast = () => {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    window.showToast = (message, type = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    };
  }, []);

  if (!toast) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 transform transition-all duration-300 ${toast ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className={`px-6 py-4 rounded-lg shadow-2xl border-l-4 flex items-center gap-3 ${
        toast.type === 'error' 
          ? 'bg-red-900/90 border-red-500' 
          : 'bg-rd-card border-rd-blue'
      }`}>
        <i className={`fas ${toast.type === 'error' ? 'fa-exclamation-circle text-red-500' : 'fa-check-circle text-rd-blue'}`}></i>
        <span className="text-white">{toast.message}</span>
      </div>
    </div>
  );
};

export default Toast;
import React, { useEffect, useState } from 'react';

let toastListeners = [];

export function addToast(message, type = 'success') {
  const id = Date.now() + Math.random();
  toastListeners.forEach(listener => listener({ id, message, type }));
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (newToast) => {
      setToasts(prev => [...prev, newToast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 3000);
    };

    toastListeners.push(handler);
    return () => {
      toastListeners = toastListeners.filter(l => l !== handler);
    };
  }, []);

  return (
    <div className="toast-container d-flex flex-column gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`custom-toast alert alert-${toast.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show m-0 d-flex align-items-center justify-content-between p-3`}
          role="alert"
        >
          <div className="d-flex align-items-center gap-2">
            <span>{toast.type === 'success' ? '✔️' : '❌'}</span>
            <span className="fw-medium text-dark">{toast.message}</span>
          </div>
          <button
            type="button"
            className="btn-close ms-3"
            style={{ position: 'static', padding: '0.25rem' }}
            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
          />
        </div>
      ))}
    </div>
  );
}
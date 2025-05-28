'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

// Toast type definition
export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

// Toast Context
interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast Provider Component
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'info', duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    
    if (duration !== Infinity) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
  };

  const hideToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

// Hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Individual Toast Component
const ToastItem = ({ toast, onClose }: { toast: Toast; onClose: () => void }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation after a small delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  useEffect(() => {
    return () => {
      setIsExiting(false);
      setIsVisible(false);
    };
  }, []);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500 animate-pulse" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500 animate-bounce" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500 animate-pulse" />;
      default:
        return null;
    }
  };

  const getBgColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20';
      case 'error':
        return 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20';
      case 'info':
        return 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20';
      default:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50';
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-l-4 border-green-500';
      case 'error':
        return 'border-l-4 border-red-500';
      case 'info':
        return 'border-l-4 border-blue-500';
      default:
        return 'border-l-4 border-gray-500';
    }
  };

  return (
    <div
      className={`flex items-center max-w-md w-full ${getBgColor()} ${getBorderColor()} shadow-lg rounded-md overflow-hidden backdrop-blur-lg mb-3 transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-y-2 scale-95' : isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'
      }`}
    >
      <div className="flex p-4 w-full justify-between items-center">
        <div className="flex items-center">
          {getIcon()}
          <p className="ml-3 text-sm font-medium text-gray-800 dark:text-gray-200">{toast.message}</p>
        </div>
        <button
          onClick={handleClose}
          className="ml-5 rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none transition-transform hover:scale-110 active:scale-95"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

// Toast Container that renders all toasts
const ToastContainer = () => {
  const { toasts, hideToast } = useToast();

  return (
    <div className="fixed z-50 bottom-4 left-1/2 transform -translate-x-1/2 md:right-4 md:bottom-4 md:left-auto md:translate-x-0 flex flex-col items-center md:items-end pointer-events-none">
      <div className="max-h-screen overflow-hidden flex flex-col-reverse gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onClose={() => hideToast(toast.id)} />
          </div>
        ))}
      </div>
    </div>
  );
};

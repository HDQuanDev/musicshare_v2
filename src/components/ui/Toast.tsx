"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

// Toast type definition
export type ToastType = "success" | "error" | "info";

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

  const showToast = (
    message: string,
    type: ToastType = "info",
    duration = 5000
  ) => {
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
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

// Individual Toast Component
const ToastItem = ({
  toast,
  onClose,
}: {
  toast: Toast;
  onClose: () => void;
}) => {
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
      case "success":
        return (
          <CheckCircle className="w-5 h-5 text-emerald-400 animate-pulse drop-shadow-lg" />
        );
      case "error":
        return (
          <AlertCircle className="w-5 h-5 text-red-400 animate-bounce drop-shadow-lg" />
        );
      case "info":
        return (
          <Info className="w-5 h-5 text-purple-400 animate-pulse drop-shadow-lg" />
        );
      default:
        return null;
    }
  };

  const getBgColor = () => {
    switch (toast.type) {
      case "success":
        return "bg-gradient-to-br from-emerald-500/20 via-green-500/10 to-teal-500/20 border border-emerald-400/30";
      case "error":
        return "bg-gradient-to-br from-red-500/20 via-pink-500/10 to-rose-500/20 border border-red-400/30";
      case "info":
        return "bg-gradient-to-br from-purple-500/20 via-violet-500/10 to-indigo-500/20 border border-purple-400/30";
      default:
        return "bg-gradient-to-br from-slate-500/20 via-gray-500/10 to-zinc-500/20 border border-slate-400/30";
    }
  };

  const getGlowEffect = () => {
    switch (toast.type) {
      case "success":
        return "shadow-xl shadow-emerald-500/30 before:absolute before:inset-0 before:bg-gradient-to-br before:from-emerald-400/5 before:to-green-400/5 before:rounded-xl";
      case "error":
        return "shadow-xl shadow-red-500/30 before:absolute before:inset-0 before:bg-gradient-to-br before:from-red-400/5 before:to-pink-400/5 before:rounded-xl";
      case "info":
        return "shadow-xl shadow-purple-500/30 before:absolute before:inset-0 before:bg-gradient-to-br before:from-purple-400/5 before:to-violet-400/5 before:rounded-xl";
      default:
        return "shadow-xl shadow-slate-500/30 before:absolute before:inset-0 before:bg-gradient-to-br before:from-slate-400/5 before:to-gray-400/5 before:rounded-xl";
    }
  };

  return (
    <div
      className={`relative flex items-center max-w-md w-full ${getBgColor()} ${getGlowEffect()} rounded-xl overflow-hidden backdrop-blur-xl mb-3 transition-all duration-300 group ${
        isExiting
          ? "opacity-0 translate-y-2 scale-95"
          : isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-2 scale-95"
      }`}
    >
      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>

      {/* Glass morphism overlay */}
      <div className="absolute inset-0 bg-white/5 rounded-xl"></div>

      <div className="relative flex p-4 w-full justify-between items-center z-10">
        <div className="flex items-center">
          <div className="flex-shrink-0">{getIcon()}</div>
          <p className="ml-3 text-sm font-medium text-white leading-relaxed drop-shadow-sm">
            {toast.message}
          </p>
        </div>
        <button
          onClick={handleClose}
          className="ml-4 flex-shrink-0 p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 focus:outline-none transition-all duration-200 hover:scale-110 active:scale-95 group-hover:bg-white/20"
        >
          <X className="h-4 w-4 drop-shadow-sm" />
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
      {/* Background glow effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-t from-purple-500/5 via-transparent to-transparent blur-3xl opacity-50"></div>
      </div>

      <div className="relative max-h-screen overflow-hidden flex flex-col-reverse gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onClose={() => hideToast(toast.id)} />
          </div>
        ))}
      </div>
    </div>
  );
};

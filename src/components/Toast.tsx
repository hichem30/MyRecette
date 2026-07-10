"use client";

import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { X, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

// Toast types
type ToastType = "success" | "error" | "warning" | "info";

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextValue {
  addToast: (message: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, "id">) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {typeof window !== "undefined" && (
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      )}
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}) {
  const container = typeof window !== "undefined" ? document.body : null;

  if (!container) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80 sm:w-96">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => onRemove(toast.id)}
        />
      ))}
    </div>,
    container
  );
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: ToastMessage;
  onRemove: () => void;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onRemove, 300); // Allow fade-out animation
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast.duration, onRemove]);

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const Icon = icons[toast.type];
  const colors = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    error: "bg-red-50 text-red-700 border-red-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-4 shadow-lg transition-opacity",
        colors[toast.type],
        visible ? "opacity-100" : "opacity-0"
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1">
          {toast.title && (
            <h4 className="font-semibold text-sm mb-1">{toast.title}</h4>
          )}
          <p className="text-sm">{toast.message}</p>
        </div>
        <button
          onClick={onRemove}
          className="flex-shrink-0 text-current hover:text-neutral-700 transition-colors"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Hook for easy toast notifications
export function useNotifications() {
  const { addToast, removeToast } = useToast();

  return {
    success: (message: string, options?: Omit<ToastMessage, "id" | "type" | "message">) =>
      addToast({ type: "success", message, ...options }),
    error: (message: string, options?: Omit<ToastMessage, "id" | "type" | "message">) =>
      addToast({ type: "error", message, ...options }),
    warning: (message: string, options?: Omit<ToastMessage, "id" | "type" | "message">) =>
      addToast({ type: "warning", message, ...options }),
    info: (message: string, options?: Omit<ToastMessage, "id" | "type" | "message">) =>
      addToast({ type: "info", message, ...options }),
  };
}

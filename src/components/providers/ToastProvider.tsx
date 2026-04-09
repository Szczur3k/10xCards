import React, { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * ToastProvider - Provides toast notification context to the application
 * Manages global notification system with auto-dismiss and action buttons
 * Supports success, error, warning, and info toast types
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toastData: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = {
      id,
      duration: 5000, // Default 5 seconds
      ...toastData,
    };

    setToasts((prev) => [...prev, toast]);

    // Auto-dismiss after duration
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    clearToasts,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Container - positioned fixed */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              max-w-sm p-4 rounded-lg shadow-lg border
              ${toast.type === "success" ? "bg-green-50 border-green-200 text-green-800" : ""}
              ${toast.type === "error" ? "bg-red-50 border-red-200 text-red-800" : ""}
              ${toast.type === "warning" ? "bg-yellow-50 border-yellow-200 text-yellow-800" : ""}
              ${toast.type === "info" ? "bg-blue-50 border-blue-200 text-blue-800" : ""}
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-sm">{toast.title}</h4>
                {toast.description && <p className="text-sm opacity-90 mt-1">{toast.description}</p>}
              </div>
              <button onClick={() => removeToast(toast.id)} className="ml-2 text-current opacity-50 hover:opacity-100">
                ×
              </button>
            </div>
            {toast.action && (
              <div className="mt-3">
                <button onClick={toast.action.onClick} className="text-sm font-medium underline hover:no-underline">
                  {toast.action.label}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * useToast - Hook to access toast context
 * Throws error if used outside ToastProvider
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

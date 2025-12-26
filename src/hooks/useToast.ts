import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastMessage, ToastContainer } from '@/components/Toast';

interface ToastContextType {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  showSuccess: (title: string, message?: string, action?: ToastMessage['action']) => void;
  showError: (title: string, message?: string, action?: ToastMessage['action']) => void;
  showInfo: (title: string, message?: string, action?: ToastMessage['action']) => void;
  showWarning: (title: string, message?: string, action?: ToastMessage['action']) => void;
  clearToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Toast provider component that manages toast notifications throughout the app
 * @param children - React components that will have access to toast functionality
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  /**
   * Adds a new toast notification to the queue
   * @param toast - Toast object without id (id will be generated automatically)
   */
  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastMessage = {
      ...toast,
      id,
    };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  /**
   * Shows a success toast notification
   * @param title - The toast title
   * @param message - Optional detailed message
   * @param action - Optional action button
   */
  const showSuccess = useCallback((title: string, message?: string, action?: ToastMessage['action']) => {
    showToast({ type: 'success', title, message, action });
  }, [showToast]);

  /**
   * Shows an error toast notification (stays visible for 8 seconds)
   * @param title - The toast title
   * @param message - Optional detailed message
   * @param action - Optional action button
   */
  const showError = useCallback((title: string, message?: string, action?: ToastMessage['action']) => {
    showToast({ type: 'error', title, message, action, duration: 8000 }); // Errors stay longer
  }, [showToast]);

  /**
   * Shows an info toast notification
   * @param title - The toast title
   * @param message - Optional detailed message
   * @param action - Optional action button
   */
  const showInfo = useCallback((title: string, message?: string, action?: ToastMessage['action']) => {
    showToast({ type: 'info', title, message, action });
  }, [showToast]);

  /**
   * Shows a warning toast notification (stays visible for 7 seconds)
   * @param title - The toast title
   * @param message - Optional detailed message
   * @param action - Optional action button
   */
  const showWarning = useCallback((title: string, message?: string, action?: ToastMessage['action']) => {
    showToast({ type: 'warning', title, message, action, duration: 7000 }); // Warnings stay longer
  }, [showToast]);

  /**
   * Removes a specific toast notification by ID
   * @param id - The ID of the toast to remove
   */
  const clearToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  /**
   * Clears all active toast notifications
   */
  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value: ToastContextType = {
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    clearToast,
    clearAllToasts,
  };

  return React.createElement(
    ToastContext.Provider,
    { value },
    children,
    React.createElement(ToastContainer, { toasts, onClose: clearToast })
  );
}

/**
 * Hook for accessing toast functionality throughout the app
 * @throws Error if used outside of ToastProvider
 * @returns Toast context with all toast methods and current toasts
 */
export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
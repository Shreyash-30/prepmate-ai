import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

let count = 0;

const genId = () => {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
};

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = genId();
      const newToast = { ...toast, id, open: true };
      setToasts((prev) => [...prev, newToast]);

      // Auto-remove after 3 seconds
      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);

      return {
        id,
        dismiss: () => {
          clearTimeout(timer);
          setToasts((prev) => prev.filter((t) => t.id !== id));
        },
      };
    },
    []
  );

  const dismiss = useCallback((toastId?: string) => {
    if (toastId) {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    } else {
      setToasts([]);
    }
  }, []);

  return {
    toasts,
    toast: addToast,
    dismiss,
  };
}

export const toast = {
  message: (message: string) => {
    console.log('Toast:', message);
  },
  success: (title: string, description?: string) => {
    console.log('Success:', title, description);
  },
  error: (title: string, description?: string) => {
    console.log('Error:', title, description);
  },
  warning: (title: string, description?: string) => {
    console.log('Warning:', title, description);
  },
};

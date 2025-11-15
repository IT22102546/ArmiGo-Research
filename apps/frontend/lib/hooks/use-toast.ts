import { useCallback } from "react";
import { toast as sonnerToast } from "sonner";

interface ToastOptions {
  title?: string;
  description?: string;
  status?: "success" | "error" | "info" | "warning";
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    const { title, description, status = "info", duration, action } = options;

    const toastOptions = {
      description,
      duration,
      action: action
        ? {
            label: action.label,
            onClick: action.onClick,
          }
        : undefined,
    };

    // Use the message (title) as the first argument
    const message = title || description || "";

    switch (status) {
      case "success":
        sonnerToast.success(message, toastOptions);
        break;
      case "error":
        sonnerToast.error(message, toastOptions);
        break;
      case "warning":
        sonnerToast.warning(message, toastOptions);
        break;
      case "info":
      default:
        sonnerToast.info(message, toastOptions);
        break;
    }
  }, []);

  // Convenience methods for common toast types
  const success = useCallback(
    (title: string, description?: string) => {
      toast({ title, description, status: "success" });
    },
    [toast]
  );

  const error = useCallback(
    (title: string, description?: string) => {
      toast({ title, description, status: "error" });
    },
    [toast]
  );

  const warning = useCallback(
    (title: string, description?: string) => {
      toast({ title, description, status: "warning" });
    },
    [toast]
  );

  const info = useCallback(
    (title: string, description?: string) => {
      toast({ title, description, status: "info" });
    },
    [toast]
  );

  return {
    toast,
    success,
    error,
    warning,
    info,
  };
}

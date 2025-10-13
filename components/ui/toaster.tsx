"use client";

import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastDescription,
  ToastTitle,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map(({ id, title, description, variant, ...props }) => (
        <div
          key={id}
          className="mb-2 animate-in slide-in-from-top-full sm:slide-in-from-bottom-full"
        >
          <Toast
            variant={variant}
            onClose={() => removeToast(id)}
            {...props}
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
          </Toast>
        </div>
      ))}
    </div>
  );
}

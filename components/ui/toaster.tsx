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
    <div className="fixed bottom-4 right-4 z-[100] flex max-h-screen w-full flex-col gap-2 md:max-w-[380px]">
      {toasts.map(({ id, title, description, variant, ...props }) => (
        <div
          key={id}
          className="animate-in slide-in-from-right fade-in"
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

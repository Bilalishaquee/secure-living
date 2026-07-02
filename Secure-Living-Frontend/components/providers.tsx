"use client";

import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/lib/toast-context";
import { ToastViewport } from "@/components/ui/Toast";
import { FeatureFlagProvider } from "@/lib/feature-flags";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <FeatureFlagProvider>
          {children}
          <ToastViewport />
        </FeatureFlagProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

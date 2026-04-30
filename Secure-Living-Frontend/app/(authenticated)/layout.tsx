import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RouteGuards";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <DashboardLayout>{children}</DashboardLayout>
    </RequireAuth>
  );
}

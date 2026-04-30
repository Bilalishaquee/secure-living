"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="stessa-app flex h-[100dvh] max-h-[100dvh] min-h-0 overflow-hidden bg-[#f4f5f7]">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#f4f5f7]">
        <TopBar />
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="app-shell-gradient relative flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto"
        >
          <div className="relative z-10 mx-auto w-full max-w-[1400px] flex-1 py-5 font-sans sm:py-6 pl-[max(1rem,var(--safe-left))] pr-[max(1rem,var(--safe-right))] sm:pl-[max(1.25rem,var(--safe-left))] sm:pr-[max(1.25rem,var(--safe-right))] lg:pl-[max(1.5rem,var(--safe-left))] lg:pr-[max(1.5rem,var(--safe-right))] pb-[max(1.25rem,var(--safe-bottom))]">
            {children}
          </div>
        </motion.main>
      </div>
    </div>
  );
}

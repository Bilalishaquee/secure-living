"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            {/* Backdrop */}
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-brand-navy/45 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>

            {/*
              Centering wrapper — fixed inset-0 flex container.
              Using a flexbox wrapper instead of translate(-50%,-50%) on the
              modal itself avoids the framer-motion transform conflict where
              the y-animation inline style overrides Tailwind's -translate
              CSS classes, causing the modal to appear off-center.
            */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
              <Dialog.Content asChild forceMount>
                <motion.div
                  className={cn(
                    "flex max-h-[92dvh] w-full max-w-[44rem] flex-col rounded-2xl border border-white/80 bg-white/95 font-sans shadow-[0_24px_80px_rgba(0,0,0,0.14)] ring-1 ring-brand-blue/[0.06] backdrop-blur-xl focus:outline-none",
                    className
                  )}
                  initial={{ opacity: 0, scale: 0.95, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 16 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  {/* Sticky header */}
                  <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                    <div>
                      <Dialog.Title className="font-display text-xl font-semibold text-brand-navy">
                        {title}
                      </Dialog.Title>
                      {description ? (
                        <Dialog.Description className="mt-1 text-sm text-[var(--text-secondary)]">
                          {description}
                        </Dialog.Description>
                      ) : null}
                    </div>
                    <Dialog.Close asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Close dialog"
                        className="shrink-0"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </Dialog.Close>
                  </div>

                  {/* Scrollable body */}
                  <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 [scrollbar-width:thin]">
                    {children}
                  </div>
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}

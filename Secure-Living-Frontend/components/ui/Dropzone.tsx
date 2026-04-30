"use client";

import { Upload, FileText, X } from "lucide-react";
import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

const ACCEPT = ".pdf,.jpg,.jpeg,.png,image/*,application/pdf";

type DropzoneProps = {
  label: string;
  onFileSelect: (file: File | null) => void;
  className?: string;
};

export function Dropzone({ label, onFileSelect, className }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const simulateProgress = useCallback(() => {
    setProgress(0);
    const id = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          window.clearInterval(id);
          return 100;
        }
        return p + 12;
      });
    }, 120);
  }, []);

  const handleFile = useCallback(
    (f: File | null) => {
      setFile(f);
      onFileSelect(f);
      if (f) simulateProgress();
      else setProgress(0);
    },
    [onFileSelect, simulateProgress]
  );

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    handleFile(f);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0] ?? null;
    if (f) handleFile(f);
  };

  const previewUrl =
    file && file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : null;

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "cursor-pointer rounded-xl border-2 border-dashed border-surface-border bg-surface-gray p-8 text-center transition-colors hover:border-brand-blue/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue",
          dragOver && "border-brand-blue bg-escrow"
        )}
        aria-label={`Upload ${label}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={onChange}
        />
        {!file ? (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-10 w-10 text-brand-blue" aria-hidden />
            <span className="text-sm text-[var(--text-secondary)]">
              Drag and drop or click to upload (PDF, JPG, PNG)
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt=""
                className="h-24 w-auto max-w-full rounded-lg object-cover"
              />
            ) : (
              <FileText className="h-12 w-12 text-brand-blue" aria-hidden />
            )}
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {file.name}
            </span>
            <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-surface-border">
              <div
                className="h-full bg-brand-blue transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              <X className="mr-1 h-4 w-4" />
              Remove
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

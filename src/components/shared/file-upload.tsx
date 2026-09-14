"use client";

import * as React from "react";
import { FileSpreadsheet, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface UploadedFile {
  name: string;
  size: number;
}

/** Drag-and-drop file input. The file is never transmitted in this prototype. */
export function FileUpload({
  accept = ".xlsx,.xls,.csv",
  hint = "XLSX, XLS or CSV · up to 10 MB",
  onFileSelected,
  file,
  onClear,
  uploading = false,
  progress = 0,
  label = "Drag and drop your file here",
  disabled = false,
}: {
  accept?: string;
  hint?: string;
  onFileSelected: (file: UploadedFile) => void;
  file?: UploadedFile | null;
  onClear?: () => void;
  uploading?: boolean;
  progress?: number;
  label?: string;
  disabled?: boolean;
}) {
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function handleFiles(list: FileList | null) {
    const picked = list?.[0];
    if (!picked) return;
    onFileSelected({ name: picked.name, size: picked.size });
  }

  if (file) {
    return (
      <div className="rounded-xl border border-ink-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-success-50 text-success-600 ring-1 ring-success-100">
            <FileSpreadsheet className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-navy-900">{file.name}</p>
            <p className="text-xs text-ink-500">
              {(file.size / 1024).toFixed(0)} KB {uploading ? "· uploading…" : "· ready to validate"}
            </p>
          </div>
          {onClear && !uploading && (
            <Button variant="ghost" size="icon-sm" onClick={onClear} aria-label="Remove file">
              <X />
            </Button>
          )}
        </div>
        {uploading && (
          <ProgressBar value={progress} className="mt-3" size="sm" tone="ember" label="Upload progress" />
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "rounded-xl border-2 border-dashed p-8 text-center transition-colors",
        disabled && "pointer-events-none opacity-60",
        dragging ? "border-ember-400 bg-ember-50/60" : "border-ink-300 bg-ink-50/40 hover:border-navy-300",
      )}
    >
      <span
        className={cn(
          "mx-auto mb-4 flex size-12 items-center justify-center rounded-xl transition-colors",
          dragging ? "bg-ember-100 text-ember-600" : "bg-white text-navy-600 shadow-sm ring-1 ring-ink-200",
        )}
      >
        <UploadCloud className="size-5" aria-hidden />
      </span>
      <p className="font-display text-sm font-semibold text-navy-900">{label}</p>
      <p className="mt-1 text-xs text-ink-500">{hint}</p>
      <Button
        variant="secondary"
        size="sm"
        className="mt-4"
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        Browse files
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
        aria-label="Choose a file to upload"
      />
    </div>
  );
}

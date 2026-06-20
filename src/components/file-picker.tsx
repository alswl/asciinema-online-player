"use client";

import { useRef } from "react";
import { FolderOpen } from "lucide-react";

export interface FilePickerProps {
  disabled?: boolean;
  onFileSelected: (file: File) => void;
  label?: string;
}

export function FilePicker({
  disabled = false,
  onFileSelected,
  label = "Open a .cast file",
}: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClick() {
    inputRef.current?.click();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--accent-500)] to-[var(--accent-400)] px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-md)] transition-all hover:shadow-[var(--shadow-glow)] hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-[var(--shadow-md)]"
        disabled={disabled}
        onClick={handleClick}
        type="button"
      >
        <FolderOpen className="h-4 w-4" aria-hidden="true" />
        {label}
      </button>
      <input
        ref={inputRef}
        accept=".cast,application/json,text/plain"
        aria-hidden="true"
        className="hidden"
        onChange={handleChange}
        tabIndex={-1}
        type="file"
      />
    </div>
  );
}

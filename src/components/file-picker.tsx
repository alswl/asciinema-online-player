"use client";

import { useRef } from "react";

export interface FilePickerProps {
  disabled?: boolean;
  onFileSelected: (file: File) => void;
}

export function FilePicker({
  disabled = false,
  onFileSelected,
}: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClick() {
    inputRef.current?.click();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
    // Reset so the same file can be picked again
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        className="min-h-11 rounded-md bg-teal-500 px-5 text-sm font-semibold text-slate-950 hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        onClick={handleClick}
        type="button"
      >
        Open local file
      </button>
      <input
        ref={inputRef}
        accept=".cast,application/json,text/plain"
        className="hidden"
        onChange={handleChange}
        type="file"
      />
    </div>
  );
}

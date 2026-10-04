import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FileDrop({
  accept,
  label,
  hint,
  onFile,
  disabled,
  className,
}: {
  accept: string;
  label: ReactNode;
  hint?: string;
  onFile: (file: File) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [over, setOver] = useState(false);

  return (
    <label
      className={cn(
        "flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 text-center text-sm transition-colors duration-150",
        over
          ? "border-brand bg-muted text-foreground"
          : "border-input bg-muted/50 text-muted-foreground hover:bg-muted",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      onDragEnter={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
    >
      {label}
      {hint ? <span className="mt-1 text-xs text-muted-foreground">{hint}</span> : null}
      <input
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </label>
  );
}

import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Toaster } from "sonner";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid size-8 place-items-center rounded-sm bg-primary text-lg leading-none font-serif text-primary-foreground"
            >
              D
            </span>
            <span className="font-serif text-xl tracking-tight italic">Debrief</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <a
              href="/#how"
              className="inline-flex h-11 items-center rounded-md px-3 text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              How it works
            </a>
            <Link
              to="/"
              hash="archive"
              className="inline-flex h-11 items-center rounded-md px-3 text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              Archive
            </Link>
          </nav>
        </div>
      </header>
      {children}
      <Toaster
        position="top-center"
        theme="light"
        toastOptions={{
          className: "font-sans",
        }}
      />
    </div>
  );
}

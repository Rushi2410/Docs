import Link from "next/link";
import { Github, Linkedin, MoveUpRight } from "lucide-react";

type AppFooterProps = {
  compact?: boolean;
};

export function AppFooter({ compact = false }: AppFooterProps) {
  return (
    <footer className={`panel mt-8 rounded-[1.8rem] px-5 py-5 shadow-[0_14px_35px_rgba(28,22,17,0.04)] ${compact ? "" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-xl">
          <p className="text-sm font-semibold tracking-[0.18em] uppercase text-[var(--accent)]">Docs</p>
          <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
            Local-first collaborative documents with safe version history, realtime editing, and a workflow designed for serious drafts.
          </p>
        </div>

        <div className="grid gap-3 text-sm text-[color:var(--muted)] sm:grid-cols-2 sm:gap-x-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 transition hover:text-[var(--foreground)]">
            <MoveUpRight size={15} />
            Dashboard
          </Link>
          <a href="https://github.com/Rushi2410" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 transition hover:text-[var(--foreground)]">
            <Github size={15} />
            GitHub
          </a>
          <Link href="/register" className="inline-flex items-center gap-2 transition hover:text-[var(--foreground)]">
            <MoveUpRight size={15} />
            Create account
          </Link>
          <a href="https://www.linkedin.com/in/rushikesh-andhale1010/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 transition hover:text-[var(--foreground)]">
            <Linkedin size={15} />
            LinkedIn
          </a>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4 text-xs text-[color:var(--muted)]">
        <span>Designed and built by Rushikesh Andhale</span>
        <span>Workspace for specs, notes, and living drafts</span>
      </div>
    </footer>
  );
}

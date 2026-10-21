import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// The reading pages (/consulting, /about, /privacy): a single way back to the chat.
export function SitePageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-page">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <Link
          href="/"
          className="mb-10 inline-flex h-11 items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-5 text-[15px] font-semibold text-[var(--foreground)] transition hover:border-[var(--foreground)]"
          data-cuelume-press="tick"
        >
          <ArrowLeft size={18} aria-hidden />
          Back to chat
        </Link>
        {children}
      </div>
    </div>
  );
}

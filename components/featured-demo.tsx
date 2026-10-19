"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { SITE } from "@/data/site";
import { demoMediaKind } from "@/lib/demo-media";

const serif =
  "font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif]";

// The portfolio project whose card shows the demo media (data/portfolio.ts).
export const KONTEKS_PROJECT_ID = "konteks";

function usePrefersReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return reduceMotion;
}

// SITE.konteksDemo as a video or image. With no src, a small placeholder line —
// never a broken embed.
export function KonteksDemoMedia({ className = "" }: { className?: string }) {
  const { src, poster } = SITE.konteksDemo;
  const kind = demoMediaKind(src);
  const reduceMotion = usePrefersReducedMotion();

  if (kind === "none" || !src) {
    return (
      <p
        className={`rounded-[1rem] border border-dashed border-[var(--border)] px-3 py-2 text-xs text-[var(--muted)] ${className}`}
      >
        Demo clip coming soon
      </p>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-[1rem] border border-[var(--border)] bg-[var(--panel)] ${className}`}
    >
      {kind === "video" ? (
        <video
          className="aspect-video max-h-56 w-full object-cover"
          src={src}
          poster={poster}
          autoPlay={!reduceMotion}
          muted
          loop
          playsInline
          controls={reduceMotion}
        />
      ) : (
        <div className="relative aspect-video max-h-56 w-full">
          <Image
            src={src}
            alt="Konteks demo: Grok Bots sending Live Activities to an iPhone"
            fill
            unoptimized
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 32rem"
          />
        </div>
      )}
    </div>
  );
}

// Compact featured card for the General Chat empty state.
export function FeaturedDemo({ onAsk }: { onAsk?: () => void }) {
  return (
    <section
      aria-label="Featured: Konteks"
      className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--panel-strong)] p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow text-[10px] text-[var(--muted)]">Work in progress</p>
          <h3 className={`mt-1 text-xl tracking-[-0.03em] ${serif}`}>Konteks</h3>
        </div>
        {onAsk ? (
          <button
            type="button"
            onClick={onAsk}
            className="shrink-0 rounded-full border border-[var(--border)] px-3 py-1.5 text-[var(--foreground)] transition hover:-translate-y-px hover:border-[var(--border-strong)]"
            data-cuelume-press="tick"
          >
            <span className="text-xs">Ask about it</span>
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
        James&apos;s Grok Bots send Live Activities to his iPhone — a live layer of context about
        what&apos;s going on.
      </p>
      <KonteksDemoMedia className="mt-3" />
    </section>
  );
}

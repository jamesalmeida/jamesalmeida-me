"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { SITE } from "@/data/site";
import { demoMediaKind } from "@/lib/demo-media";

const serif =
  "font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif]";

function Placeholder() {
  return (
    <div className="flex h-full min-h-[16rem] items-center justify-center bg-[var(--panel-strong)] px-6 py-10 sm:min-h-[20rem]">
      <div className="w-full max-w-sm rounded-[1.25rem] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
        <p className="eyebrow text-[10px] text-[var(--muted)]">Live Activity</p>
        <p className={`mt-2 text-2xl tracking-[-0.03em] ${serif}`}>Konteks</p>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Grok Bots send Live Activities to my iPhone — a live layer of context about what&apos;s
          going on.
        </p>
        <p className="mt-4 text-xs text-[var(--muted)]">Demo clip coming soon</p>
      </div>
    </div>
  );
}

export function FeaturedDemo() {
  const { src, poster } = SITE.konteksDemo;
  const kind = demoMediaKind(src);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return (
    <section id="featured" className="space-y-4">
      <p className="eyebrow text-xs text-[var(--muted)]">Featured</p>
      <h2 className={`text-3xl tracking-[-0.03em] sm:text-4xl ${serif}`}>Konteks</h2>
      <p className="max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
        My Grok Bots send Live Activities to my iPhone. It&apos;s a work in progress — a live
        layer of context about what&apos;s going on, not a shipped product.
      </p>
      <div className="overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)]">
        {kind === "none" || !src ? (
          <Placeholder />
        ) : kind === "video" ? (
          <video
            className="aspect-video h-auto w-full object-cover"
            src={src}
            poster={poster}
            autoPlay={!reduceMotion}
            muted
            loop
            playsInline
            controls={reduceMotion}
          />
        ) : (
          <div className="relative aspect-video">
            <Image
              src={src}
              alt="Konteks demo: Grok Bots sending Live Activities to an iPhone"
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 64rem"
            />
          </div>
        )}
      </div>
    </section>
  );
}

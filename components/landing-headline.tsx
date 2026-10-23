"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { REVEAL_HEADLINE } from "@/lib/landing-settings";

// "What can AI do for you?" first reads "What can I do for you?", then an "A" slides
// in next to the "I". The "A" is always in the DOM (collapsed at first), so crawlers
// and screen readers get the full headline. Other headlines (the A/B test) show as
// they are.
const AI_INDEX = REVEAL_HEADLINE.indexOf("AI");

// The landing h1's text. `still` (StaticIntro, before hydration) holds the first
// frame; the chat's landing plays the reveal, also after New chat.
export function LandingHeadline({ text, still = false }: { text: string; still?: boolean }) {
  const reduceMotion = useReducedMotion();
  // Driven by state, not `initial`: the landing's AnimatePresence has initial={false},
  // which skips its children's entrance animations.
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (still) return;
    const timer = window.setTimeout(() => setRevealed(true), reduceMotion ? 0 : 1100);
    return () => window.clearTimeout(timer);
  }, [still, reduceMotion]);

  if (text !== REVEAL_HEADLINE || AI_INDEX === -1) return text;

  const collapsed = { width: 0, opacity: 0, y: "-0.35em" };
  return (
    <>
      {text.slice(0, AI_INDEX)}
      {/* Top-aligned: an inline-block with overflow hidden sits on its bottom edge. */}
      <motion.span
        className="inline-block overflow-hidden align-top"
        initial={collapsed}
        animate={revealed ? { width: "auto", opacity: 1, y: 0 } : collapsed}
        transition={
          reduceMotion
            ? { duration: 0 }
            : {
                width: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
                opacity: { delay: 0.15, duration: 0.4 },
                y: { delay: 0.15, type: "spring", stiffness: 380, damping: 18 },
              }
        }
      >
        A
      </motion.span>
      {text.slice(AI_INDEX + 1)}
    </>
  );
}

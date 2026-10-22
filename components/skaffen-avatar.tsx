"use client";

import { useEffect, useState } from "react";
import { SITE } from "@/data/site";
import { AVATAR_STAGE, avatarStyles, resolveAvatarConfig, type AvatarMood } from "@/lib/avatar";

const styles = avatarStyles(resolveAvatarConfig(SITE.assistant.avatar));

// How long the happy squint lasts before Skaffen goes back to waiting.
const HAPPY_MS = 2800;

type SkaffenAvatarProps = {
  mood?: AvatarMood;
  /** Only the newest reply animates; older avatars sit still. */
  animated?: boolean;
  size?: number;
};

// Skaffen's face: a shape with two eyes, drawn on a 200 px stage and scaled to
// `size`. Keyframes and transitions live in globals.css (.skaffen-*), so
// prefers-reduced-motion turns them off; each mood also has a still pose.
export function SkaffenAvatar({ mood = "idle", animated = true, size = 28 }: SkaffenAvatarProps) {
  return (
    <span aria-hidden className="relative block shrink-0" style={{ width: size, height: size }}>
      <span
        className={`skaffen-avatar skaffen-${mood}${animated ? "" : " is-still"}`}
        style={{ width: AVATAR_STAGE, height: AVATAR_STAGE, transform: `scale(${size / AVATAR_STAGE})` }}
      >
        <span className="skaffen-frame" style={styles.frame}>
          <span className="skaffen-body" style={styles.body}>
            <span className="skaffen-shine" style={{ opacity: styles.shineOpacity }} />
          </span>
          <span className="skaffen-look" style={styles.look}>
            {mood === "happy" ? (
              <>
                <span className="skaffen-arc" style={{ borderColor: styles.eyeColor }} />
                <span className="skaffen-arc" style={{ borderColor: styles.eyeColor }} />
              </>
            ) : (
              <>
                <span className="skaffen-eye" style={styles.leftEye} />
                <span className="skaffen-eye" style={styles.rightEye} />
              </>
            )}
          </span>
        </span>
      </span>
    </span>
  );
}

/** True for HAPPY_MS after `active` turns on (e.g. a new reply that carries the brief). */
export function useHappyMoment(active: boolean) {
  const [isHappy, setIsHappy] = useState(active);

  useEffect(() => {
    if (!active) return;
    setIsHappy(true);
    const timer = window.setTimeout(() => setIsHappy(false), HAPPY_MS);
    return () => window.clearTimeout(timer);
  }, [active]);

  return active && isHappy;
}

"use client";

import { useEffect } from "react";
import { CLIENT_EVENT_TYPES, type ClientEventType } from "@/lib/analytics";
import { trackEvent } from "@/lib/visit";

// Reports clicks on links with data-track (booking and email links) as funnel
// events. A data-conversation-id on an ancestor (the brief and booking cards) ties
// the click to that conversation. Rendered once, in the root layout.
export function ClickTracker() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("[data-track]") : null;
      const type = target?.getAttribute("data-track");
      if (!target || !(CLIENT_EVENT_TYPES as readonly string[]).includes(type ?? "")) return;
      const conversationId = target.closest("[data-conversation-id]")?.getAttribute("data-conversation-id");
      trackEvent(type as ClientEventType, conversationId ?? undefined);
    };
    // Capture, so a handler that stops propagation can't hide the click.
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);
  return null;
}

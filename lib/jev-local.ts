import type { BlockReason, JevDecision } from "./jev-decision";

// Requests for the assistant's or the site's secrets. Jev's rubrics ask the same
// question in prose; this catches the obvious phrasings even when that score
// stays under the block line. The visitor's own keys ("how do I store API keys")
// are not a match.

const OWNED =
  /\b(?:your|ur|the assistant|the bot|the model|skaffen|james)(?:'s|'|s)?\s+(?:\w+\s+){0,3}?(?:api[\s_-]*keys?|openai[\s_-]*keys?|anthropic[\s_-]*keys?|access[\s_-]*tokens?|auth(?:entication)?[\s_-]*tokens?|bearer[\s_-]*tokens?|secret[\s_-]*keys?|private[\s_-]*keys?|credentials?|passwords?|system[\s_-]*prompts?|environment[\s_-]*variables?|env[\s_-]*vars?|env[\s_-]*files?|\.env\b|secrets\b|tokens?\b)\b/i;

const REVEAL =
  /\b(?:give|send|share|show|tell|reveal|print|dump|leak|paste|expose|disclose|hand|output|repeat|drop)\b.{0,60}(?:\.env\b|\b(?:system[\s_-]*prompts?|developer[\s_-]*messages?|hidden[\s_-]*prompts?|environment[\s_-]*variables?|env[\s_-]*vars?|env[\s_-]*files?|behind the scenes|your\s+instructions|your\s+prompt|your\s+rules|your\s+secret\b))/i;

const ASK_WHAT_YOU_USE =
  /\b(?:what|which)\b.{0,40}\b(?:api[\s_-]*keys?|credentials?|passwords?|secret[\s_-]*keys?|access[\s_-]*tokens?|system[\s_-]*prompts?)\b.{0,40}\b(?:do you|are you|you)\s+(?:use|have|run|with)\b/i;

const IGNORE_INSTRUCTIONS =
  /\b(?:ignore|forget|disregard)\b.{0,80}\b(?:previous|prior|above|your|these|all|system)\b.{0,40}\b(?:instructions|rules|prompt)\b/i;

const ABUSE =
  /\b(?:steal|stealing|exfiltrat\w*|phish\w*)\b.{0,80}\b(?:your|ur)\b.{0,40}\b(?:api[\s_-]*keys?|credentials?|passwords?|secrets?|tokens?|access[\s_-]*tokens?)|\b(?:use|take|grab|copy|borrow)\b(?:\s+\w+){0,5}\s+your\s+(?:\w+\s+){0,3}?(?:api[\s_-]*keys?|credentials?|passwords?|secrets\b|tokens?|access[\s_-]*tokens?)|\bunauthori[sz]ed(?:ly)?\b.{0,60}\b(?:your|ur)\b.{0,30}\b(?:api[\s_-]*keys?|credentials?|passwords?|secrets?|tokens?|access[\s_-]*tokens?)\b/i;

const USE_THE_SECRET = /\b(?:use|spend|resell|sell|run)\s+(?:it|them|that|those|the key|the keys|the token)\b/i;

const HOW_TO = /\bhow\s+(?:do|to|can|should|would|could)\s+(?:i|we)\b/i;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .replace(/[\u2018\u2019`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function asksToReveal(text: string): boolean {
  return OWNED.test(text) || REVEAL.test(text) || ASK_WHAT_YOU_USE.test(text) || IGNORE_INSTRUCTIONS.test(text);
}

/**
 * Jailbreak when the message asks the assistant to reveal secret setup.
 * Abuse when it asks to take or use those secrets.
 */
export function localHazard(text: string): BlockReason | null {
  const normalized = normalize(text);
  if (!normalized) return null;
  if (ABUSE.test(normalized)) return "abuse";
  const reveal = asksToReveal(normalized);
  if (reveal && USE_THE_SECRET.test(normalized)) return "abuse";
  // "How do I write a system prompt" is about their work. "How do I get your API key" is not.
  if (HOW_TO.test(normalized) && !OWNED.test(normalized)) return null;
  if (reveal) return "jailbreak";
  return null;
}

/** Forces a block when the message asks for secrets. Keeps a Jev jailbreak or abuse label. */
export function applyLocalHazard(decision: JevDecision, text: string): JevDecision {
  const local = localHazard(text);
  if (!local) return decision;
  const modelReason = decision.blockReason;
  const keepModel =
    decision.action === "block" && (modelReason === "jailbreak" || modelReason === "abuse");
  return {
    ...decision,
    action: "block",
    blockReason: keepModel ? modelReason : local,
    nudge: "none",
    forceTool: false,
  };
}

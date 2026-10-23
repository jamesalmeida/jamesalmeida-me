// What the browser may report for analytics, and the checks the server runs on it.
// Client-safe and pure; the API routes call these before anything is stored.

import { BRIEF_FIELDS, MAX_BRIEF_FIELD_CHARS, type Brief } from "@/lib/brief";
import { DOWN_REASONS, MAX_FEEDBACK_DETAILS_CHARS } from "@/lib/feedback";

/** Visit ids are random UUIDs from the browser; conversation and message ids come from assistant-ui. */
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export const CLIENT_EVENT_TYPES = ["landing_view", "booking_clicked", "email_clicked", "example_sent"] as const;
export type ClientEventType = (typeof CLIENT_EVENT_TYPES)[number];

export const DEVICES = ["phone", "tablet", "desktop"] as const;

export type VisitContext = {
  headline?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  device?: string;
};

const MAX_CONTEXT_CHARS = 100;
/** Headlines and examples are edited in /admin (lib/landing-settings.ts caps them at 80). */
const MAX_LANDING_TEXT_CHARS = 120;
const MAX_REPLY_CHARS = 4000;
const MAX_USER_TEXT_CHARS = 2000;
const MAX_EMAIL_CHARS = 254;
const MAX_NAME_CHARS = 100;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function record(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
}

function text(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

export function parseId(value: unknown): string | undefined {
  return typeof value === "string" && ID_PATTERN.test(value) ? value : undefined;
}

/** Unknown keys are dropped; strings are trimmed and capped. */
export function parseVisitContext(input: unknown): VisitContext {
  const raw = record(input);
  const context: VisitContext = {};
  const headline = text(raw.headline, MAX_LANDING_TEXT_CHARS);
  if (headline) context.headline = headline;
  const device = text(raw.device, 20);
  if (device && (DEVICES as readonly string[]).includes(device)) context.device = device;
  for (const key of ["referrer", "utmSource", "utmMedium", "utmCampaign"] as const) {
    const value = text(raw[key], MAX_CONTEXT_CHARS);
    if (value) context[key] = value;
  }
  return context;
}

export function parseClientEvent(input: unknown) {
  const raw = record(input);
  const type = CLIENT_EVENT_TYPES.find((candidate) => candidate === raw.type);
  const visitId = parseId(raw.visitId);
  if (!type || !visitId) return null;
  // example_sent: the landing example the visitor sent by pressing send on an empty composer.
  const example = type === "example_sent" ? text(raw.example, MAX_LANDING_TEXT_CHARS) : undefined;
  if (type === "example_sent" && !example) return null;
  return {
    type,
    visitId,
    conversationId: parseId(raw.conversationId),
    ...(example ? { example } : {}),
    context: parseVisitContext(raw.context),
  };
}

export function parseFeedback(input: unknown) {
  const raw = record(input);
  const messageId = parseId(raw.messageId);
  const rating = raw.rating === "up" || raw.rating === "down" ? raw.rating : raw.rating === null ? null : undefined;
  if (!messageId || rating === undefined) return null;
  const reasons = Array.isArray(raw.reasons)
    ? raw.reasons.filter((reason): reason is string => (DOWN_REASONS as readonly unknown[]).includes(reason))
    : [];
  return {
    messageId,
    conversationId: parseId(raw.conversationId),
    rating,
    reasons,
    details: text(raw.details, MAX_FEEDBACK_DETAILS_CHARS) ?? "",
    replyText: text(raw.replyText, MAX_REPLY_CHARS) ?? "",
    userText: text(raw.userText, MAX_USER_TEXT_CHARS) ?? "",
  };
}

export function parseBrief(input: unknown): Brief {
  const raw = record(input);
  const brief: Brief = {};
  for (const { key } of BRIEF_FIELDS) {
    const value = text(raw[key], MAX_BRIEF_FIELD_CHARS);
    if (value) brief[key] = value;
  }
  return brief;
}

export function isValidEmail(value: string): boolean {
  return value.length <= MAX_EMAIL_CHARS && EMAIL_PATTERN.test(value);
}

export function parseLead(input: unknown) {
  const raw = record(input);
  const email = typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";
  if (!isValidEmail(email)) return null;
  return {
    email,
    name: text(raw.name, MAX_NAME_CHARS),
    brief: parseBrief(raw.brief),
    conversationId: parseId(raw.conversationId),
  };
}

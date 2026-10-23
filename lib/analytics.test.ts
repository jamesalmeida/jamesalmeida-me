import { describe, expect, it } from "vitest";
import { HEADLINES } from "@/data/site";
import { DOWN_REASONS } from "@/lib/feedback";
import { parseClientEvent, parseFeedback, parseId, parseLead, parseVisitContext } from "./analytics";

describe("parseId", () => {
  it("accepts short url-safe ids only", () => {
    expect(parseId("abc_DEF-123")).toBe("abc_DEF-123");
    expect(parseId("8f14e45f-ceea-467a-9575-1f8b5a1d6e3c")).toBeDefined();
    expect(parseId("has space")).toBeUndefined();
    expect(parseId("x".repeat(65))).toBeUndefined();
    expect(parseId(42)).toBeUndefined();
  });
});

describe("parseVisitContext", () => {
  it("keeps headlines, known devices and capped strings, and drops everything else", () => {
    expect(
      parseVisitContext({
        headline: HEADLINES[0],
        device: "phone",
        referrer: "news.ycombinator.com",
        utmSource: ` ${"s".repeat(150)} `,
        ip: "1.2.3.4",
      }),
    ).toEqual({
      headline: HEADLINES[0],
      device: "phone",
      referrer: "news.ycombinator.com",
      utmSource: "s".repeat(100),
    });
    // Headlines are edited in /admin, so any short text is kept (capped).
    expect(parseVisitContext({ headline: "A new headline", device: "fridge" })).toEqual({ headline: "A new headline" });
    expect(parseVisitContext({ headline: "h".repeat(200) })).toEqual({ headline: "h".repeat(120) });
    expect(parseVisitContext("nope")).toEqual({});
  });
});

describe("parseClientEvent", () => {
  it("accepts only the events the browser may send", () => {
    expect(parseClientEvent({ type: "booking_clicked", visitId: "v1", conversationId: "c1", context: {} })).toEqual({
      type: "booking_clicked",
      visitId: "v1",
      conversationId: "c1",
      context: {},
    });
    expect(parseClientEvent({ type: "chat_started", visitId: "v1" })).toBeNull();
    expect(parseClientEvent({ type: "landing_view" })).toBeNull();
  });

  it("keeps the example only on example_sent, which needs one", () => {
    expect(parseClientEvent({ type: "example_sent", visitId: "v1", example: " Will AI change my job? " })).toEqual({
      type: "example_sent",
      visitId: "v1",
      conversationId: undefined,
      example: "Will AI change my job?",
      context: {},
    });
    expect(parseClientEvent({ type: "example_sent", visitId: "v1" })).toBeNull();
    expect(parseClientEvent({ type: "landing_view", visitId: "v1", example: "x" })).not.toHaveProperty("example");
  });
});

describe("parseFeedback", () => {
  it("keeps known reasons, caps text and allows clearing", () => {
    const feedback = parseFeedback({
      messageId: "m1",
      rating: "down",
      reasons: [DOWN_REASONS[1], "<script>"],
      details: "  too long ".repeat(200),
      replyText: "Hi",
      userText: "Hello",
    });
    expect(feedback).toMatchObject({ messageId: "m1", rating: "down", reasons: [DOWN_REASONS[1]], replyText: "Hi", userText: "Hello" });
    expect(feedback!.details.length).toBeLessThanOrEqual(1000);
    expect(parseFeedback({ messageId: "m1", rating: null })).toMatchObject({ rating: null, details: "" });
    expect(parseFeedback({ messageId: "m1", rating: "meh" })).toBeNull();
    expect(parseFeedback({ rating: "up" })).toBeNull();
  });
});

describe("parseLead", () => {
  it("needs a valid email, normalises it and keeps only brief fields", () => {
    expect(
      parseLead({
        email: " Jane@Example.COM ",
        name: " Jane ",
        brief: { who: "A bakery owner", secret: "x", challenge: 5 },
        conversationId: "c1",
      }),
    ).toEqual({ email: "jane@example.com", name: "Jane", brief: { who: "A bakery owner" }, conversationId: "c1" });
    expect(parseLead({ email: "not-an-email" })).toBeNull();
    expect(parseLead({ email: `${"a".repeat(250)}@x.co` })).toBeNull();
    expect(parseLead({})).toBeNull();
  });
});

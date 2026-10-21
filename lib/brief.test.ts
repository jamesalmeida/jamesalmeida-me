import { describe, expect, it } from "vitest";
import { briefBookingHref, briefEntries, briefMailtoHref, briefText } from "./brief";

const brief = {
  who: "A bookkeeper, team of 3",
  challenge: "Chasing receipts & month-end",
  hopingFor: "  ",
};

describe("brief", () => {
  it("lists filled fields in display order", () => {
    expect(briefEntries({ challenge: "b", who: "a" }).map((entry) => entry.key)).toEqual([
      "who",
      "challenge",
    ]);
    expect(briefText(brief)).toBe("Who: A bookkeeper, team of 3\nWhat's in the way: Chasing receipts & month-end");
  });

  it("builds a mailto link with the brief in the body, encoded with %20", () => {
    const href = briefMailtoHref("james@gsv.to", brief);
    expect(href.startsWith("mailto:james@gsv.to?subject=Discovery%20call&body=")).toBe(true);
    expect(href).not.toContain("+");
    const body = new URLSearchParams(href.split("?")[1]).get("body");
    expect(body).toContain("Who: A bookkeeper, team of 3");
    expect(body).toContain("Chasing receipts & month-end");
  });

  it("adds the brief to the booking link as notes, keeping the link when empty", () => {
    const url = new URL(briefBookingHref("https://cal.com/someone/call", brief));
    expect(url.origin + url.pathname).toBe("https://cal.com/someone/call");
    expect(url.searchParams.get("notes")).toBe(briefText(brief));
    expect(briefBookingHref("https://cal.com/someone/call", {})).toBe("https://cal.com/someone/call");
  });
});

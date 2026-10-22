import { resolveConfig } from "@jamesalmeida/agent-avatars";
import { describe, expect, it } from "vitest";
import { SITE } from "@/data/site";

describe("SITE.assistant.avatar", () => {
  it("only uses options agent-avatars knows (unknown ones would silently fall back)", () => {
    expect(resolveConfig(SITE.assistant.avatar)).toEqual(SITE.assistant.avatar);
  });
});

import { describe, expect, it } from "vitest";
import { demoMediaKind } from "./demo-media";

describe("demoMediaKind", () => {
  it("returns none for missing src so the UI can show a placeholder", () => {
    expect(demoMediaKind(null)).toBe("none");
    expect(demoMediaKind(undefined)).toBe("none");
    expect(demoMediaKind("")).toBe("none");
    expect(demoMediaKind("   ")).toBe("none");
  });

  it("treats mp4 and webm as video", () => {
    expect(demoMediaKind("/media/konteks-demo.mp4")).toBe("video");
    expect(demoMediaKind("/media/konteks-demo.webm?v=2")).toBe("video");
  });

  it("treats gif and still images as image", () => {
    expect(demoMediaKind("/media/konteks-demo.gif")).toBe("image");
    expect(demoMediaKind("/media/konteks-demo.png")).toBe("image");
    expect(demoMediaKind("/media/konteks-demo.jpg")).toBe("image");
    expect(demoMediaKind("/media/konteks-demo.webp#poster")).toBe("image");
  });
});

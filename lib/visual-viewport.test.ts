import { describe, expect, it } from "vitest";
import { readVisualViewportBox } from "./visual-viewport";

describe("readVisualViewportBox", () => {
  it("fills the screen when the keyboard is closed", () => {
    expect(
      readVisualViewportBox({ innerHeight: 812, innerWidth: 375, height: 812, offsetTop: 0 }),
    ).toEqual({ height: 812, offset: 0, keyboardOpen: false });
  });

  it("keeps the shell in the visible area when iOS scrolls the visual viewport", () => {
    expect(
      readVisualViewportBox({ innerHeight: 812, innerWidth: 375, height: 380, offsetTop: 120 }),
    ).toEqual({ height: 380, offset: 120, keyboardOpen: true });
  });

  it("treats a short phone viewport as the keyboard being open", () => {
    // interactive-widget=resizes-content shrinks innerHeight with the keyboard,
    // so the overlap is zero and the short height is the signal.
    expect(
      readVisualViewportBox({ innerHeight: 390, innerWidth: 375, height: 390, offsetTop: 0 }),
    ).toMatchObject({ height: 390, offset: 0, keyboardOpen: true });
  });

  it("does not dock a normal desktop window", () => {
    expect(
      readVisualViewportBox({ innerHeight: 500, innerWidth: 1280, height: 500, offsetTop: 0 }),
    ).toMatchObject({ keyboardOpen: false });
  });
});
